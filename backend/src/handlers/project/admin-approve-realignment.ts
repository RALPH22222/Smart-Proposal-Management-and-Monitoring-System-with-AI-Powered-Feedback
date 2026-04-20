import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { adminApproveRealignmentSchema } from "../../schemas/realignment-schema";

// Admin-only endpoint: final confirmation of a realignment that RND endorsed.
// Creates the new budget version + reclassification records atomically. The
// maker-checker same-user guard (endorser !== approver) is enforced in the
// service layer.
const ALLOWED_ROLES = ["admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  if (!auth.roles.some((r) => ALLOWED_ROLES.includes(r))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: only Admin can confirm endorsed realignments.",
      }),
    };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  const validation = adminApproveRealignmentSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  // COI guard: admin can't confirm a realignment they themselves submitted
  const { data: realignmentRow } = await supabase
    .from("budget_realignments")
    .select("requested_by")
    .eq("id", validation.data.realignment_id)
    .maybeSingle();

  if (realignmentRow?.requested_by === auth.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You cannot confirm a realignment request you submitted yourself.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.adminApproveRealignment({
    realignment_id: validation.data.realignment_id,
    admin_id: auth.userId,
  });

  if (error) {
    console.error("admin-approve-realignment error:", error);
    const message = (error as Error).message ?? "Failed to confirm realignment";
    const isClientError =
      message.includes("not found") ||
      message.includes("Can only") ||
      message.includes("maker-checker") ||
      message.includes("endorsed") ||
      message.includes("already");
    return { statusCode: isClientError ? 400 : 500, body: JSON.stringify({ message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Realignment confirmed by Admin — new budget version in force.", data }),
  };
});
