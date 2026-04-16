import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

// GET /project/realignment?id=N
// Returns one realignment with both versions (and all their items) inlined for the diff view.
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const id = Number(event.queryStringParameters?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return { statusCode: 400, body: JSON.stringify({ message: "id query parameter is required" }) };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.getRealignment(id);

  if (error || !data) {
    console.error("get-realignment error:", error);
    return { statusCode: 404, body: JSON.stringify({ message: "Realignment not found" }) };
  }

  // Proponents can only see their own realignments; R&D / admin see anything.
  const isPrivileged = auth.roles.some((r) => r === "rnd" || r === "admin");
  if (!isPrivileged && (data as any).requested_by !== auth.userId) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
});
