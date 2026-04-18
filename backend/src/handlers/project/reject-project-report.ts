import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { z } from "zod";

// Required note so the proponent UI can render "R&D returned this because X". Empty notes
// would defeat the whole point of the decline path — R&D must explain what to fix.
const rejectReportBodySchema = z.object({
  report_id: z.number().int().positive(),
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
        message: "Forbidden: Only R&D staff or admins can reject reports.",
      }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = rejectReportBodySchema.safeParse(payload);

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
  const { data, error } = await projectService.rejectReport({
    report_id: result.data.report_id,
    reviewed_by: auth.userId,
    review_note: result.data.review_note,
  });

  if (error) {
    console.error("reject-project-report error:", error);
    const message = (error as Error).message ?? "Failed to reject report";
    const isClientError =
      message.includes("not found") || message.includes("no longer in a submittable");
    return {
      statusCode: isClientError ? 400 : 500,
      body: JSON.stringify({ message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Report returned to proponent for revision.",
      data,
    }),
  };
});
