import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const role = event.queryStringParameters?.role;
  const departmentId = event.queryStringParameters?.department_id;

  if (!role) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Query parameter 'role' is required.",
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getUsersByRole(
    role,
    departmentId ? Number(departmentId) : undefined,
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
