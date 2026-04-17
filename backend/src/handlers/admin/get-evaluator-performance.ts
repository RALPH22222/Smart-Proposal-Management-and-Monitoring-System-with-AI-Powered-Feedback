import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

// GET /admin/evaluator-performance
// Admin-only. Returns one row per evaluator with aggregated workload and
// decision metrics for the Evaluator Performance dashboard.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }
  if (!auth.roles.includes("admin")) {
    return { statusCode: 403, body: JSON.stringify({ message: "Admin role required" }) };
  }

  try {
    const service = new AdminService(supabase);
    const { data, error } = await service.getEvaluatorPerformance();

    if (error) {
      console.error("Evaluator performance error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch evaluator performance" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  } catch (err: any) {
    console.error("Error fetching evaluator performance:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
