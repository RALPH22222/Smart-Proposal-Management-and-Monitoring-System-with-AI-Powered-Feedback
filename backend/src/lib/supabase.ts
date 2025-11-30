import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey) {
  throw new Error("Missing environment variable SUPABASE_KEY.");
}
export const supabase = createClient(supabaseUrl, supabaseKey);

export const PROPOSAL_FILES_BUCKET = "proposal_files";
