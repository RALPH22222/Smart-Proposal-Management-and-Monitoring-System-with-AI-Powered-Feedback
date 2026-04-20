import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { adminReturnRealignmentSchema } from "../../schemas/realignment-schema";

// Admin-only endpoint: return an endorsed realignment to R&D for rework with a
// required review note. RND re-reviews + re-endorses after addressing the note.
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
        message: "Forbidden: only Admin can return endorsed realignments.",
      }),
    };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
  }

  const validation = adminReturnRealignmentSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.adminReturnRealignment({
    realignment_id: validation.data.realignment_id,
    admin_id: auth.userId,
    review_note: validation.data.review_note,
  });

  if (error) {
    console.error("admin-return-realignment error:", error);
    const message = (error as Error).message ?? "Failed to return realignment";
    const isClientError =
      message.includes("not found") ||
      message.includes("Can only") ||
      message.includes("required");
    return { statusCode: isClientError ? 400 : 500, body: JSON.stringify({ message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Realignment returned to R&D for revision.", data }),
  };
});
