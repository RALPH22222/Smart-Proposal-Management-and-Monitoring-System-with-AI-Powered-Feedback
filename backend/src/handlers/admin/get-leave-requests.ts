import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const ALLOWED_ROLES = ["rnd", "evaluator", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };
  }

  try {
    const params = event.queryStringParameters || {};
    const isAdmin = auth.roles.includes("admin");

    const service = new AdminService(supabase);
    const { data, error } = await service.getLeaveRequests({
      status: params.status,
      // Non-admin users can only see their own leave requests
      user_id: isAdmin ? params.user_id : auth.userId,
    });

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ message: (error as any).message || "Failed to fetch leave requests" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ data }) };
  } catch (err: any) {
    console.error("Error fetching leave requests:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
