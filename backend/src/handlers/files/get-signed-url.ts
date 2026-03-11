import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const s3Client = new S3Client({});

const PROPOSAL_BUCKET = process.env.PROPOSAL_BUCKET_NAME || "";
const PROFILE_BUCKET = process.env.PROFILE_BUCKET_NAME || "";

const BUCKET_MAP: Record<string, string> = {
  proposals: PROPOSAL_BUCKET,
  profiles: PROFILE_BUCKET,
};

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const { key, bucket } = event.queryStringParameters || {};

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
      body: JSON.stringify({ message: "Invalid bucket. Allowed: proposals, profiles" }),
    };
  }

  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    body: JSON.stringify({ url }),
  };
});
