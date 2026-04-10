import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getFundedProjectsSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Extract identity from JWT - never trust query params for user identity
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  // Determine role from JWT (priority: admin > rnd > proponent > co_lead)
  const roleFromJwt = auth.roles.includes("admin")
    ? "admin"
    : auth.roles.includes("rnd")
    ? "rnd"
    : auth.roles.includes("proponent")
    ? "proponent"
    : undefined;

  // Parse query parameters (only non-identity fields)
  const queryParams = event.queryStringParameters || {};

  const input = {
    user_id: auth.userId,
    role: roleFromJwt as "proponent" | "rnd" | "admin" | undefined,
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
