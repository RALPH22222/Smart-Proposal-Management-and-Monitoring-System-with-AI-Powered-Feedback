import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema, proposalVersionSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import multipart from "lambda-multipart-parser";
// import { Status } from "../../types/proposal"; // Import Status Enum

// Initialize S3
const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event) => {
  if (!process.env.PROPOSAL_BUCKET_NAME) {
    throw new Error("PROPOSAL_BUCKET_NAME is not defined");
  }
  const Bucket = process.env.PROPOSAL_BUCKET_NAME;

  // Parse Multipart Data
  const payload = await multipart.parse(event);
  const { files, ...body } = payload;

  // Validate form fields
  const validation = proposalSchema.safeParse({
    ...body,
    proposal_file: files[0],
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
  const Key = `proposals/${proposal.id}/${proposal_file.filename}`;
  const command = new PutObjectCommand({
    Bucket,
    Key,
    Body: files[0].content,
  });
  await s3Client.send(command);

  // Validate form fields
  const validation_version = proposalVersionSchema.safeParse({
    proposal: proposal.id,
    proposal_file: `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`,
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

  const data_version = validation_version.data;
  // Create Proposal Version
  await proposalService.createVersion(data_version);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal submitted successfully",
    }),
  };
});
