import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const proposal_id = event.queryStringParameters?.proposal_id;
  const user_sub = event.requestContext.authorizer?.user_sub as string;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }
  if (!proposal_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "proposal_id query parameter is required",
      }),
    };
  }

  const proposalIdNum = parseInt(proposal_id, 10);
  if (isNaN(proposalIdNum)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "proposal_id must be a valid number",
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const rolesStr = event.requestContext.authorizer?.roles as string | undefined;
  const roles: string[] = rolesStr ? JSON.parse(rolesStr) : [];
  const isAdmin = roles.includes("admin");
  const { data, error } = await proposalService.getRejectionSummary(proposalIdNum, user_sub, isAdmin);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
      }),
    };
  }

  if (!data) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "No rejection details found for this proposal",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});
