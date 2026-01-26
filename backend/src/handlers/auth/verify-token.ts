import { supabase } from "../../lib/supabase";
import { APIGatewayProxyEvent } from "aws-lambda";
import { buildCorsHeaders } from "../../utils/cors";
import { AuthService } from "../../services/auth.service";
import { parseCookie } from "../../utils/cookies";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const cookie_str = event.headers.cookie ?? event.headers.Cookie;

  if (!cookie_str) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized access" }) };
  }

  const cookies = parseCookie(cookie_str);
  if (!cookies.tk) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized access" }) };
  }

  const authService = new AuthService(supabase);

  const { data, error } = await authService.verifyToken(cookies.tk);

  if (error) {
    console.error("Error verify token:", error);
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized access" }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
});
