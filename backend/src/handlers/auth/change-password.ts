import { supabase } from "../../lib/supabase";
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

    // 1. Sign in with current password — this both VERIFIES the current password
    //    AND sets the active session on the supabase client instance.
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

    // 2. signInWithPassword set the session on the client, so updateUser will
    //    use it automatically — no admin/service-role key needed.
    const { error: updateError } = await supabase.auth.updateUser({
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
