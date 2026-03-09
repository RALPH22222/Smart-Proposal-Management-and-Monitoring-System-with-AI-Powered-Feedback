import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { forwardToRndSchema } from "../../schemas/proposal-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = forwardToRndSchema.safeParse(payload);

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
  const { error } = await proposalService.forwardToRnd(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
      }),
    };
  }

  const { userId } = getAuthContext(event);
  await logActivity(supabase, {
    user_id: userId,
    action: "proposal_forwarded_to_rnd",
    category: "proposal",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
    details: { rnd_id: result.data.rnd_id },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal successfully sent to R&D.",
    }),
  };
});
