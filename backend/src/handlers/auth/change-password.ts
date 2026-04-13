import { supabase, supabaseAdmin } from "../../lib/supabase";
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

  // 1. Verify current password using the anon client (signInWithPassword works with anon key)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.email,
    password: parsed.data.current_password,
  });

  if (signInError) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Current password is incorrect." }),
    };
  }

  // 2. Admin client is required to change another user's password server-side
  if (!supabaseAdmin) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error." }),
    };
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(auth.userId, {
    password: parsed.data.new_password,
  });

  if (updateError) {
    console.error("Change password update error:", JSON.stringify(updateError, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: updateError.message || "Failed to update password." }),
    };
  }

  // 3. Clear the password_change_required flag
  await supabaseAdmin
    .from("users")
    .update({ password_change_required: false })
    .eq("id", auth.userId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Password changed successfully" }),
  };
});
