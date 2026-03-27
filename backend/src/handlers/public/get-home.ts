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

    const homeData = {
      ...DEFAULT_HOME_INFO,
      ...(data?.value || {}),
      hero: {
        ...DEFAULT_HOME_INFO.hero,
        ...(data?.value?.hero || {}),
        // Fix the typo if it exists in DB
        badge: (data?.value?.hero?.badge === "Western Mindanao State Universityss")
          ? DEFAULT_HOME_INFO.hero.badge
          : (data?.value?.hero?.badge || DEFAULT_HOME_INFO.hero.badge),
        images: (Array.isArray(data?.value?.hero?.images) && data.value.hero.images.length === 3)
          ? data.value.hero.images
          : DEFAULT_HOME_INFO.hero.images
      },
      stats: data?.value?.stats || DEFAULT_HOME_INFO.stats,
      about: {
        ...DEFAULT_HOME_INFO.about,
        ...(data?.value?.about || {}),
      },
      guidelines: {
        ...DEFAULT_HOME_INFO.guidelines,
        ...(data?.value?.guidelines || {}),
      },
      criteria: {
        ...DEFAULT_HOME_INFO.criteria,
        ...(data?.value?.criteria || {}),
      },
      templates: {
        research_url: data?.value?.templates?.research_url || "",
        project_url: data?.value?.templates?.project_url || "",
      },
    };

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
