import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProjectService } from "../../services/project.service";
import { uploadProjectDocumentSchema } from "../../schemas/project-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const parsed = uploadProjectDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: parsed.error.issues[0]?.message || "Invalid input",
      }),
    };
  }

  const { funded_project_id, document_type, file_url } = parsed.data;

  const service = new ProjectService(supabase);
  const { data, error } = await service.uploadProjectDocument(
    funded_project_id,
    document_type,
    file_url,
    auth.userId,
  );

  if (error) {
    const msg = (error as any).message || "Failed to upload document";
    const status = msg.includes("access") ? 403 : 500;
    return {
      statusCode: status,
      body: JSON.stringify({ message: msg }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});
