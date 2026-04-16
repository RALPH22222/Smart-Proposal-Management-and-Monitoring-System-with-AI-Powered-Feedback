import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { requestRealignmentSchema } from "../../schemas/realignment-schema";

// POST /project/realignment/request — project LEADER submits a budget realignment proposal.
// Identity from JWT. The service layer enforces:
//   - new grand total ≤ baseline ceiling
//   - one pending realignment per project (concurrency)
//   - per-line floors vs already-approved fund requests (Phase 4)
//
// Per teacher consultation: budget control belongs to the project lead only. Co-leads can
// collaborate on the project (team, reports, etc.) but cannot modify the budget. We look up
// proposals.proponent_id directly instead of accepting project_members rows.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  const validation = requestRealignmentSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  const projectService = new ProjectService(supabase);

  // Lead-only: the caller must be the proposal's proponent (= project leader). Co-leads
  // in project_members are NOT allowed to touch the budget.
  const { data: project } = await supabase
    .from("funded_projects")
    .select("proposal_id, proposals!inner(proponent_id)")
    .eq("id", validation.data.funded_project_id)
    .maybeSingle();

  const leaderId = (project as any)?.proposals?.proponent_id;
  if (leaderId !== auth.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message:
          "Only the project lead can request a budget realignment. Co-leads can collaborate on the project but cannot modify the budget.",
      }),
    };
  }

  const { data, error } = await projectService.requestRealignment({
    input: validation.data,
    requested_by: auth.userId,
  });

  if (error) {
    console.error("request-realignment error:", error);
    const message = (error as Error).message ?? "Failed to submit realignment request";
    const isClientError =
      message.includes("exceeds") ||
      message.includes("already") ||
      message.includes("not found") ||
      message.includes("must");
    return {
      statusCode: isClientError ? 400 : 500,
      body: JSON.stringify({ message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Realignment request submitted", data }),
  };
});
