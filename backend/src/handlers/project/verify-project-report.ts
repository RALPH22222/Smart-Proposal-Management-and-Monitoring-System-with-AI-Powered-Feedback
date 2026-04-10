import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";
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

  // Notify lead proponent that report has been verified (fire-and-forget)
  try {
    const quarterLabel = data.quarterly_report?.replace("_report", "").toUpperCase() || "Quarterly";

    // Get project lead and title
    const { data: project } = await supabase
      .from("funded_projects")
      .select("project_lead_id, proposal:proposals(project_title)")
      .eq("id", data.funded_project_id)
      .single();

    if (project?.project_lead_id) {
      const projectTitle = (project as any).proposal?.project_title || "your project";

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: project.project_lead_id,
        message: `Your ${quarterLabel} quarterly report for "${projectTitle}" has been verified and approved by R&D.`,
        is_read: false,
        link: "project-monitoring",
      });

      // Email notification
      if (process.env.SMTP_USER) {
        const { data: lead } = await supabase
          .from("users")
          .select("email, first_name")
          .eq("id", project.project_lead_id)
          .single();

        if (lead?.email) {
          const emailService = new EmailService();
          await emailService.sendNotificationEmail(
            lead.email,
            lead.first_name || "Proponent",
            `Quarterly Report Verified – ${quarterLabel}`,
            `Your ${quarterLabel} quarterly report for "${projectTitle}" has been verified and approved by R&D. Please log in to SPMAMS for details.`,
          );
        }
      }
    }
  } catch (notifErr) {
    console.error("Notification failed (non-blocking):", notifErr);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Report verified successfully.",
      data,
    }),
  };
});
