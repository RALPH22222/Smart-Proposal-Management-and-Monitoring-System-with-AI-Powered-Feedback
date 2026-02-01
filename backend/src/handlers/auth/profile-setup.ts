import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { AuthService } from "../../services/auth.service";
import { profileSetupSchema } from "../../schemas/auth-schema";
import { buildCorsHeaders } from "../../utils/cors";
import multipart from "lambda-multipart-parser";

const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event) => {
  const { user_sub } = event.requestContext.authorizer as Record<string, string>;

  // Parse Multipart Data
  const payload = await multipart.parse(event);
  const { files, ...body } = payload;

  // Validate required fields (photo is optional)
  const validation = profileSetupSchema.safeParse({
    ...body,
    photo_profile_url: files && files.length > 0 ? files[0] : undefined,
  });

  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        message: validation.error.issues.map(issue => issue.message).join(", "),
        data: validation.error.issues,
      }),
    };
  }

  const { photo_profile_url, department_id: departmentNameOrId, ...data } = validation.data;
  let photoUrl: string | null = null;

  // Look up department ID if a name was provided
  let departmentId: string | null = null;

  // Check if it's a numeric ID or a name
  if (departmentNameOrId && isNaN(Number(departmentNameOrId))) {
    // It's a name, look it up in the database
    const { data: dept, error: deptError } = await supabase
      .from("department")
      .select("id")
      .eq("name", departmentNameOrId)
      .maybeSingle();

    if (deptError || !dept) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          type: "validation_error",
          message: `Department "${departmentNameOrId}" not found. Please select a valid R&D Station.`,
        }),
      };
    }
    departmentId = String(dept.id);
  } else {
    // It's already an ID
    departmentId = departmentNameOrId;
  }

  // Upload photo to S3 only if provided
  if (photo_profile_url) {
    if (!process.env.PROFILE_SETUP_BUCKET_NAME) {
      throw new Error("PROFILE_SETUP_BUCKET_NAME is not defined");
    }
    const Bucket = process.env.PROFILE_SETUP_BUCKET_NAME;

    const safeFilename = photo_profile_url.filename.replace(/[^\w.\-]+/g, "_");
    const Key = `profile-photos/${user_sub}-${safeFilename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: photo_profile_url.content,
        ContentType: photo_profile_url.contentType,
      }),
    );

    photoUrl = `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`;
  }

  // Persist to DB via service
  const authService = new AuthService(supabase);
  const { error } = await authService.profileSetup(user_sub, {
    ...data,
    department_id: departmentId,
    photo_profile_url: photoUrl, // Will be null if no photo uploaded
  });

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Profile setup completed successfully.",
      photoUploaded: !!photoUrl
    }),
  };
});
