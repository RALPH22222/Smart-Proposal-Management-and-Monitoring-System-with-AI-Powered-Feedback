import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { ProfileService } from "../../services/profile.service";
import multipart from "lambda-multipart-parser";

const s3Client = new S3Client({});

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const auth = getAuthContext(event);

  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  if (!process.env.PROFILE_SETUP_BUCKET_NAME) {
    throw new Error("PROFILE_SETUP_BUCKET_NAME is not defined");
  }
  const Bucket = process.env.PROFILE_SETUP_BUCKET_NAME;

  try {
    // Parse Multipart Data
    const payload = await multipart.parse(event);
    const { files } = payload;

    const file = files && files.length > 0 ? files[0] : null;

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No avatar image provided." }),
      };
    }

    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Only JPEG, PNG, or WEBP images are allowed." }),
      };
    }

    if (file.content.byteLength > MAX_PROFILE_PHOTO_BYTES) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Profile photo must be 2MB or less." }),
      };
    }

    const safeFilename = file.filename.replace(/[^\w.\-]+/g, "_");
    const Key = `profile-photos/${auth.userId}-${Date.now()}-${safeFilename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: file.content,
        ContentType: file.contentType,
      }),
    );

    const photoUrl = `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`;

    const service = new ProfileService(supabase);
    const { error } = await service.updateAvatar(auth.userId, photoUrl);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to update profile avatar in database" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ avatarUrl: photoUrl }),
    };

  } catch (err: any) {
    console.error("Error updating avatar:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
