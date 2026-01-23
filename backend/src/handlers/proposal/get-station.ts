import { APIGatewayProxyEvent } from "aws-lambda";
import { buildCorsHeaders } from "../../utils/cors";

// Note: No 'stations' table exists in the database.
// This handler returns an empty array to prevent CORS errors on the frontend.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Return empty array - stations table doesn't exist
  return {
    statusCode: 200,
    body: JSON.stringify([]),
  };
});
