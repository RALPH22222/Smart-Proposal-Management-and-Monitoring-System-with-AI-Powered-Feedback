import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { generateCertificateSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";

const ALLOWED_ROLES = ["rnd", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Extract authenticated user from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  // Role check: only rnd or admin can issue certificates
  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: Only R&D staff or admins can issue certificates.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = generateCertificateSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.generateCertificate({
    ...result.data,
    issued_by: auth.userId,
  });

  if (error) {
    const code = (error as any).code;
    const statusCode =
      code === "COI_BLOCKED"
        ? 403
        : code === "PROJECT_NOT_FOUND"
          ? 404
          : code === "INCOMPLETE_REPORTS" ||
              code === "CERTIFICATE_ALREADY_ISSUED" ||
              code === "TERMINAL_REPORT_NOT_VERIFIED" ||
              code === "UTILIZATION_GAP"
            ? 400
            : 500;
    console.error("Error: ", JSON.stringify(error, null, 2));
    return {
      statusCode,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
        code,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Certificate issued successfully. Project marked as completed.",
      data,
    }),
  };
});
