import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { submitReportSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // Extract authenticated user from JWT (not from request body)
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token." }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const result = submitReportSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  // Use JWT identity, not body-supplied identity
  const submitterId = auth.userId;

  // Verify submitter is an active member of the funded project
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("funded_project_id", result.data.funded_project_id)
    .eq("user_id", submitterId)
    .eq("status", "active")
    .single();

  if (!membership) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You are not an active member of this project.",
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error } = await projectService.submitQuarterlyReport({
    ...result.data,
    submitted_by_proponent_id: submitterId,
  });

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));

    if ((error as any).code === "DUPLICATE_REPORT") {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: error.message, code: "DUPLICATE_REPORT" }),
      };
    }

    if ((error as any).code === "FUND_REQUEST_NOT_APPROVED" || (error as any).code === "PREVIOUS_QUARTER_MISSING") {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message, code: (error as any).code }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || "Internal server error." }),
    };
  }

  await logActivity(supabase, {
    user_id: submitterId,
    action: "quarterly_report_submitted",
    category: "project",
    target_id: String(result.data.funded_project_id),
    target_type: "funded_project",
    details: { quarterly_report: result.data.quarterly_report },
  });

  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Quarterly report submitted successfully.", data }),
  };
});
