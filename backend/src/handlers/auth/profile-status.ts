import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { AuthService } from "../../services/auth.service";

export const handler = buildCorsHeaders(async (event) => {
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }
  const authService = new AuthService(supabase);
  const { data, error: profileStatusError } = await authService.profileStatus(auth.userId);

  if (profileStatusError) {
    console.error("Supabase error: ", JSON.stringify(profileStatusError, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      isCompleted: data!.isCompleted,
      passwordChangeRequired: data!.passwordChangeRequired,
    }),
  };
});
