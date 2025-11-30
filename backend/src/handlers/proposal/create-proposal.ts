import Busboy from "busboy";
import { supabase, PROPOSAL_FILES_BUCKET } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { ALLOWED_MIME_TYPES } from "../../constants/file-types";

export const handler = buildCorsHeaders(async (event) => {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing body" }) };
  }

  const contentType = event.headers["content-type"];

  if (!contentType?.startsWith("multipart/form-data")) {
    return { statusCode: 400, body: JSON.stringify({ message: "Must be multipart/form-data" }) };
  }

  const busboy = Busboy({ headers: { "content-type": contentType } });

  let fileBuffer: Buffer | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  const fields: Record<string, string> = {};

  await new Promise((resolve, reject) => {
    busboy.on("file", (fieldname, file, info) => {
      mimeType = info.mimeType;
      fileName = info.filename;

      const chunks: Buffer[] = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => (fileBuffer = Buffer.concat(chunks)));
    });

    busboy.on("field", (field: string, value: string) => (fields[field] = value));
    busboy.on("finish", () => resolve({ fields, fileBuffer, fileName, mimeType }));
    busboy.on("error", reject);

    const body = event.isBase64Encoded ? Buffer.from(event.body!, "base64") : Buffer.from(event.body!);

    busboy.end(body);
  });

  // Validate file
  if (!mimeType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing MIME type." }),
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid file type." }),
    };
  }

  if (!fileBuffer || !fileName || !mimeType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "File not uploaded correctly." }),
    };
  }

  // Validate form fields
  const validation = proposalSchema.safeParse(fields);
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ type: "validation_error", data: validation.error.issues }),
    };
  }

  const data = validation.data;

  // Upload file to Supabase Storage
  const objectPath = `proposals/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(PROPOSAL_FILES_BUCKET)
    .upload(objectPath, fileBuffer, { contentType: mimeType });

  if (uploadError) {
    console.error(uploadError);
    return { statusCode: 500, body: JSON.stringify({ message: "File upload failed" }) };
  }

  // Build public URL
  const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${PROPOSAL_FILES_BUCKET}/${objectPath}`;

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
  // Create version
  await proposalService.createVersion({
    proposal_id: proposal.id,
    file_url: fileUrl,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal submitted successfully",
    }),
  };
});
