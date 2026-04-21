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

  // DOST compliance gate: MOA (Form 5) + Agency Certification (Form 4) must be uploaded
  // before any quarterly report can be submitted. This enforces the real-world DOST rule
  // that the agreement + funding certification are prerequisites for progress reporting.
  // Backend guard is authoritative — the frontend banner / disabled button is UX; this
  // catches anyone hitting the endpoint directly or with a stale client.
  const { data: complianceDocs } = await supabase
    .from("funded_projects")
    .select("moa_file_url, agency_certification_file_url")
    .eq("id", result.data.funded_project_id)
    .single();

  const missing: string[] = [];
  if (!complianceDocs?.moa_file_url) missing.push("Memorandum of Agreement (DOST Form 5)");
  if (!complianceDocs?.agency_certification_file_url) missing.push("Agency Certification (DOST Form 4)");
  if (missing.length > 0) {
    return {
      statusCode: 412, // Precondition Failed — prerequisite docs missing
      body: JSON.stringify({
        message: `Cannot submit quarterly report. The following document(s) must be uploaded first: ${missing.join(", ")}.`,
        code: "MISSING_COMPLIANCE_DOCS",
        missing,
      }),
    };
  }

  const projectService = new ProjectService(supabase);
  const { data, error, isResubmission } = await projectService.submitQuarterlyReport({
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
        // Differentiate wording so a busy R&D can tell at a glance whether this is a
        // first submission or a revision of a report they previously returned.
        const verb = isResubmission ? "resubmitted after revision" : "submitted";
        const hint = isResubmission
          ? "Please re-review the revisions."
          : "Please review and verify.";
        // In-app notification
        await supabase.from("notifications").insert({
          user_id: rndAssignment.rnd_id,
          message: `A ${quarterLabel} quarterly report has been ${verb} for "${projectTitle}". ${hint}`,
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
            // Truly fire-and-forget — do NOT await. A cold Gmail SMTP handshake
            // can take longer than the Lambda's 10s timeout, which previously
            // killed the handler *after* the project_reports row was inserted.
            // The client then saw a 500/504, the user refreshed or retried, and
            // the second POST got 409 DUPLICATE_REPORT against the row the first
            // (successful) invocation had already written. The in-app notification
            // above is the authoritative R&D channel; this email is best-effort.
            emailService
              .sendNotificationEmail(
                rndUser.email,
                rndUser.first_name || "R&D Staff",
                isResubmission
                  ? `Quarterly Report Resubmitted – ${quarterLabel}`
                  : `Quarterly Report Submitted – ${quarterLabel}`,
                isResubmission
                  ? `A ${quarterLabel} quarterly report you previously returned for "${projectTitle}" has been resubmitted with revisions. Sign in to SPMAMS to re-review.`
                  : `A ${quarterLabel} quarterly report has been submitted for "${projectTitle}". Sign in to SPMAMS to review and verify the report.`,
                isResubmission ? "Re-review Report" : "Review Report",
                `${frontendUrl}/login`,
              )
              .catch((emailErr) =>
                console.error("Submit-report email notification failed (non-blocking):", emailErr),
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
