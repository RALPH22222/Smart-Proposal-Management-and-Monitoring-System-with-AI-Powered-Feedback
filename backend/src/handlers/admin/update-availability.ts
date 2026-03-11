import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { updateAvailabilitySchema } from "../../schemas/settings-schema";
import { logActivity } from "../../utils/activity-logger";

const ALLOWED_ROLES = ["evaluator", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "Forbidden: Only evaluators can update availability." }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = updateAvailabilitySchema.safeParse(payload);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ type: "validation_error", data: result.error.issues }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.updateAvailability(auth.userId, result.data.is_available);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: (error as any).message || "Failed to update availability" }),
      };
    }

    await logActivity(supabase, {
      user_id: auth.userId,
      action: result.data.is_available ? "evaluator_available" : "evaluator_unavailable",
      category: "settings",
      target_type: "user",
      target_id: auth.userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Availability updated.", data }),
    };
  } catch (err: any) {
    console.error("Error updating availability:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
