import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  const user_sub = auth.userId;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }

  const rawProposalId = event.queryStringParameters?.proposal_id;
  const proposal_id = rawProposalId ? Number(rawProposalId) : 0;

  if (!rawProposalId || isNaN(proposal_id) || proposal_id <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "proposal_id is required and must be a valid positive number",
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getAssignmentHistory(proposal_id);

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
