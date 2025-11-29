import { APIGatewayProxyEvent } from "aws-lambda";
import { setCookieString } from "../../utils/cookies";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  console.log("Logging out user...");

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully logged out.",
    }),
    headers: {
      "Set-Cookie": setCookieString("tk", "", { maxAge: 0 }),
    },
  };
});
