import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { markNotificationReadSchema } from "../../schemas/notification-schema";

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

    // Handle "mark all" case
    if (payload.mark_all === true) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", auth.userId)
        .eq("is_read", false);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: error.message }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "All notifications marked as read." }),
      };
    }

    // Handle specific notification IDs
    const result = markNotificationReadSchema.safeParse(payload);
    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ type: "validation_error", data: result.error.issues }),
      };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", auth.userId)
      .in("id", result.data.notification_ids);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Notifications marked as read." }),
    };
  } catch (err: any) {
    console.error("Error marking notifications:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
