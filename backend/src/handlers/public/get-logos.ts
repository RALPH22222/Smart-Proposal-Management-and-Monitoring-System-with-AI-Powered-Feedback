import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { DEFAULT_LOGOS } from "../../schemas/logo-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "logos")
      .maybeSingle();

    if (error) {
      console.error("Error fetching logos:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to fetch logos" }),
      };
    }

    const logosData = {
      ...DEFAULT_LOGOS,
      ...(data?.value || {}),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ data: logosData }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
