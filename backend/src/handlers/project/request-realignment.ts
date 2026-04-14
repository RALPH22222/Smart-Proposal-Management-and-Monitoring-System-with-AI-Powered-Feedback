import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { requestRealignmentSchema } from "../../schemas/realignment-schema";

// POST /project/realignment/request — proponent submits a budget realignment proposal.
// Identity from JWT. The service layer enforces:
//   - new grand total ≤ baseline ceiling
//   - one pending realignment per project (concurrency)
// COI is enforced by the existing assertNoCoiOnProject helper at the project-membership
// level — the proponent can only request realignment for projects they're a member of.
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

  // Verify the caller is on the project (project leader or accepted co-lead). We use the
  // project_members table — if the user isn't on it we reject before touching budgets.
  const projectService = new ProjectService(supabase);
  const { data: membership } = await supabase
    .from("project_members")
    .select("id, status, role")
    .eq("funded_project_id", validation.data.funded_project_id)
    .eq("user_id", auth.userId)
    .in("status", ["accepted", "active"])
    .maybeSingle();

  // Also accept the project leader (proponent_id on funded_projects). Leader rows aren't
  // always mirrored into project_members.
  if (!membership) {
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
          message: "Only the project leader or accepted co-leads can request a budget realignment.",
        }),
      };
    }
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
