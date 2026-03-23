import { APIGatewayProxyEvent } from "aws-lambda";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const lat = event.queryStringParameters?.lat;
  const lon = event.queryStringParameters?.lon;

  if (!lat || !lon) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "lat and lon query parameters are required." }),
    };
  }

  const ORS_API_KEY = process.env.ORS_API_KEY;
  if (!ORS_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "ORS_API_KEY is not configured on the server." }),
    };
  }

  try {
    const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${lon}&point.lat=${lat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouteService error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ message: "Error from OpenRouteService", detail: errorText }),
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error during geocoding." }),
    };
  }
});
