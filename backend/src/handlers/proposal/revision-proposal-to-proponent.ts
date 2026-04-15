import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { revisionProposalToProponentSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = revisionProposalToProponentSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const { user_sub } = event.requestContext.authorizer as Record<string, string>;
  const { error } = await proposalService.revisionProposalToProponent(result.data, user_sub);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
      }),
    };
  }

  await logActivity(supabase, {
    user_id: user_sub,
    action: "proposal_revision_requested",
    category: "proposal",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
  });

  // Send notification + email to proponent (fire-and-forget)
  try {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("proponent_id, project_title")
      .eq("id", result.data.proposal_id)
      .single();

    if (proposal?.proponent_id) {
      await supabase.from("notifications").insert({
        user_id: proposal.proponent_id,
        message: `Your proposal "${proposal.project_title}" requires revision. Please review the feedback and resubmit.`,
        is_read: false,
        link: "profile",
      });

      if (process.env.SMTP_USER) {
        const { data: proponent } = await supabase
          .from("users")
          .select("email, first_name")
          .eq("id", proposal.proponent_id)
          .single();

        if (proponent?.email) {
          const frontendUrl = process.env.FRONTEND_URL || "https://www.wmsu-rdec.com";
          const emailService = new EmailService();
          await emailService.sendNotificationEmail(
            proponent.email,
            proponent.first_name || "Proponent",
            "Proposal Revision Required",
            `Your proposal "${proposal.project_title}" has been sent back for revision. Sign in to SPMAMS to review the feedback and resubmit your proposal.`,
            "Review Feedback",
            `${frontendUrl}/login`,
          );
        }
      }
    }
  } catch (notifErr) {
    console.error("Notification/email failed (non-blocking):", notifErr);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Revision successfully sent to Proponent.",
    }),
  };
});
