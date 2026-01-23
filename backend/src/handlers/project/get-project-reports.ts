import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getProjectReportsSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};

  const input = {
    funded_project_id: queryParams.funded_project_id ? parseInt(queryParams.funded_project_id) : undefined,
    status: queryParams.status as any,
  };

  // Payload Validation
  const result = getProjectReportsSchema.safeParse(input);

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
  const { data, error } = await projectService.getProjectReports(result.data);

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
      message: "Project reports retrieved successfully.",
      data,
    }),
  };
});
