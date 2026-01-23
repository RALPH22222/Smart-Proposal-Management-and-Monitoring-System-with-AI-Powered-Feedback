import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getProjectSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};

  const input = {
    project_id: queryParams.project_id ? parseInt(queryParams.project_id) : undefined,
  };

  // Payload Validation
  const result = getProjectSchema.safeParse(input);

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
  const { data, error } = await projectService.getProject(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  if (!data) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Project not found.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Project retrieved successfully.",
      data,
    }),
  };
});
