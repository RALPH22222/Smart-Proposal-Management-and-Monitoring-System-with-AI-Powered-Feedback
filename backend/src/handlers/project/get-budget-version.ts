import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

// GET /project/budget-version?funded_project_id=N
// Returns the active budget version + items for a funded project. Used by the proponent
// realignment form (to seed the editable copy) and by the RND review modal (to render the
// "from" side of the diff when no to_version exists yet).
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const fundedProjectId = Number(event.queryStringParameters?.funded_project_id);
  if (!Number.isFinite(fundedProjectId) || fundedProjectId <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "funded_project_id query parameter is required" }),
    };
  }

  const projectService = new ProjectService(supabase);
  const access = await projectService.assertCanAccessFundedProject(
    auth.userId,
    auth.roles,
    fundedProjectId,
  );
  if (access.error) {
    const code = (access.error as any).code;
    return {
      statusCode: code === "PROJECT_NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : 500,
      body: JSON.stringify({
        message: (access.error as any).message || "Internal server error.",
        code,
      }),
    };
  }

  const { data, error } = await projectService.getActiveBudgetVersion(fundedProjectId);

  if (error) {
    console.error("get-budget-version error:", error);
    const message = (error as Error).message ?? "Failed to load budget version";
    return {
      statusCode: message.toLowerCase().includes("not found") ? 404 : 500,
      body: JSON.stringify({ message }),
    };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
});
