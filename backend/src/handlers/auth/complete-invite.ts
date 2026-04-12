import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { completeInviteSchema } from "../../schemas/admin-schema";
import { profileSetupSchema } from "../../schemas/auth-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import multipart from "lambda-multipart-parser";
import { logActivity } from "../../utils/activity-logger";

const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const { userId } = getAuthContext(event);

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // Parse multipart form data
    const payload = await multipart.parse(event);
    const { files, ...body } = payload;

    // Validate form fields
    const parsed = completeInviteSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const { first_name, last_name, middle_ini, birth_date, sex, department_id } = parsed.data;

    // Handle optional photo upload
    let photoUrl: string | null = null;

    if (files && files.length > 0) {
      const file = files[0];

      // Validate photo using the same schema as profile-setup
      const photoValidation = profileSetupSchema.shape.photo_profile_url.safeParse(file);
      if (!photoValidation.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid photo",
            errors: photoValidation.error.flatten().formErrors,
          }),
        };
      }

      const bucketName = process.env.PROFILE_SETUP_BUCKET_NAME;
      if (!bucketName) {
        throw new Error("PROFILE_SETUP_BUCKET_NAME is not defined");
      }

      const safeFilename = file.filename.replace(/[^\w.\-]+/g, "_");
      const key = `profile-photos/${userId}-${safeFilename}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: file.content,
          ContentType: file.contentType,
        }),
      );

      photoUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
    }

    // Update user record with all profile data
    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        middle_ini: middle_ini || null,
        birth_date,
        sex,
        department_id,
        photo_profile_url: photoUrl,
        profile_completed: true,
        email_verified: true,
      })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.message }),
      };
    }

    // Activate any pending project memberships for this user
    const { data: activated, error: activateError } = await supabase
      .from("project_members")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "pending")
      .select("id");

    if (activateError) {
      console.error("Failed to activate pending project memberships:", activateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Profile updated but failed to activate co-lead invitations." }),
      };
    }
    console.log(`complete-invite: activated ${activated?.length ?? 0} pending membership(s) for user ${userId}`);

    await logActivity(supabase, {
      user_id: userId,
      action: "invite_profile_completed",
      category: "account",
      target_id: userId,
      target_type: "user",
      details: { first_name, last_name },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Profile updated successfully",
        data,
        photoUploaded: !!photoUrl,
      }),
    };
  } catch (err: any) {
    console.error("Error completing invite:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
