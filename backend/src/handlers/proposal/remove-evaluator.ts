import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { removeEvaluatorSchema } from "../../schemas/proposal-schema";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
    // Read from query params rather than event.body. DELETE-with-body is
    // unreliable across Vercel rewrites and some API Gateway configurations,
    // so callers now send proposal_id and evaluator_id as query strings.
    const qs = event.queryStringParameters || {};
    const payload = {
        proposal_id: qs.proposal_id != null ? Number(qs.proposal_id) : undefined,
        evaluator_id: qs.evaluator_id,
    };

    // Payload Validation
    const result = removeEvaluatorSchema.safeParse(payload);

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
    const { error } = await proposalService.removeEvaluator(result.data.proposal_id, result.data.evaluator_id);

    if (error) {
        console.error("Supabase error: ", JSON.stringify(error, null, 2));
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal server error.",
                error: error.message
            }),
        };
    }

    const user_sub = event.requestContext.authorizer?.user_sub as string;
    if (user_sub) {
        await logActivity(supabase, {
            user_id: user_sub,
            action: "evaluator_removed",
            category: "evaluation",
            target_id: String(result.data.proposal_id),
            target_type: "proposal",
            details: { evaluator_id: result.data.evaluator_id },
        });
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Evaluator removed successfully.",
        }),
    };
});
