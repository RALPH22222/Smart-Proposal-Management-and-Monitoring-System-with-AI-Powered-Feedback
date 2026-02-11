import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AuthService } from "../../services/auth.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { signUpSchema, signUpWithProfileSchema } from "../../schemas/auth-schema";
import multipart from "lambda-multipart-parser";

const s3Client = new S3Client({});

/**
 * Handles both:
 * - multipart/form-data  → new 3-step sign-up (account + profile + optional photo)
 * - application/json     → legacy sign-up (account only, profile setup later)
 */
export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  const contentType = event.headers?.["Content-Type"] || event.headers?.["content-type"] || "";
  const isMultipart = contentType.includes("multipart/form-data");

  const authService = new AuthService(supabase);

  // ═══════════════════════════════════════════════════════════
  // NEW PATH: multipart/form-data — 3-step sign-up with profile
  // ═══════════════════════════════════════════════════════════
  if (isMultipart) {
    const Bucket = process.env.PROFILE_SETUP_BUCKET_NAME;
    if (!Bucket) {
      console.error("PROFILE_SETUP_BUCKET_NAME is not defined");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server configuration error." }),
      };
    }

    // Parse multipart form data
    const payload = await multipart.parse(event);
    const { files, ...body } = payload;

    // Validate all fields (account + profile) together
    const validation = signUpWithProfileSchema.safeParse({
      ...body,
      ...(files && files.length > 0 ? { photo_profile_url: files[0] } : {}),
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

    const { photo_profile_url, ...profileData } = validation.data;

    // 1. Create account + update profile (without photo first)
    const { data, error, profileError } = await authService.signupWithProfile(profileData, null);

    if (error) {
      console.error("Error during sign up with profile: ", JSON.stringify(error, null, 2));
      return {
        statusCode: (error as { status?: number }).status || 400,
        body: JSON.stringify({
          message: error.message || (error as { code?: string }).code,
        }),
      };
    }

    if (profileError) {
      console.error("Profile update error (account was created): ", JSON.stringify(profileError, null, 2));
      // Account was created but profile failed — still return success
      // User can complete profile via the fallback profile-setup page
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Account created but profile setup incomplete. Please complete your profile after login.",
        }),
      };
    }

    // 2. Upload photo to S3 if provided (only after account is created)
    if (photo_profile_url && data?.user) {
      try {
        const safeFilename = photo_profile_url.filename.replace(/[^\w.\-]+/g, "_");
        const Key = `profile-photos/${data.user.id}-${safeFilename}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket,
            Key,
            Body: photo_profile_url.content,
            ContentType: photo_profile_url.contentType,
          }),
        );

        const photoUrl = `https://${Bucket}.s3.us-east-1.amazonaws.com/${Key}`;

        // Update user row with photo URL
        const { error: photoUpdateError } = await supabase
          .from("users")
          .update({ photo_profile_url: photoUrl })
          .eq("id", data.user.id);

        if (photoUpdateError) {
          console.error("Failed to save photo URL (non-critical): ", photoUpdateError);
        }
      } catch (s3Error) {
        console.error("S3 upload failed (non-critical): ", s3Error);
        // Photo upload is non-critical — account + profile are already saved
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Account created successfully." }),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY PATH: application/json — account-only sign-up
  // ═══════════════════════════════════════════════════════════
  const payload = JSON.parse(event.body || "{}");

  const result = signUpSchema.safeParse(payload);

  if (result.error) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        type: "validation_error",
        data: result.error.issues,
      }),
    };
  }

  const { data, error } = await authService.signup(result.data);

  if (error) {
    console.error("Error during sign up: ", JSON.stringify(error, null, 2));
    return {
      statusCode: (error as { status?: number }).status || 400,
      body: JSON.stringify({
        message: error.message || (error as { code?: string }).code,
      }),
    };
  }

  console.log("Data response: ", JSON.stringify(data, null, 2));

  if (data.user && data.user.role !== "authenticated" && data.user.role === "") {
    console.error("Email already exists. ");
    return {
      statusCode: 409,
      body: JSON.stringify({ message: "Email already exists." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Account created successfully." }),
  };
});
