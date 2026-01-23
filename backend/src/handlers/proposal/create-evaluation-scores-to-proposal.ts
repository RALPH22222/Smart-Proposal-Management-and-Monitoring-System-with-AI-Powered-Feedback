import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { createEvaluationScoresToProposaltSchema } from "../../schemas/proposal-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");
  const user_sub = event.requestContext.authorizer?.user_sub as string;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }
  // Payload Validation
  const result = createEvaluationScoresToProposaltSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const { status, ...data } = result.data;

  const proposalService = new ProposalService(supabase);
  const { error } = await proposalService.createEvaluationScoresToProposal(data, status, user_sub);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal successfully sent to evaluators.",
    }),
  };
});
