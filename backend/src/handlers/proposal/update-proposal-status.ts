import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";
import { z } from "zod";

const updateStatusSchema = z.object({
  proposal_id: z.coerce.number().min(1),
  status: z.string().min(1), // We can add enum validation if needed
});

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body || "{}");

  const result = updateStatusSchema.safeParse(payload);

  if (!result.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const { proposal_id, status } = result.data;

  const proposalService = new ProposalService(supabase);
  
  // Directly update status using supabase client since service might not have a simple updateStatus method exposed
  const { error } = await supabase
    .from("proposals")
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq("id", proposal_id);

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Internal server error.",
      }),
    };
  }

  const { userId } = getAuthContext(event);
  await logActivity(supabase, {
    user_id: userId,
    action: "proposal_status_updated",
    category: "proposal",
    target_id: String(proposal_id),
    target_type: "proposal",
    details: { new_status: status },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal status updated successfully.",
    }),
  };
});
