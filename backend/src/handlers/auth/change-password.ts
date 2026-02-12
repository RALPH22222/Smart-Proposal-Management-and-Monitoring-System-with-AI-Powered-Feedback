import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { AuthService } from "../../services/auth.service";
import { changePasswordSchema } from "../../schemas/auth-schema";

export const handler = buildCorsHeaders(async (event) => {
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: parsed.error.issues[0]?.message || "Invalid input",
      }),
    };
  }

  const authService = new AuthService(supabase);
  const { error } = await authService.changePassword(auth.userId, parsed.data.new_password);

  if (error) {
    console.error("Change password error:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || "Failed to change password" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Password changed successfully" }),
  };
});
