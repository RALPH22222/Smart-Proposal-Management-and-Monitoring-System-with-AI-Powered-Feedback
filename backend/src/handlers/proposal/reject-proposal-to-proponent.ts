import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { rejectProposalToProponentSchema } from "../../schemas/proposal-schema";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = rejectProposalToProponentSchema.safeParse(payload);

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
  const { user_sub } = event.requestContext.authorizer as Record<string, string>;
  const { error } = await proposalService.rejectProposalToProponent(result.data, user_sub);

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
      message: "Reject successfully sent to Proponent.",
    }),
  };
});
