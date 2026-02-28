import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const params = event.queryStringParameters || {};

    const filters = {
      category: params.category || undefined,
      action: params.action || undefined,
      user_id: params.user_id || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page ? parseInt(params.page, 10) : 1,
      limit: params.limit ? parseInt(params.limit, 10) : 50,
    };

    const service = new AdminService(supabase);
    const { data, error, count } = await service.getActivityLogs(filters);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch activity logs" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count,
          total_pages: Math.ceil((count || 0) / filters.limit),
        },
      }),
    };
  } catch (err: any) {
    console.error("Error fetching activity logs:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
