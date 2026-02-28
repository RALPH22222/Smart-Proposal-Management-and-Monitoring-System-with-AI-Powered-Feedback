import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { toggleAccountStatusSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = toggleAccountStatusSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.toggleAccountStatus(parsed.data);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to toggle account status" }),
      };
    }

    const action = parsed.data.is_disabled ? "disabled" : "enabled";

    const { userId } = getAuthContext(event);
    await logActivity(supabase, {
      user_id: userId,
      action: parsed.data.is_disabled ? "account_disabled" : "account_enabled",
      category: "account",
      target_id: parsed.data.user_id,
      target_type: "user",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Account ${action} successfully`, data }),
    };
  } catch (err: any) {
    console.error("Error toggling account status:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
