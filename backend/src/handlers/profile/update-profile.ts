import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { ProfileService } from "../../services/profile.service";
import { updateProfileSchema } from "../../schemas/profile-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: parsed.error.issues[0]?.message || "Invalid input",
      }),
    };
  }

  try {
    const service = new ProfileService(supabase);
    const { data, error } = await service.updateProfile(auth.userId, parsed.data);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to update profile" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
