import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { approveRndTransferSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";

const ALLOWED_ROLES = ["admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: Admin only" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = approveRndTransferSchema.safeParse(payload);

    if (result.error) {
      return { statusCode: 400, body: JSON.stringify({ type: "validation_error", data: result.error.issues }) };
    }

    const service = new ProposalService(supabase);
    const { data, error } = await service.approveRndTransfer({
      ...result.data,
      admin_id: auth.userId,
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ message: (error as any).message || "Failed to process transfer" }) };
    }

    await logActivity(supabase, {
      user_id: auth.userId,
      action: `rnd_transfer_admin_${result.data.status}`,
      category: "proposal",
      target_id: String(result.data.transfer_id),
      target_type: "proposal_rnd_transfer",
    });

    // Notify both RNDs
    if (data) {
      const notifications = [
        { user_id: data.from_rnd_id, message: `Admin has ${result.data.status} your transfer request for proposal #${data.proposal_id}.`, is_read: false, link: "proposals" },
        { user_id: data.to_rnd_id, message: `Admin has ${result.data.status} a transfer of proposal #${data.proposal_id} to you.`, is_read: false, link: "proposals" },
      ];
      await supabase.from("notifications").insert(notifications);
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Transfer ${result.data.status} by admin`, data }) };
  } catch (err: any) {
    console.error("Error approving RND transfer:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
