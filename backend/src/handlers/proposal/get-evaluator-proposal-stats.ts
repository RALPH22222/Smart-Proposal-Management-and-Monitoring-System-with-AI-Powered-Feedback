import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

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

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getEvaluatorProposalStats(user_sub);

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
    body: JSON.stringify(data),
  };
});
