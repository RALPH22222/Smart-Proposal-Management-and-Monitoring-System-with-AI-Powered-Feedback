import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const s3Client = new S3Client({});

const PROPOSAL_BUCKET = process.env.PROPOSAL_BUCKET_NAME || "";
const PROFILE_BUCKET = process.env.PROFILE_BUCKET_NAME || "";
const CMS_BUCKET = process.env.CMS_BUCKET_NAME || "";

const BUCKET_MAP: Record<string, string> = {
  proposals: PROPOSAL_BUCKET,
  profiles: PROFILE_BUCKET,
  cms: CMS_BUCKET,
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const { key, bucket, method = "GET", contentType } = event.queryStringParameters || {};

  if (!key || !bucket) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required parameters: key, bucket" }),
    };
  }

  const bucketName = BUCKET_MAP[bucket];
  if (!bucketName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid bucket. Allowed: proposals, profiles, cms" }),
    };
  }

  let command;
  if (method.toUpperCase() === "PUT") {
    command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });
  } else {
    // Verify the object exists before generating a signed GET URL
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    } catch (headErr: any) {
      const httpStatus = headErr.$metadata?.httpStatusCode;
      if (headErr.name === "NotFound" || httpStatus === 404) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "File not found in storage" }),
        };
      }
      // Any other S3 error (AccessDenied, etc.) — return it instead of generating a broken signed URL
      return {
        statusCode: httpStatus || 500,
        body: JSON.stringify({ message: headErr.message || "Unable to access file in storage" }),
      };
    }
    command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  }

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    body: JSON.stringify({ url }),
  };
});
