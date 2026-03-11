import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { evaluationDeadlineSchema } from "../../schemas/settings-schema";

const ALLOWED_ROLES = ["rnd", "admin"];

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
      body: JSON.stringify({ message: "Forbidden: Only R&D staff and admins can update evaluation deadline." }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = evaluationDeadlineSchema.safeParse(payload);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ type: "validation_error", data: result.error.issues }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.updateEvaluationDeadline(result.data, auth.userId);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: (error as any).message || "Failed to update evaluation deadline" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Default evaluation deadline updated.", data }),
    };
  } catch (err: any) {
    console.error("Error updating evaluation deadline:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
