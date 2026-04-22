import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { z } from "zod";
import { getAuthContext } from "../../utils/auth-context";

const schema = z.object({
  funded_project_id: z.coerce.number().int().positive(),
});

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const params = event.queryStringParameters || {};

  const result = schema.safeParse(params);

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
  const access = await projectService.assertCanAccessFundedProject(
    auth.userId,
    auth.roles,
    result.data.funded_project_id,
  );
  if (access.error) {
    const code = (access.error as any).code;
    return {
      statusCode: code === "PROJECT_NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 500,
      body: JSON.stringify({
        message: (access.error as any).message || "Internal server error.",
        code,
      }),
    };
  }

  const { data, error } = await projectService.getBudgetSummary(result.data.funded_project_id);

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
      message: "Budget summary retrieved successfully.",
      data,
    }),
  };
});
