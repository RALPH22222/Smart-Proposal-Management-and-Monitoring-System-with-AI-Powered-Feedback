import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getReportCommentsSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};

  const input = {
    project_reports_id: queryParams.project_reports_id ? parseInt(queryParams.project_reports_id) : undefined,
  };

  // Payload Validation
  const result = getReportCommentsSchema.safeParse(input);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.getReportComments(result.data);

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
    statusCode: 200,
    body: JSON.stringify({
      message: "Comments retrieved successfully.",
      data,
    }),
  };
});
