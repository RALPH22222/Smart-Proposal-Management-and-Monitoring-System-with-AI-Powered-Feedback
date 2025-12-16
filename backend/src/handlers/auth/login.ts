import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { setCookieString } from "../../utils/cookies";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const authService = new AuthService(supabase);
  const { email, password } = JSON.parse(event.body || "{}");
  const { data, error } = await authService.login(email, password);

  if (error) {
    console.error("Error during login: ", JSON.stringify(error, null, 2));
    return {
      statusCode: error.status || 400,
      body: JSON.stringify({
        message: error.message || error.code,
      }),
    };
  }

  console.log("Data response: ", JSON.stringify(data, null, 2));
  console.log("Successfully logged in.");

  const userRole = data.user?.user_metadata?.role || data.user?.role;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully logged in.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: userRole,
      },
    }),
    headers: {
      "Set-Cookie": setCookieString("tk", data.session!.access_token),
    },
  };
});