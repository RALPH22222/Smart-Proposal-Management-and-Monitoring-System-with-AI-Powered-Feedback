import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multipart from "lambda-multipart-parser";
import { supabase } from "../../lib/supabase";
import { AdminService } from "../../services/admin.service";
import { createAccountSchema } from "../../schemas/admin-schema";
import { profileSetupSchema } from "../../schemas/auth-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

const s3Client = new S3Client({});

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  try {
    const contentType = event.headers?.["Content-Type"] || event.headers?.["content-type"] || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: Record<string, unknown>;
    let photoFile: { filename: string; contentType: string; content: Buffer } | null = null;

    if (isMultipart) {
      const payload = await multipart.parse(event);
      const { files, ...rest } = payload;
      body = rest;
      if (files && files.length > 0) {
        const photoValidation = profileSetupSchema.shape.photo_profile_url.safeParse(files[0]);
        if (!photoValidation.success) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: "Invalid photo",
              errors: photoValidation.error.flatten().formErrors,
            }),
          };
        }
        photoFile = files[0];
      }
    } else {
      body = JSON.parse(event.body || "{}");
    }

    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Validation error", errors: parsed.error.flatten().fieldErrors }),
      };
    }

    const service = new AdminService(supabase);
    const { data, error } = await service.createAccount(parsed.data);

    if (error) {
      return {
        statusCode: (error as any).status || 400,
        body: JSON.stringify({ message: (error as any).message || "Failed to create account" }),
      };
    }

    if (photoFile && data?.user) {
      const bucketName = process.env.PROFILE_SETUP_BUCKET_NAME;
      if (!bucketName) {
        console.error("PROFILE_SETUP_BUCKET_NAME is not defined — account created without photo");
      } else {
        try {
          const safeFilename = photoFile.filename.replace(/[^\w.\-]+/g, "_");
          const key = `profile-photos/${data.user.id}-${safeFilename}`;

          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: photoFile.content,
              ContentType: photoFile.contentType,
            }),
          );

          const photoUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
          await supabase.from("users").update({ photo_profile_url: photoUrl }).eq("id", data.user.id);
        } catch (s3Error) {
          console.error("Photo upload failed (non-critical):", s3Error);
        }
      }
    }

    const { userId } = getAuthContext(event);
    await logActivity(supabase, {
      user_id: userId,
      action: "account_created",
      category: "account",
      target_id: data?.user?.id || undefined,
      target_type: "user",
      details: { email: parsed.data.email, roles: parsed.data.roles },
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Account created successfully", data }),
    };
  } catch (err: any) {
    console.error("Error creating account:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
});
