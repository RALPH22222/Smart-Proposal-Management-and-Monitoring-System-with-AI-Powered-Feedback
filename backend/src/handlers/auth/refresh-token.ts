import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { setCookieString, parseCookie } from "../../utils/cookies";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const cookies = parseCookie(event.headers?.Cookie || event.headers?.cookie || "");
  const refreshToken = cookies.rt;

  if (!refreshToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "No refresh token" }),
    };
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Refresh failed" }),
      headers: {
        "Set-Cookie": [
          setCookieString("tk", "", { maxAge: 0 }),
          setCookieString("rt", "", { maxAge: 0 }),
        ].join(", "),
      },
    };
  }

  const accessCookie = setCookieString("tk", data.session.access_token, {
    maxAge: 3600, // 1 hour
  });
  const refreshCookie = setCookieString("rt", data.session.refresh_token, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Token refreshed" }),
    multiValueHeaders: {
      "Set-Cookie": [accessCookie, refreshCookie],
    },
  };
});
