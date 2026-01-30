import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { Status } from "../../types/proposal";
import { getAuthContext } from "../../utils/auth-context";

type FilterParams = {
  search?: string;
  status?: Status;
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search, status }: FilterParams = event.queryStringParameters || {};

  // Extract proponent identity from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getRndProposals(auth.userId);

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
