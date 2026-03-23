import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { checkActiveAssignmentsSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const { roles } = getAuthContext(event);
    if (!roles.includes("admin")) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Admin access required" }),
      };
    }

    const userId = event.queryStringParameters?.user_id;
    const parsed = checkActiveAssignmentsSchema.safeParse({ user_id: userId });

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.checkActiveAssignments(parsed.data.user_id);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to check assignments" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error("Error checking active assignments:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
