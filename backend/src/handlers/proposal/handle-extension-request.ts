import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { handleExtensionRequestSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const user_sub = event.requestContext.authorizer?.user_sub as string;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = handleExtensionRequestSchema.safeParse(payload);

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
  const { data, error } = await proposalService.handleExtensionRequest(result.data, user_sub);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    const message = error.message || "Internal server error.";
    const lower = message.toLowerCase();
    const statusCode =
      lower.includes("not found")
        ? 404
        : lower.includes("pending extension request")
          ? 400
          : 500;

    return {
      statusCode,
      body: JSON.stringify({
        message,
      }),
    };
  }

  await logActivity(supabase, {
    user_id: user_sub,
    action: "extension_request_handled",
    category: "evaluation",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
    details: { action: result.data.action, evaluator_id: result.data.evaluator_id },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Extension request processed successfully.",
      data,
    }),
  };
});
