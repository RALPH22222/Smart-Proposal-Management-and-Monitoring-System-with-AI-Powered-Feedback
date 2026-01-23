import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { submitRevisedProposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import multipart from "lambda-multipart-parser";

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
  const validation = submitRevisedProposalSchema.safeParse({
    ...body,
    file_url: files[0],
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

  const { file_url, proposal_id, proponent_id, project_title, revision_response } = validation.data;

  // Get version count for path naming
  const proposalService = new ProposalService(supabase);

  // First verify the proposal exists and get version count
  const { count: versionCount } = await supabase
    .from("proposal_version")
    .select("*", { count: "exact", head: true })
    .eq("proposal_id", proposal_id);

  const newVersionNumber = (versionCount || 0) + 1;

  // Upload file to S3 bucket with versioned path
  const Key = `proposals/${proposal_id}/v${newVersionNumber}/${file_url.filename}`;
  const command = new PutObjectCommand({
    Bucket,
    Key,
    Body: files[0].content,
    ContentType: files[0].contentType,
  });
  await s3Client.send(command);

  const fileUrl = `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`;

  // Submit revision via service
  const { data, error } = await proposalService.submitRevision(
    {
      proposal_id,
      proponent_id,
      project_title,
      revision_response,
    },
    fileUrl
  );

  if (error) {
    console.error("Error submitting revision", error);

    // Determine appropriate status code
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
