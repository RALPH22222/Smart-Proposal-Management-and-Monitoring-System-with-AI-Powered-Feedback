import { APIGatewayProxyEvent } from "aws-lambda";
import { buildCorsHeaders } from "../../utils/cors";
import { AuthService } from "../../services/auth.service";
import { parseCookie } from "../../utils/cookies";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const authService = new AuthService();
  const cookie_str = event.headers.Cookie;

  if (!cookie_str) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Unauthorized access",
      }),
    };
  }

  const cookies = parseCookie(cookie_str);

  const { data, error } = await authService.verifytoken(cookies.tk);

  if (error) {
    console.error("Error verify token: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Error verify token",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});
