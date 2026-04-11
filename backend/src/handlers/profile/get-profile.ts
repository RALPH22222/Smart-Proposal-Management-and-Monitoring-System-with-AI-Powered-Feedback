import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { ProfileService } from "../../services/profile.service";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  try {
    const service = new ProfileService(supabase);
    const { data, error } = await service.getProfile(auth.userId);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to fetch profile" }),
      };
    }

    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Profile not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error("Error fetching profile:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
