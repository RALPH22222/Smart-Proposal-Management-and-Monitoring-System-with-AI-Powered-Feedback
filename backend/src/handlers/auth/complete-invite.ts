import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { completeInviteSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const { userId } = getAuthContext(event);

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const parsed = completeInviteSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const { first_name, last_name, middle_ini } = parsed.data;

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        middle_ini: middle_ini || null,
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Profile updated successfully", data }),
    };
  } catch (err: any) {
    console.error("Error completing invite:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
