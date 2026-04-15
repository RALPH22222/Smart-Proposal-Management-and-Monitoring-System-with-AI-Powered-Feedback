import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { endorseForFundingSchema, fundingDecisionSchema, FundingDecisionType } from "../../schemas/proposal-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { EmailService } from "../../services/email.service";

// Funding decision values used to distinguish funding-decision requests from endorsement requests
const FUNDING_DECISIONS = new Set<string>(Object.values(FundingDecisionType));

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");
  const proposalService = new ProposalService(supabase);

  // Route by decision value: funding decisions use FundingDecisionType enum values
  if (FUNDING_DECISIONS.has(payload.decision)) {
    const result = fundingDecisionSchema.safeParse(payload);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          type: "validation_error",
          data: result.error.issues,
        }),
      };
    }

    const { userId } = getAuthContext(event);
    const { data, error } = await proposalService.fundingDecision(result.data, userId);

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
      user_id: userId,
      action: "funding_decision_made",
      category: "proposal",
      target_id: String(result.data.proposal_id),
      target_type: "proposal",
      details: { decision: result.data.decision },
    });

    // Notify proponent about funding decision (fire-and-forget)
    try {
      const { data: proposal } = await supabase
        .from("proposals")
        .select("proponent_id, project_title")
        .eq("id", result.data.proposal_id)
        .single();

      if (proposal?.proponent_id) {
        const decision = result.data.decision;
        let notifMessage = "";
        let emailSubject = "";
        let emailBody = "";

        if (decision === FundingDecisionType.FUNDED) {
          notifMessage = `Your proposal "${proposal.project_title}" has been approved for funding! A funded project has been created.`;
          emailSubject = "Proposal Approved for Funding";
          emailBody = `Great news! Your proposal "${proposal.project_title}" has been approved for funding. A funded project has been created. Please log in to SPMAMS for details.`;
        } else if (decision === FundingDecisionType.REVISION_FUNDING) {
          notifMessage = `Your proposal "${proposal.project_title}" requires revision before funding can proceed. Please review the feedback and resubmit.`;
          emailSubject = "Proposal Revision Required (Funding Stage)";
          emailBody = `Your proposal "${proposal.project_title}" requires revision before funding can proceed. Please log in to SPMAMS to review the feedback and resubmit.`;
        } else if (decision === FundingDecisionType.REJECTED_FUNDING) {
          notifMessage = `Your proposal "${proposal.project_title}" has been rejected at the funding stage.${result.data.remarks ? ` Reason: ${result.data.remarks}` : ""}`;
          emailSubject = "Proposal Rejected (Funding Stage)";
          emailBody = `Your proposal "${proposal.project_title}" has been rejected at the funding stage.${result.data.remarks ? ` Reason: ${result.data.remarks}` : ""} Please log in to SPMAMS for details.`;
        }

        if (notifMessage) {
          await supabase.from("notifications").insert({
            user_id: proposal.proponent_id,
            message: notifMessage,
            is_read: false,
            link: "profile",
          });

          if (process.env.SMTP_USER && emailSubject) {
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
                emailSubject,
                emailBody,
                "View Proposal",
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
      statusCode: 200,
      body: JSON.stringify({
        message: "Funding decision processed successfully.",
        data,
      }),
    };
  }

  // Default: endorsement decision
  const result = endorseForFundingSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const { data, error } = await proposalService.endorseForFunding(result.data);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  const { userId: endorserId } = getAuthContext(event);
  await logActivity(supabase, {
    user_id: endorserId,
    action: "proposal_endorsed_for_funding",
    category: "proposal",
    target_id: String(result.data.proposal_id),
    target_type: "proposal",
    details: { decision: result.data.decision },
  });

  // Send notification + email to proponent on endorsement (fire-and-forget)
  if (result.data.decision === "endorsed") {
    try {
      const { data: proposal } = await supabase
        .from("proposals")
        .select("proponent_id, project_title")
        .eq("id", result.data.proposal_id)
        .single();

      if (proposal?.proponent_id) {
        await supabase.from("notifications").insert({
          user_id: proposal.proponent_id,
          message: `Your proposal "${proposal.project_title}" has been endorsed for funding!`,
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
              "Proposal Endorsed for Funding",
              `Great news! Your proposal "${proposal.project_title}" has been endorsed for funding. Sign in to SPMAMS for details.`,
              "View Proposal",
              `${frontendUrl}/login`,
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Notification/email failed (non-blocking):", notifErr);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Endorsement decision processed successfully.",
      data,
    }),
  };
});
