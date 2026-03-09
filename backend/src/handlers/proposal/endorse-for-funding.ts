import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { endorseForFundingSchema, fundingDecisionSchema, FundingDecisionType } from "../../schemas/proposal-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

// Funding decision values used to distinguish funding-decision requests from endorsement requests
const FUNDING_DECISIONS = new Set<string>(Object.values(FundingDecisionType));

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");
  const proposalService = new ProposalService(supabase);

  // Route by decision value: funding decisions use FundingDecisionType enum values
  if (FUNDING_DECISIONS.has(payload.decision)) {
    const result = fundingDecisionSchema.safeParse(payload);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          type: "validation_error",
          data: result.error.issues,
        }),
      };
    }

    const { userId } = getAuthContext(event);
    const { data, error } = await proposalService.fundingDecision(result.data, userId);

    if (error) {
      console.error("Supabase error: ", JSON.stringify(error, null, 2));
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message || "Internal server error.",
        }),
      };
    }

    await logActivity(supabase, {
      user_id: userId,
      action: "funding_decision_made",
      category: "proposal",
      target_id: String(result.data.proposal_id),
      target_type: "proposal",
      details: { decision: result.data.decision },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Funding decision processed successfully.",
        data,
      }),
    };
  }

  // Default: endorsement decision
  const result = endorseForFundingSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const { data, error } = await proposalService.endorseForFunding(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  const { userId: endorserId } = getAuthContext(event);
  await logActivity(supabase, {
    user_id: endorserId,
    action: "proposal_endorsed_for_funding",
    category: "proposal",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
    details: { decision: result.data.decision },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Endorsement decision processed successfully.",
      data,
    }),
  };
});
