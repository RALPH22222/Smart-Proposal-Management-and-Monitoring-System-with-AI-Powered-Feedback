import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { DEFAULT_HOME_INFO } from "../../schemas/home-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "home_info")
      .maybeSingle();

    if (error) {
      console.error("Error fetching home info:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to fetch home information" }),
      };
    }

    const homeData = data?.value || DEFAULT_HOME_INFO;

    return {
      statusCode: 200,
      body: JSON.stringify({ data: homeData }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
