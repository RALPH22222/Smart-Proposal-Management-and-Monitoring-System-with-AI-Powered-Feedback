import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { Status } from "../../types/proposal";
import { getAuthContext } from "../../utils/auth-context";

type FilterParams = {
  search?: string;
  filter?: string;
};

// Maps the UI tab name to the proposal statuses the endorsement page should load.
const FILTER_TO_STATUSES: Record<string, Status[]> = {
  active: [Status.UNDER_EVALUATION],
  revised: [Status.REVISION_RND],
  rejected: [Status.REJECTED_RND],
  archive: [Status.ENDORSED_FOR_FUNDING, Status.FUNDED],
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search, filter }: FilterParams = event.queryStringParameters || {};
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }

  const statuses = filter ? FILTER_TO_STATUSES[filter.toLowerCase()] : undefined;
  const isAdmin = auth.roles.includes("admin");

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getProposalsForEndorsement(
    search,
    auth.userId,
    statuses,
    isAdmin,
  );

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
