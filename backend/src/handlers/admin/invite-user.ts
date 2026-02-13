import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { inviteUserSchema } from "../../schemas/admin-schema";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectTo = `${frontendUrl}/accept-invite`;

    const service = new AdminService(supabase);
    const { data, error } = await service.inviteUser(parsed.data, redirectTo);

    if (error) {
      return {
        statusCode: (error as any).status || 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to send invitation" }),
      };
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Invitation sent successfully", data }),
    };
  } catch (err: any) {
    console.error("Error inviting user:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
