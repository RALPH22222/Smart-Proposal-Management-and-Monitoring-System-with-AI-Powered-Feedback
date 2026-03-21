import { supabase, supabaseAdmin } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { HomeInfoSchema } from "../../schemas/home-schema";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

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

    // 2. Client Selection (Use Admin client to bypass RLS for system settings)
    const db = supabaseAdmin || supabase;

    // 3. Request Validation
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const body = JSON.parse(event.body);
    const parsed = HomeInfoSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid home data",
          errors: parsed.error.flatten(),
        }),
      };
    }

    // 4. Update the Database
    const { error } = await db
      .from("system_settings")
      .upsert(
        { key: "home_info", value: parsed.data },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error updating home info:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to update home information" }),
      };
    }

    // 5. Log Activity
    await logActivity(db, {
      user_id: userId,
      action: "updated_home",
      category: "account",
      target_type: "user",
      details: { message: "Updated home page configuration" },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Home information updated successfully",
        data: parsed.data,
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
