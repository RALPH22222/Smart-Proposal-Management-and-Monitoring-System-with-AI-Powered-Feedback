import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { HomeInfoSchema } from "../../schemas/home-schema";

export const handler = buildCorsHeaders(async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }

    const body = JSON.parse(event.body);
    const parsed = HomeInfoSchema.safeParse(body);

    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid home data",
          errors: parsed.error.errors,
        }),
      };
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert(
        { key: "home_info", value: parsed.data },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error updating home info:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to update home information" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Home information updated successfully",
        data: parsed.data,
      }),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
});
