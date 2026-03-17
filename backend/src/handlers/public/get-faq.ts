import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { DEFAULT_FAQ_INFO } from "../../schemas/faq-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "faq_info")
      .maybeSingle();

    if (error) {
      console.error("Error fetching faq info:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to fetch FAQ information" }),
      };
    }

    // Return the database data, or fall back to the initial hardcoded defaults
    const faqData = data?.value || DEFAULT_FAQ_INFO;

    return {
      statusCode: 200,
      body: JSON.stringify({ data: faqData }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
