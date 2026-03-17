import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { reviewLeaveSchema } from "../../schemas/leave-schema";

const ALLOWED_ROLES = ["admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: Admin only" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = reviewLeaveSchema.safeParse(payload);

    if (result.error) {
      return { statusCode: 400, body: JSON.stringify({ type: "validation_error", data: result.error.issues }) };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.reviewLeave({
      ...result.data,
      reviewer_id: auth.userId,
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ message: (error as any).message || "Failed to review leave" }) };
    }

    // Notify the requester
    if (data) {
      await supabase.from("notifications").insert({
        user_id: data.user_id,
        message: `Your leave request has been ${result.data.status}.`,
        is_read: false,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Leave request ${result.data.status}`, data }) };
  } catch (err: any) {
    console.error("Error reviewing leave:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
