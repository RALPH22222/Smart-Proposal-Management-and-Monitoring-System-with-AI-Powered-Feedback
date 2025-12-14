import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import multipart from "lambda-multipart-parser";
// import { Status } from "../../types/proposal"; // Import Status Enum

// Initialize S3
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = buildCorsHeaders(async (event) => {
  try {
    if (!process.env.PROPOSAL_BUCKET_NAME) {
      throw new Error("PROPOSAL_BUCKET_NAME is not defined");
    }
    const Bucket = process.env.PROPOSAL_BUCKET_NAME;

    // 1. Parse Multipart Data
    const payload = await multipart.parse(event);
    const { files, ...body } = payload;

    if (!files || files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "No file uploaded" }) };
    }

    // 2. Parse JSON Strings
    const budgetItems = body.budgetItems ? JSON.parse(body.budgetItems) : [];
    const cooperatingAgencies = body.cooperatingAgencies ? JSON.parse(body.cooperatingAgencies) : [];
    const implementationSites = body.implementationSite ? JSON.parse(body.implementationSite) : [];
    const priorityAreas = body.priorityAreas ? JSON.parse(body.priorityAreas) : [];

    // 3. Prepare Payload for Zod Validation
    const rawPayload = {
      ...body,
      budgetItems,
      cooperatingAgencies,
      implementationSite: implementationSites,
      priorityAreas,
      proposal_file: files[0]
    };

    // 4. Validation (This converts strings to Enums automatically)
    const validation = proposalSchema.safeParse(rawPayload);

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

    // 5. Create Proposal Record
    const proposalService = new ProposalService(supabase);

    // FIXED SECTION: Pass Enums directly. No ternary operators needed.
    const { data: proposal, error: createError } = await proposalService.create({
      ...data,
      // Pass the Enums directly (Zod already validated them)
      researchType: data.researchType, 
      developmentType: data.developmentType,
      implementationMode: data.implementationMode,
      // Ensure 'status' defaults to REVIEW_RND inside your Service, or pass it here
    });

    if (createError || !proposal) {
      console.error("Database Error:", createError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to create proposal record" }),
      };
    }

    // 6. Upload File to S3
    const proposalId = proposal.id;
    const file = files[0];
    const Key = `proposals/${proposalId}/${file.filename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket,
      Key,
      Body: file.content,
      ContentType: file.contentType
    }));

    const fileUrl = `https://${Bucket}.s3.amazonaws.com/${Key}`;

    // 7. Create Version
    await proposalService.createVersion({
      proposal_id: proposalId!, // TS Assertion: ID exists after create
      file_url: fileUrl
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Proposal submitted successfully",
        proposalId: proposalId
      }),
    };

  } catch (err: any) {
    console.error("Handler Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal Server Error" }),
    };
  }
});