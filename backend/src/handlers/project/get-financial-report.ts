import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { z } from "zod";

const querySchema = z.object({
  funded_project_id: z.coerce.number().int().positive(),
});

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const params = event.queryStringParameters || {};

  const result = querySchema.safeParse(params);

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
  const { data, error } = await projectService.getFinancialReport(result.data.funded_project_id);

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
      message: "Financial report generated successfully.",
      data,
    }),
  };
});
