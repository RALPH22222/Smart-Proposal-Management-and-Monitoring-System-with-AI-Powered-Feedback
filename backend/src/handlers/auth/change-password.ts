import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseKey } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { changePasswordSchema } from "../../schemas/auth-schema";

export const handler = buildCorsHeaders(async (event) => {
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

  // 1. Verify current password — sign in as the user with their credentials.
  //    Using the anon-key client (supabase) which is correct for signInWithPassword.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.email,
    password: parsed.data.current_password,
  });

  if (signInError || !signInData?.session) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Current password is incorrect." }),
    };
  }

  // 2. Update the password using a user-scoped client built from the sign-in
  //    access token. This requires NO service-role key — just the anon key.
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
    console.error("Change password update error:", JSON.stringify(updateError, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: updateError.message || "Failed to update password." }),
    };
  }

  // 3. Clear password_change_required flag (best-effort — skip if it fails)
  try {
    await supabase
      .from("users")
      .update({ password_change_required: false })
      .eq("id", auth.userId);
  } catch (_) {
    // Non-critical — don't fail the whole request
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Password changed successfully" }),
  };
});
