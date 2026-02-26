import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getProjectMembersSchema } from "../../schemas/project-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const queryParams = event.queryStringParameters || {};

  // Payload Validation
  const result = getProjectMembersSchema.safeParse({
    funded_project_id: queryParams.funded_project_id,
  });

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
  const { data, error } = await projectService.getProjectMembers(result.data);

  if (error) {
    console.error("Get project members error: ", JSON.stringify(error, null, 2));
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
      message: "Project members retrieved successfully.",
      data,
    }),
  };
});
