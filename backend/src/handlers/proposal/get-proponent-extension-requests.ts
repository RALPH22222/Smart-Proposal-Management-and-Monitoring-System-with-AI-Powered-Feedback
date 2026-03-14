import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const proposalId = event.queryStringParameters?.proposal_id
    ? Number(event.queryStringParameters.proposal_id)
    : undefined;

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getProponentExtensionRequests(proposalId);

  if (error) {
    console.error("Fetch extension requests error:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data }),
  };
});
