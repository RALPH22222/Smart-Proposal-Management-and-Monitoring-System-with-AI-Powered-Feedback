import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { Status } from "../../types/proposal";
import { proposalStatusSchema } from "../../schemas/proposal-schema";

type FilterParams = {
  search?: string;
  status?: Status;
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search, status }: FilterParams = event.queryStringParameters || {};

  // Get authenticated user's ID from the authorizer context
  const user_sub = event.requestContext.authorizer?.user_sub as string;

  if (!user_sub) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized: User ID not found in token",
      }),
    };
  }

  // Validate status if provided
  if (status) {
    const { error: statusError } = proposalStatusSchema.safeParse(status);
    if (statusError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          type: "validation_error",
          data: statusError.issues,
        }),
      };
    }
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getAll(search, status, user_sub);

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
