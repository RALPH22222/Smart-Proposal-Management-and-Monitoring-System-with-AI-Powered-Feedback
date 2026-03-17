import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { requestLeaveSchema } from "../../schemas/leave-schema";

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
    const payload = JSON.parse(event.body || "{}");
    const result = requestLeaveSchema.safeParse(payload);

    if (result.error) {
      return { statusCode: 400, body: JSON.stringify({ type: "validation_error", data: result.error.issues }) };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.requestLeave(auth.userId, result.data);

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ message: (error as any).message || "Failed to request leave" }) };
    }

    // Notify admins about the leave request
    try {
      const { data: admins } = await supabase.from("users").select("id").contains("roles", ["admin"]);
      if (admins && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            message: `A leave request has been submitted and is awaiting your review.`,
            is_read: false,
          })),
        );
      }
    } catch (notifErr) {
      console.error("Notification failed (non-blocking):", notifErr);
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Leave request submitted", data }) };
  } catch (err: any) {
    console.error("Error requesting leave:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
