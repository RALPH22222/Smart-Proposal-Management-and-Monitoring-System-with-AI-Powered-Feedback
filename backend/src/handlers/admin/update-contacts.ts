import { ContactInfoSchema } from "../../schemas/contact-schema";
import { logActivity } from "../../utils/activity-logger";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

export const handler = buildCorsHeaders(async (event) => {
  try {
    // 1. Authorization Verification (Must be Admin)
    const { userId, roles } = getAuthContext(event);
    
    if (!userId || !roles.includes("admin")) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Forbidden: Admin access only" }),
      };
    }

    // 3. Request Validation
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const payload = JSON.parse(event.body);
    const parsedData = ContactInfoSchema.safeParse(payload);

    if (!parsedData.success) {
      return {
        statusCode: 400,
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
      body: JSON.stringify({
        message: "Contact information updated successfully",
        data: updatedSettings.value,
      }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
