import { APIGatewayProxyEvent } from "aws-lambda";
import { ProjectService } from "../../services/project.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { submitReportSchema } from "../../schemas/project-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";

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
    // Also check if user is the project lead (they may not be in project_members)
    const { data: project } = await supabase
      .from("funded_projects")
      .select("id")
      .eq("id", result.data.funded_project_id)
      .eq("project_lead_id", submitterId)
      .single();

    if (!project) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "You are not an active member of this project.",
        }),
      };
    }
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

  // Notify assigned RND about the submitted report (fire-and-forget)
  try {
    const quarterLabel = result.data.quarterly_report.replace("_report", "").toUpperCase();

    // Get proposal_id for this funded project
    const { data: project } = await supabase
      .from("funded_projects")
      .select("proposal_id, proposal:proposals(project_title)")
      .eq("id", result.data.funded_project_id)
      .single();

    if (project) {
      const projectTitle = (project as any).proposal?.project_title || "a project";

      // Find assigned RND
      const { data: rndAssignment } = await supabase
        .from("proposal_rnd")
        .select("rnd_id")
        .eq("proposal_id", project.proposal_id)
        .single();

      if (rndAssignment) {
        // In-app notification
        await supabase.from("notifications").insert({
          user_id: rndAssignment.rnd_id,
          message: `A ${quarterLabel} quarterly report has been submitted for "${projectTitle}". Please review and verify.`,
          is_read: false,
          link: "monitoring",
        });

        // Email notification
        if (process.env.SMTP_USER) {
          const { data: rndUser } = await supabase
            .from("users")
            .select("email, first_name")
            .eq("id", rndAssignment.rnd_id)
            .single();

          if (rndUser?.email) {
            const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
            const emailService = new EmailService();
            await emailService.sendNotificationEmail(
              rndUser.email,
              rndUser.first_name || "R&D Staff",
              `Quarterly Report Submitted – ${quarterLabel}`,
              `A ${quarterLabel} quarterly report has been submitted for "${projectTitle}". Sign in to SPMAMS to review and verify the report.`,
              "Review Report",
              `${frontendUrl}/login`,
            );
          }
        }
      }
    }
  } catch (notifErr) {
    console.error("Notification failed (non-blocking):", notifErr);
  }

  return {
    statusCode: 201,
    body: JSON.stringify({ message: "Quarterly report submitted successfully.", data }),
  };
});
