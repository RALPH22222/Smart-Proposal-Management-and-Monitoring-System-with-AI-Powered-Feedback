import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getFundedProjectsSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};

  const input = {
    user_id: queryParams.user_id,
    role: queryParams.role as "proponent" | "rnd" | "admin" | undefined,
    status: queryParams.status as any,
    limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
    offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
  };

  // Payload Validation
  const result = getFundedProjectsSchema.safeParse(input);

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
  const { data, error } = await projectService.getFundedProjects(result.data);

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
      message: "Funded projects retrieved successfully.",
      data,
    }),
  };
});
