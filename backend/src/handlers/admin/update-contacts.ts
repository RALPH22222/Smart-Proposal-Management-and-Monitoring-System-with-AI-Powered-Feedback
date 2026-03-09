import { APIGatewayProxyHandler } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";
import { ContactInfoSchema } from "../../schemas/contact-schema";
import { logActivity } from "../../utils/activity-logger";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.SUPABASE_URL || "https://wzcdvmdwdfmbpaxohswb.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY!;
const jwtSecret = process.env.SUPABASE_SECRET_JWT!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Verify Authorization Header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing or invalid authorization token" }),
      };
    }

    const token = authHeader.split(" ")[1];
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Invalid or expired token" }),
      };
    }

    // 2. Authorization Verification (Must be Admin)
    const { user_metadata, sub: userId } = decodedToken;
    const roles = user_metadata?.roles || [];
    if (!roles.includes("admin")) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Forbidden: Admin access only" }),
      };
    }

    // 3. Request Validation
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const payload = JSON.parse(event.body);
    const parsedData = ContactInfoSchema.safeParse(payload);

    if (!parsedData.success) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: "Validation failed",
          errors: parsedData.error.flatten(),
        }),
      };
    }

    // 4. Update the Database
    const { data: updatedSettings, error: upsertError } = await supabase
      .from("system_settings")
      .upsert(
        { key: "contact_info", value: parsedData.data },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert failed:", upsertError);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Failed to update contact info" }),
      };
    }

    // 5. Log Activity (assuming logActivity util handles writing to logs table)
    await logActivity(supabase, {
      user_id: userId,
      action: "updated_contacts",
      category: "account",
      target_type: "user",
      details: { message: "Updated contact info configuration" },
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Contact information updated successfully",
        data: updatedSettings.value,
      }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
