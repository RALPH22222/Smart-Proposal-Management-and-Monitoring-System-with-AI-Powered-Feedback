import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProjectService } from "../../services/project.service";
import { verifyProjectDocumentSchema } from "../../schemas/project-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const ALLOWED_ROLES = ["rnd", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: Only R&D staff or admins can verify compliance documents.",
      }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const parsed = verifyProjectDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: parsed.error.issues[0]?.message || "Invalid input" }),
    };
  }

  const service = new ProjectService(supabase);
  const { data, error } = await service.verifyProjectDocument(
    parsed.data.funded_project_id,
    parsed.data.document_type,
    auth.userId,
  );

  if (error) {
    const msg = (error as { message?: string }).message || "Failed to verify document";
    return { statusCode: 400, body: JSON.stringify({ message: msg }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
});
