import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { DEFAULT_ABOUT_INFO } from "../../schemas/about-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "about_info")
      .maybeSingle();

    if (error) {
      console.error("Error fetching about info:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to fetch about information" }),
      };
    }

    // Return the database data, or fall back to the initial hardcoded defaults
    const aboutData = data?.value || DEFAULT_ABOUT_INFO;

    return {
      statusCode: 200,
      body: JSON.stringify({ data: aboutData }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
