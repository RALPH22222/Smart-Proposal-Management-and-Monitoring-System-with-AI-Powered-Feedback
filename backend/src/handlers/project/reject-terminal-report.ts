import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { z } from "zod";

const rejectTerminalReportBodySchema = z.object({
  terminal_report_id: z.number().int().positive(),
  review_note: z.string().trim().min(3, "A reason is required when rejecting a report."),
});

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
        message: "Forbidden: Only R&D staff or admins can reject terminal reports.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = rejectTerminalReportBodySchema.safeParse(payload);

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
  const { data, error } = await projectService.rejectTerminalReport({
    terminal_report_id: result.data.terminal_report_id,
    reviewed_by: auth.userId,
    review_note: result.data.review_note,
  });

  if (error) {
    console.error("reject-terminal-report error:", error);
    const code = (error as any).code;
    const message = (error as Error).message ?? "Failed to reject terminal report";
    return {
      statusCode:
        code === "COI_BLOCKED"
          ? 403
          : code === "TERMINAL_REPORT_NOT_FOUND"
            ? 404
            : code === "TERMINAL_REPORT_NOT_PENDING"
              ? 409
              : 500,
      body: JSON.stringify({ message, code }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Terminal report returned to proponent for revision.",
      data,
    }),
  };
});
