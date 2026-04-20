import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { endorseRealignmentSchema } from "../../schemas/realignment-schema";

const ALLOWED_ROLES = ["rnd", "admin"];

// POST /project/realignment/endorse — Pattern N tier 1. R&D endorses a realignment
// that reallocates already-drawn cash (requires_reclassification = true). Status goes
// from pending_review → endorsed_pending_admin. An Admin then confirms via
// admin-approve-realignment.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  if (!auth.roles.some((r) => ALLOWED_ROLES.includes(r))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: only R&D staff or admins can endorse realignment requests.",
      }),
    };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  const validation = endorseRealignmentSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  // COI guard: endorser cannot be the original requester.
  const { data: realignmentRow } = await supabase
    .from("budget_realignments")
    .select("requested_by")
    .eq("id", validation.data.realignment_id)
    .maybeSingle();

  if (realignmentRow?.requested_by === auth.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You cannot endorse a realignment request you submitted yourself.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.endorseRealignment({
    realignment_id: validation.data.realignment_id,
    endorsed_by: auth.userId,
  });

  if (error) {
    console.error("endorse-realignment error:", error);
    const message = (error as Error).message ?? "Failed to endorse realignment";
    const isClientError =
      message.includes("not found") || message.includes("already") || message.includes("cannot") || message.includes("doesn't require");
    return { statusCode: isClientError ? 400 : 500, body: JSON.stringify({ message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Realignment endorsed, awaiting Admin confirmation", data }),
  };
});
