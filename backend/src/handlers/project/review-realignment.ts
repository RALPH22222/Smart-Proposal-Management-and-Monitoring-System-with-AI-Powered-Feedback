import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { reviewRealignmentSchema } from "../../schemas/realignment-schema";

const ALLOWED_ROLES = ["rnd", "admin"];

// POST /project/realignment/review — R&D / admin approves, rejects, or requests revision
// on a pending realignment. Approving creates a new proposal_budget_versions row from the
// proposed_payload and flips funded_projects.current_budget_version_id.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  if (!auth.roles.some((r) => ALLOWED_ROLES.includes(r))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: only R&D staff or admins can review realignment requests.",
      }),
    };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  const validation = reviewRealignmentSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  // Decision-against-role-based COI: even an R&D user should not approve their own
  // realignment request. The Phase 2 hijack work introduced this guard for endorsements;
  // applying the same rule here keeps the model consistent.
  const { data: realignmentRow } = await supabase
    .from("budget_realignments")
    .select("requested_by")
    .eq("id", validation.data.realignment_id)
    .maybeSingle();

  if (realignmentRow?.requested_by === auth.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You cannot review a realignment request you submitted yourself.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.reviewRealignment({
    input: validation.data,
    reviewed_by: auth.userId,
  });

  if (error) {
    console.error("review-realignment error:", error);
    const message = (error as Error).message ?? "Failed to review realignment";
    const isClientError =
      message.includes("not found") || message.includes("already") || message.includes("cannot");
    return {
      statusCode: isClientError ? 400 : 500,
      body: JSON.stringify({ message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Realignment ${validation.data.action.replace("_", " ")} successfully`,
      data,
    }),
  };
});
