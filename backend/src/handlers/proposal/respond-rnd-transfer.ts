import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { respondRndTransferSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";

const ALLOWED_ROLES = ["rnd", "admin"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  const hasRole = auth.roles.some((r) => ALLOWED_ROLES.includes(r));
  if (!hasRole) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const result = respondRndTransferSchema.safeParse(payload);

    if (result.error) {
      return { statusCode: 400, body: JSON.stringify({ type: "validation_error", data: result.error.issues }) };
    }

    const service = new ProposalService(supabase);
    const { data, error } = await service.respondRndTransfer({
      ...result.data,
      responder_id: auth.userId,
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ message: (error as any).message || "Failed to respond to transfer" }) };
    }

    await logActivity(supabase, {
      user_id: auth.userId,
      action: `rnd_transfer_${result.data.status}`,
      category: "proposal",
      target_id: String(result.data.transfer_id),
      target_type: "proposal_rnd_transfer",
    });

    // Notify the original requester
    if (data.from_rnd_id) {
      await supabase.from("notifications").insert({
        user_id: data.from_rnd_id,
        message: `Your transfer request for proposal #${data.proposal_id} was ${result.data.status}.`,
        is_read: false,
        link: "proposals",
      });
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Transfer ${result.data.status}`, data }) };
  } catch (err: any) {
    console.error("Error responding to RND transfer:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
