import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const agency_id = event.queryStringParameters?.agency_id;

  if (!agency_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "agency_id query parameter is required.",
      }),
    };
  }

  const parsedAgencyId = parseInt(agency_id, 10);
  if (isNaN(parsedAgencyId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "agency_id must be a valid number.",
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getAgencyAddresses(parsedAgencyId);

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
