import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

// Returns the admin-managed budget subcategory list for the BudgetBreakdownModal dropdown.
// Optional ?category=ps|mooe|co filter so the frontend only fetches what it needs.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const category = event.queryStringParameters?.category;

  if (category && !["ps", "mooe", "co"].includes(category)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid category. Must be one of: ps, mooe, co" }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.getBudgetSubcategories(category);

  if (error) {
    console.error("get-budget-subcategories error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to load budget subcategories" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data ?? []),
  };
});
