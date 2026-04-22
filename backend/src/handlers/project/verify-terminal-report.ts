import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { verifyTerminalReportSchema } from "../../schemas/project-schema";
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
        message: "Forbidden: Only R&D staff or admins can verify terminal reports.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = verifyTerminalReportSchema.safeParse(payload);

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
  const { data, error } = await projectService.verifyTerminalReport({
    ...result.data,
    verified_by: auth.userId,
  });

  if (error) {
    const code = (error as any).code;
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode:
        code === "COI_BLOCKED"
          ? 403
          : code === "TERMINAL_REPORT_NOT_FOUND"
            ? 404
            : code === "TERMINAL_REPORT_NOT_PENDING"
              ? 409
              : 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
        code,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Terminal report verified successfully.",
      data,
    }),
  };
});
