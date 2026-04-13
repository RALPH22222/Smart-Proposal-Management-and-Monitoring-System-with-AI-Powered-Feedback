import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseKey } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { changePasswordSchema } from "../../schemas/auth-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    const auth = getAuthContext(event);

    if (!auth.userId || !auth.email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: parsed.error.issues[0]?.message || "Invalid input",
        }),
      };
    }

    // 1. Verify current password by signing in as the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: auth.email,
      password: parsed.data.current_password,
    });

    if (signInError || !signInData?.session) {
      console.error("Sign-in verification failed:", JSON.stringify(signInError));
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Current password is incorrect." }),
      };
    }

    // 2. Use the sign-in access token to update the password as the user.
    //    This requires NO service-role key — just the anon key.
    const userClient = createClient(supabaseUrl, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`,
        },
      },
      auth: { persistSession: false },
    });

    const { error: updateError } = await userClient.auth.updateUser({
      password: parsed.data.new_password,
    });

    if (updateError) {
      console.error("Password update error:", JSON.stringify(updateError));
      return {
        statusCode: 500,
        body: JSON.stringify({ message: updateError.message || "Failed to update password." }),
      };
    }

    // 3. Clear the password_change_required flag (best-effort)
    await supabase
      .from("users")
      .update({ password_change_required: false })
      .eq("id", auth.userId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Password changed successfully" }),
    };
  } catch (err: any) {
    console.error("Unhandled error in change-password:", JSON.stringify(err, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err?.message || "An unexpected error occurred." }),
    };
  }
});
