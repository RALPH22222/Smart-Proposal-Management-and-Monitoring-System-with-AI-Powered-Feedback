import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";


// Note: No 'stations' table exists in the database.
// This handler returns an empty array to prevent CORS errors on the frontend.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const search = event.queryStringParameters?.search ?? "";
  const proposalService = new ProposalService(supabase);
  // Stations are mapped to departments in the database
  const { data, error } = await proposalService.getDepartment(search);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});
