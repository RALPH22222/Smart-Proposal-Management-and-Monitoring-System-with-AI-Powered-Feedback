import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { submitReportSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = submitReportSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  // Verify submitter is an active member (lead or co-lead) of the funded project
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("funded_project_id", result.data.funded_project_id)
    .eq("user_id", result.data.submitted_by_proponent_id)
    .eq("status", "active")
    .single();

  if (!membership) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You are not an active member of this project.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.submitQuarterlyReport(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));

    // Check for duplicate report error
    if ((error as any).code === "DUPLICATE_REPORT") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }

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
      message: "Quarterly report submitted successfully.",
      data,
    }),
  };
});
