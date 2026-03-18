import { EventBridgeEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";

export const handler = async (
  event: EventBridgeEvent<"Scheduled Event", Record<string, never>>
) => {
  console.log("Evaluator deadline check triggered at:", event.time);

  const service = new ProposalService(supabase);
  const result = await service.checkAndDeclineOverdueEvaluators();

  console.log("Deadline check complete:", JSON.stringify(result));

  return {
    message: `Processed ${result.processed} overdue evaluator(s)`,
    processed: result.processed,
    errors: result.errors,
  };
};
