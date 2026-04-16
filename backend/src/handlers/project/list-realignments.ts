import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

// GET /project/realignments?status=...&funded_project_id=...
// Lists realignments. R&D / admin see everything (drives the new RnDFundingPage tab).
// Proponents see only their own (drives the monitoring page status badge).
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const status = event.queryStringParameters?.status;
  const fundedProjectIdRaw = event.queryStringParameters?.funded_project_id;
  const funded_project_id = fundedProjectIdRaw ? Number(fundedProjectIdRaw) : undefined;

  if (funded_project_id != null && !Number.isFinite(funded_project_id)) {
    return { statusCode: 400, body: JSON.stringify({ message: "funded_project_id must be numeric" }) };
  }

  if (
    status &&
    !["pending_review", "approved", "rejected", "revision_requested"].includes(status)
  ) {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid status filter" }) };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.listRealignments({
    status,
    funded_project_id,
    user_id: auth.userId,
    user_roles: auth.roles,
  });

  if (error) {
    console.error("list-realignments error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Failed to load realignments" }) };
  }

  return { statusCode: 200, body: JSON.stringify(data ?? []) };
});
