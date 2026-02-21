import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { submitRevisedProposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event) => {
  // Extract proponent identity from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  // Parse JSON body
  const body = JSON.parse(event.body || "{}");

  // Validate fields — inject proponent_id from JWT, not from body
  const validation = submitRevisedProposalSchema.safeParse({
    ...body,
    proponent_id: auth.userId,
  });

  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation.error.issues,
      }),
    };
  }

  const { file_url, proposal_id, proponent_id, project_title, revision_response, plan_start_date, plan_end_date, budget } = validation.data;

  // Submit revision via service (file already uploaded to S3 by browser)
  const proposalService = new ProposalService(supabase);
  const { data, error } = await proposalService.submitRevision(
    {
      proposal_id,
      proponent_id,
      project_title,
      revision_response,
      plan_start_date,
      plan_end_date,
      budget,
    },
    file_url
  );

  if (error) {
    console.error("Error submitting revision", error);

    const errorMessage = error.message || "";
    let statusCode = 500;

    if (errorMessage.includes("permission") || errorMessage.includes("do not have")) {
      statusCode = 403;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("status")) {
      statusCode = 400;
    }

    return {
      statusCode,
      body: JSON.stringify({
        message: errorMessage || "Failed to submit revision",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Revision submitted successfully",
      data,
    }),
  };
});
