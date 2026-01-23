import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (_event: APIGatewayProxyEvent) => {
  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.getOverdueReports();

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
      message: "Overdue reports retrieved successfully.",
      data,
      count: data?.length || 0,
    }),
  };
});
