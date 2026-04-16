import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { requestProjectExtensionSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Extract authenticated user from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = requestProjectExtensionSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  // Verify requester is an active member or lead of the funded project
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("funded_project_id", result.data.funded_project_id)
    .eq("user_id", auth.userId)
    .neq("status", "removed")
    .single();

  if (!membership) {
    // Check if user is the project lead
    const { data: project } = await supabase
      .from("funded_projects")
      .select("id")
      .eq("id", result.data.funded_project_id)
      .eq("project_lead_id", auth.userId)
      .single();

    if (!project) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "You are not authorized to request extensions for this project.",
        }),
      };
    }
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.requestProjectExtension({
    ...result.data,
    requested_by: auth.userId,
  });

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Extension request submitted successfully.",
      data,
    }),
  };
});
