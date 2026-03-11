import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  try {
    const service = new AdminService(supabase);
    const { data, error } = await service.getLateSubmissionPolicy();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch late submission policy" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  } catch (err: any) {
    console.error("Error fetching late submission policy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
