import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const s3Client = new S3Client({});

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const handler = buildCorsHeaders(async (event) => {
  if (!process.env.PROPOSAL_BUCKET_NAME) {
    throw new Error("PROPOSAL_BUCKET_NAME is not defined");
  }
  const Bucket = process.env.PROPOSAL_BUCKET_NAME;

  // Require authentication
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const { filename, contentType, fileSize } = event.queryStringParameters || {};

  if (!filename) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required query parameter: filename" }),
    };
  }

  const parsedFileSize = Number(fileSize);
  if (!fileSize || isNaN(parsedFileSize) || parsedFileSize <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing or invalid query parameter: fileSize" }),
    };
  }

  if (parsedFileSize > MAX_FILE_SIZE) {
    return {
      statusCode: 413,
      body: JSON.stringify({ message: "File exceeds the 10 MB limit" }),
    };
  }

  if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Invalid contentType. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
      }),
    };
  }

  const Key = `proposals/uploads/${auth.userId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const fileUrl = `https://${Bucket}.s3.amazonaws.com/${Key}`;

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadUrl, fileUrl }),
  };
});
