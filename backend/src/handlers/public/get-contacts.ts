import { buildCorsHeaders } from "../../utils/cors";
import { supabase } from "../../lib/supabase";
import { DEFAULT_CONTACT_INFO } from "../../schemas/contact-schema";

export const handler = buildCorsHeaders(async (event) => {
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
        body: JSON.stringify({ message: "Supabase error", detail: error.message, code: error.code }),
      };
    }

    // Deep merge with defaults so existing DB rows missing 'hero' still work correctly
    const contactData = {
      ...DEFAULT_CONTACT_INFO,
      ...(data?.value || {}),
      hero: {
        ...DEFAULT_CONTACT_INFO.hero,
        ...(data?.value?.hero || {}),
      },
      location: {
        ...DEFAULT_CONTACT_INFO.location,
        ...(data?.value?.location || {}),
      },
      phones: {
        ...DEFAULT_CONTACT_INFO.phones,
        ...(data?.value?.phones || {}),
      },
      emails: {
        ...DEFAULT_CONTACT_INFO.emails,
        ...(data?.value?.emails || {}),
      },
      officeHours: {
        ...DEFAULT_CONTACT_INFO.officeHours,
        ...(data?.value?.officeHours || {}),
      },
      emergency: {
        ...DEFAULT_CONTACT_INFO.emergency,
        ...(data?.value?.emergency || {}),
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(contactData),
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Unexpected crash", detail: err?.message }),
    };
  }
});
