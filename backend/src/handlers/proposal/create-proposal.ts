import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";

const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event) => {
  if (!process.env.PROPOSAL_BUCKET_NAME) {
    throw new Error("PROPOSAL_BUCKET_NAME is not defined");
  }
  const Bucket = process.env.PROPOSAL_BUCKET_NAME;

  const body = JSON.parse(event.body || "{}");

  // Validate form fields
  const validation = proposalSchema.safeParse(body);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation.error.issues,
      }),
    };
  }

  const { proposal_file, ...data } = validation.data;

  // Create Proposal + Proposal Version
  const proposalService = new ProposalService(supabase);
  const { data: proposal, error: createError } = await proposalService.create({
    ...data,
  });

  if (createError || !proposal) {
    console.error("Error creating proposal", createError);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create proposal",
      }),
    };
  }

  // Upload file to S3 bucket
  const Key = `proposals/${proposal.id}/${proposal_file.name}`;
  const command = new PutObjectCommand({
    Bucket,
    Key,
    Body: proposal_file,
  });
  await s3Client.send(command);

  // Create version
  await proposalService.createVersion({
    proposal_id: proposal.id,
    file_url: `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal submitted successfully",
    }),
  };
});
