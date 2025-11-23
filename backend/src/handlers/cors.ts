import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { buildCorsHeaders } from '../utils/cors';

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      body: "",
    };
  }

  // Normal request
  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
});
