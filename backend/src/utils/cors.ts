import { APIGatewayProxyEvent, APIGatewayProxyHandler, Callback, Context } from "aws-lambda";

// Keep this list in sync with ALLOWED_ORIGINS in backend/lib/backend-stack.ts. Both need to
// match or the API Gateway preflight will succeed while the Lambda's per-response CORS
// header is wrong (or vice versa), and the browser will silently block the actual request.
const allowedOrigins = [
  "http://localhost:5173",
  "https://www.wmsu-rdec.com",
  "https://wmsu-rdec.com",
];

export const buildCorsHeaders = (cb: APIGatewayProxyHandler) => {
  // build cors headers first function call
  // ...
  return async function (event: APIGatewayProxyEvent, context: Context, callback: Callback) {
    console.log("Event Received: ", JSON.stringify(event, null, 2));
    // second function call (this only executes after running the first function call)
    const result = await cb(event, context, callback);

    const origin = event.headers?.origin || event.headers?.Origin || undefined;

    const headers: Record<string, string> = {
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    };

    if (origin && allowedOrigins.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }

    console.log("Status Code: ", result?.statusCode);
    console.log("Body Response: ", JSON.stringify(result, null, 2));
    return {
      ...result,
      headers: {
        ...(result?.headers || {}),
        ...headers,
      },
    };
  };
};
