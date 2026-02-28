import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { createAccountSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.createAccount(parsed.data);

    if (error) {
      return {
        statusCode: (error as any).status || 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to create account" }),
      };
    }

    const { userId } = getAuthContext(event);
    await logActivity(supabase, {
      user_id: userId,
      action: "account_created",
      category: "account",
      target_id: data?.user?.id || undefined,
      target_type: "user",
      details: { email: parsed.data.email, roles: parsed.data.roles },
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Account created successfully", data }),
    };
  } catch (err: any) {
    console.error("Error creating account:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
