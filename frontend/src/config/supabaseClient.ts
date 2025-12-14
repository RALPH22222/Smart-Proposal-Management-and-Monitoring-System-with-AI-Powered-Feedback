import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ilutdlvlhjpxsyvedyxf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdXRkbHZsaGpweHN5dmVkeXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTg3ODksImV4cCI6MjA3OTI5NDc4OX0.UyMtc1mwY4OQFc7gIaFXjPGeDZ8gbGchkcLp7Lbxom8";

// console.log(supabaseUrl);
// console.log(supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
