import { APIGatewayProxyHandler } from "aws-lambda";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://wzcdvmdwdfmbpaxohswb.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "contact_info")
      .maybeSingle();

    if (error) {
      console.error("Error fetching contact info:", error);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Supabase error", detail: error.message, code: error.code }),
      };
    }

    if (!data || !data.value) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Contact information not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data.value),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Unexpected crash", detail: err?.message, stack: err?.stack?.split("\n").slice(0, 3).join(" | ") }),
    };
  }
};
