import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { submitRevisedProposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";

export const handler = buildCorsHeaders(async (event) => {
  // Extract proponent identity from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  // Parse JSON body
  const body = JSON.parse(event.body || "{}");

  // Validate fields — inject proponent_id from JWT, not from body
  const validation = submitRevisedProposalSchema.safeParse({
    ...body,
    proponent_id: auth.userId,
  });

  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation.error.issues,
      }),
    };
  }

  const { file_url, proposal_id, proponent_id, project_title, revision_response, plan_start_date, plan_end_date, budget, work_plan_file_url } = validation.data;

  // Submit revision via service (file already uploaded to S3 by browser)
  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.submitRevision(
    {
      proposal_id,
      proponent_id,
      project_title,
      revision_response,
      plan_start_date,
      plan_end_date,
      budget,
      work_plan_file_url,
    },
    file_url
  );

  if (error) {
    console.error("Error submitting revision", error);

    const errorMessage = error.message || "";
    let statusCode = 500;

    if (errorMessage.includes("permission") || errorMessage.includes("do not have")) {
      statusCode = 403;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("status")) {
      statusCode = 400;
    }

    return {
      statusCode,
      body: JSON.stringify({
        message: errorMessage || "Failed to submit revision",
      }),
    };
  }

  await logActivity(supabase, {
    user_id: auth.userId,
    action: "proposal_revision_submitted",
    category: "proposal",
    target_id: String(proposal_id),
    target_type: "proposal",
    details: { project_title, work_plan_replaced: !!work_plan_file_url },
  });

  if (work_plan_file_url) {
    await logActivity(supabase, {
      user_id: auth.userId,
      action: "work_plan_file_updated",
      category: "proposal",
      target_id: String(proposal_id),
      target_type: "proposal",
      details: { project_title, source: "revision" },
    });
  }

  // Notify assigned RND that a revised proposal has been resubmitted (fire-and-forget)
  try {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("project_title")
      .eq("id", proposal_id)
      .single();

    const title = proposal?.project_title || "a proposal";

    const { data: rndAssignment } = await supabase
      .from("proposal_rnd")
      .select("rnd_id")
      .eq("proposal_id", proposal_id)
      .single();

    if (rndAssignment) {
      await supabase.from("notifications").insert({
        user_id: rndAssignment.rnd_id,
        message: `A revised proposal "${title}" has been resubmitted by the proponent. Please review.`,
        is_read: false,
        link: "proposals",
      });

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
            "Revised Proposal Resubmitted",
            `A revised proposal "${title}" has been resubmitted by the proponent. Sign in to SPMAMS to review it.`,
            "Review Proposal",
            `${frontendUrl}/login`,
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
      message: "Revision submitted successfully",
      data,
    }),
  };
});
