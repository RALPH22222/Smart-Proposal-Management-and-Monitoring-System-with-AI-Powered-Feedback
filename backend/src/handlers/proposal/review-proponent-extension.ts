import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { reviewProponentExtensionSchema } from "../../schemas/proposal-schema";
import { getAuthContext } from "../../utils/auth-context";

const ALLOWED_ROLES = ["rnd", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: Only R&D staff or admins can review extension requests.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = reviewProponentExtensionSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.reviewProponentExtension(result.data, auth.userId);

  if (error) {
    console.error("Review extension error:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Extension request ${result.data.action} successfully.`,
      data,
    }),
  };
});
