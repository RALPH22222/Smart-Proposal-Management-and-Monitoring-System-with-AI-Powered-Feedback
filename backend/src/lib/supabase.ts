import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey) {
  throw new Error("Missing environment variable SUPABASE_KEY.");
}
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client using service_role key — required for auth.admin.* methods
// Only initialize when the env var is present (only invite-user Lambda needs it)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
