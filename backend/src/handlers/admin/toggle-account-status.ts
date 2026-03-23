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

    const { userId } = getAuthContext(event);
    const service = new AdminService(supabase);
    const { is_disabled, user_id, reassignments } = parsed.data;

    let data;
    let error;

    // If disabling with reassignments, use the reassignment flow
    if (is_disabled && reassignments && (reassignments.rnd.length > 0 || reassignments.evaluator.length > 0)) {
      const result = await service.disableWithReassignment({
        user_id,
        reassignments,
        admin_id: userId,
      });
      data = result.data;
      error = result.error;
    } else {
      const result = await service.toggleAccountStatus({ user_id, is_disabled });
      data = result.data;
      error = result.error;
    }

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to toggle account status" }),
      };
    }

    const action = is_disabled ? "disabled" : "enabled";

    await logActivity(supabase, {
      user_id: userId,
      action: is_disabled ? "account_disabled" : "account_enabled",
      category: "account",
      target_id: user_id,
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
