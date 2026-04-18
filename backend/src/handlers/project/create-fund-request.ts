import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { createFundRequestSchema } from "../../schemas/project-schema";
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
  const result = createFundRequestSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  // Lead-only: per teacher consultation, budget operations (fund requests, realignment,
  // extension) belong to the project lead. Co-leads collaborate on reports and team work
  // but cannot move money.
  const { data: project } = await supabase
    .from("funded_projects")
    .select("id, project_lead_id")
    .eq("id", result.data.funded_project_id)
    .maybeSingle();

  if (!project || project.project_lead_id !== auth.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message:
          "Only the project lead can submit fund requests. Co-leads can collaborate on the project but cannot request funds.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.createFundRequest({
    ...result.data,
    requested_by: auth.userId,
  });

  if (error) {
    const statusCode = (error as any).code === "DUPLICATE_FUND_REQUEST" ? 409 : 500;
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
        code: (error as any).code,
      }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Fund request created successfully.",
      data,
    }),
  };
});
