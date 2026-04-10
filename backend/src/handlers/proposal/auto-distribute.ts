import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const { userId } = getAuthContext(event);
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const proposalIds: number[] | undefined = body.proposal_ids;

  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.autoDistribute(proposalIds);

  if (error) {
    console.error("Auto-distribute error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to auto-distribute proposals" }),
    };
  }

  // Log activity and notify assigned RND staff
  if (data && data.results.length > 0) {
    // Fetch proposal titles for notifications
    const distributedIds = data.results.map((r) => r.proposal_id);
    const { data: proposals } = await supabase
      .from("proposals")
      .select("id, project_title")
      .in("id", distributedIds);

    const titleMap = new Map(proposals?.map((p) => [p.id, p.project_title]) || []);

    for (const result of data.results) {
      await logActivity(supabase, {
        user_id: userId,
        action: "proposal_auto_distributed",
        category: "proposal",
        target_id: String(result.proposal_id),
        target_type: "proposal",
        details: { rnd_id: result.rnd_id, rnd_load: result.rnd_load },
      });

      // Notify assigned RND
      const title = titleMap.get(result.proposal_id) || "a proposal";
      await supabase.from("notifications").insert({
        user_id: result.rnd_id,
        message: `A proposal "${title}" has been assigned to you for quality review.`,
        is_read: false,
        link: "proposals",
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Successfully distributed ${data?.distributed || 0} proposal(s) to R&D.`,
      ...data,
    }),
  };
});
