import { APIGatewayProxyEvent } from "aws-lambda";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { requestRndTransferSchema } from "../../schemas/proposal-schema";
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
    const result = requestRndTransferSchema.safeParse(payload);

    if (result.error) {
      return { statusCode: 400, body: JSON.stringify({ type: "validation_error", data: result.error.issues }) };
    }

    const service = new ProposalService(supabase);
    const { data, error } = await service.requestRndTransfer({
      ...result.data,
      from_rnd_id: auth.userId,
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ message: (error as any).message || "Failed to request transfer" }) };
    }

    await logActivity(supabase, {
      user_id: auth.userId,
      action: "rnd_transfer_requested",
      category: "proposal",
      target_id: String(result.data.proposal_id),
      target_type: "proposal",
      details: { to_rnd_id: result.data.to_rnd_id },
    });

    // Notify target RND (or admins if escalated)
    if (data.status === "admin_required") {
      const { data: admins } = await supabase.from("users").select("id").contains("roles", ["admin"]);
      if (admins && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            message: `An RND transfer request for proposal #${result.data.proposal_id} requires admin approval (second transfer).`,
            is_read: false,
            link: "proposals",
          })),
        );
      }
    } else {
      await supabase.from("notifications").insert({
        user_id: result.data.to_rnd_id,
        message: `You have a new proposal transfer request for proposal #${result.data.proposal_id}.`,
        is_read: false,
        link: "proposals",
      });
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Transfer request submitted", data }) };
  } catch (err: any) {
    console.error("Error requesting RND transfer:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "Internal server error" }) };
  }
});
