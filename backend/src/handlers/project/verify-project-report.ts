import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { z } from "zod";

const verifyReportBodySchema = z.object({
  report_id: z.number().int().positive(),
});

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

  // Role check: only rnd or admin can verify reports
  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Forbidden: Only R&D staff or admins can verify reports.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = verifyReportBodySchema.safeParse(payload);

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
  const { data, error } = await projectService.verifyReport({
    report_id: result.data.report_id,
    verified_by_id: auth.userId,
  });

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  await logActivity(supabase, {
    user_id: auth.userId,
    action: "project_report_verified",
    category: "project",
    target_id: String(result.data.report_id),
    target_type: "report",
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Report verified successfully.",
      data,
    }),
  };
});
