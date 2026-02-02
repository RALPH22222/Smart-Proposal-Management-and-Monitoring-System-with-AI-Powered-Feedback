import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { AuthService } from "../../services/auth.service";
import { profileSetupSchema } from "../../schemas/auth-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import multipart from "lambda-multipart-parser";

const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }
  const authService = new AuthService(supabase);

  if (!process.env.PROFILE_SETUP_BUCKET_NAME) {
    throw new Error("PROFILE_SETUP_BUCKET_NAME is not defined");
  }
  const Bucket = process.env.PROFILE_SETUP_BUCKET_NAME;

  // Parse Multipart Data
  const payload = await multipart.parse(event);
  const { files, ...body } = payload;

  // 1) Ensure file exists early (optional but clearer error)
  if (!files || files.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: [{ message: "photo_profile_url is required" }],
      }),
    };
  }

  // 2) Validate form fields + file (type + max size)
  const validation = profileSetupSchema.safeParse({
    ...body,
    photo_profile_url: files[0],
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

  // validation.data.photo_profile_url has: filename, contentType, content (Buffer)
  const { photo_profile_url, ...data } = validation.data;

  // 3) Upload to S3
  const safeFilename = photo_profile_url?.filename.replace(/[^\w.\-]+/g, "_");
  const Key = `profile-photos/${auth.userId}-${safeFilename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: photo_profile_url?.content,
      ContentType: photo_profile_url?.contentType,
    }),
  );

  // 4) Build URL (region-aware)
  const photoUrl = `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`;

  // 5) Persist to DB via service
  const { error: profileSetupError } = await authService.profileSetup(auth.userId, {
    ...data,
    photo_profile_url: photoUrl,
  });

  if (profileSetupError) {
    console.error("Supabase error: ", JSON.stringify(profileSetupError, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Profile setup completed successfully." }),
  };
});
