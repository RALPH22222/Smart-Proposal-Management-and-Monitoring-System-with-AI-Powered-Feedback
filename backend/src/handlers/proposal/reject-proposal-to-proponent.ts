import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { rejectProposalToProponentSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  // Payload Validation
  const result = rejectProposalToProponentSchema.safeParse(payload);

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
  const { error } = await proposalService.rejectProposalToProponent(result.data, user_sub);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
        error: error,
      }),
    };
  }

  await logActivity(supabase, {
    user_id: user_sub,
    action: "proposal_rejected",
    category: "proposal",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
  });

  // Notify proponent about rejection (fire-and-forget)
  try {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("proponent_id, project_title")
      .eq("id", result.data.proposal_id)
      .single();

    if (proposal?.proponent_id) {
      await supabase.from("notifications").insert({
        user_id: proposal.proponent_id,
        message: `Your proposal "${proposal.project_title}" has been rejected. Please check the rejection summary for details.`,
        is_read: false,
      });

      if (process.env.SMTP_USER) {
        const { data: proponent } = await supabase
          .from("users")
          .select("email, first_name")
          .eq("id", proposal.proponent_id)
          .single();

        if (proponent?.email) {
          const emailService = new EmailService();
          await emailService.sendNotificationEmail(
            proponent.email,
            proponent.first_name || "Proponent",
            "Proposal Rejected",
            `Your proposal "${proposal.project_title}" has been rejected. Please log in to SPMAMS to view the rejection summary.`,
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
      message: "Reject successfully sent to Proponent.",
    }),
  };
});
