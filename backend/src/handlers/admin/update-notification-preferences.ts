import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { notificationPreferencesSchema } from "../../schemas/settings-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = notificationPreferencesSchema.safeParse(payload);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ type: "validation_error", data: result.error.issues }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.updateNotificationPreferences(auth.userId, result.data);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: (error as any).message || "Failed to update notification preferences" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Notification preferences updated.", data }),
    };
  } catch (err: any) {
    console.error("Error updating notification preferences:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
