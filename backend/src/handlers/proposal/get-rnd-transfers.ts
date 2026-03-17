import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const ALLOWED_ROLES = ["rnd", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };
  }

  try {
    const params = event.queryStringParameters || {};
    const isAdmin = auth.roles.includes("admin");

    const service = new ProposalService(supabase);
    const { data, error } = await service.getRndTransfers({
      proposal_id: params.proposal_id ? Number(params.proposal_id) : undefined,
      rnd_id: isAdmin ? params.rnd_id : auth.userId, // Non-admin can only see their own
      status: params.status,
    });

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ message: (error as any).message || "Failed to fetch transfers" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ data }) };
  } catch (err: any) {
    console.error("Error fetching RND transfers:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
