import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { updateAccountSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.updateAccount(parsed.data);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to update account" }),
      };
    }

    const { userId } = getAuthContext(event);
    await logActivity(supabase, {
      user_id: userId,
      action: "account_updated",
      category: "account",
      target_id: parsed.data.user_id,
      target_type: "user",
      details: { updated_fields: Object.keys(parsed.data).filter(k => k !== "user_id") },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Account updated successfully", data }),
    };
  } catch (err: any) {
    console.error("Error updating account:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
