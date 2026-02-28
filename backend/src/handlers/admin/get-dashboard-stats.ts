import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (_event: APIGatewayProxyEvent) => {
  try {
    const service = new AdminService(supabase);
    const { data, error } = await service.getAdminDashboardStats();

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch dashboard stats" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error("Error fetching dashboard stats:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
