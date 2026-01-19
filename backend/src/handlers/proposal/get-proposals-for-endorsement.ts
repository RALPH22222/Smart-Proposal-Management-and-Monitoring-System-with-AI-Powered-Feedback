import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

type FilterParams = {
  search?: string;
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search }: FilterParams = event.queryStringParameters || {};

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getProposalsForEndorsement(search);

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
