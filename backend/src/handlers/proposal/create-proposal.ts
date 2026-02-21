import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema, proposalVersionSchema } from "../../schemas/proposal-schema";
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
  const validation = proposalSchema.safeParse({
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

  const { file_url, ...data } = validation.data;

  // Create Proposal
  const proposalService = new ProposalService(supabase);
  const { data: proposal, error: createError } = await proposalService.create(data);

  if (createError || !proposal) {
    console.error("Error creating proposal", createError);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create proposal",
      }),
    };
  }

  // Validate version entry (file_url already uploaded to S3 by browser)
  const validation_version = proposalVersionSchema.safeParse({
    proposal_id: proposal.id,
    file_url,
  });
  if (!validation_version.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation_version.error.issues,
      }),
    };
  }

  // Create Proposal Version
  await proposalService.createVersion(validation_version.data);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal submitted successfully",
    }),
  };
});
