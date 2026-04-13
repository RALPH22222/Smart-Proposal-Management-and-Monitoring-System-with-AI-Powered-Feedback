import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { Status } from "../../types/proposal";

type FilterParams = {
  search?: string;
  filter?: string;
};

// Maps the UI tab name to the proposal statuses the endorsement page should load.
const FILTER_TO_STATUSES: Record<string, Status[]> = {
  active: [Status.UNDER_EVALUATION],
  revised: [Status.REVISION_RND],
  rejected: [Status.REJECTED_RND],
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search, filter }: FilterParams = event.queryStringParameters || {};
  const user_sub = event.requestContext.authorizer?.user_sub as string;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }

  const statuses = filter ? FILTER_TO_STATUSES[filter.toLowerCase()] : undefined;

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getProposalsForEndorsement(search, user_sub, statuses);

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
