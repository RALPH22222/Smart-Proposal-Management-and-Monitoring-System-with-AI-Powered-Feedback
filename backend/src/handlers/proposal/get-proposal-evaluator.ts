import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { Status } from "../../types/proposal";
import { proposalEvaluatorStatusSchema } from "../../schemas/proposal-schema";

type FilterParams = {
  search?: string;
  status?: Status;
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { search, status }: FilterParams = event.queryStringParameters || {};

  // Validate status if provided
  if (status) {
    const { error: statusError } = proposalEvaluatorStatusSchema.safeParse(status);
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
  const { data, error } = await proposalService.getEvaluatorProposals(search, status);

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
