import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const handler = buildCorsHeaders(async (event) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const projectTitle: string = body.project_title;
  const availableTags: string[] = body.available_tags;

  if (!projectTitle || typeof projectTitle !== "string" || projectTitle.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "project_title is required" }),
    };
  }

  if (!Array.isArray(availableTags) || availableTags.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "available_tags must be a non-empty array of strings" }),
    };
  }

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "AI features are currently unavailable" }),
    };
  }

  const prompt = `You are a helpful assistant. You are given a project title: "${projectTitle}". Identify 1 to 4 tags that best match the project from this exact list of available tags: ${JSON.stringify(availableTags)}. If none of the available tags fit well, strictly use the tag "Other". Return ONLY a valid JSON array of strings (e.g. ["Environment", "Renewable Energy"]). No markdown formatting, no explanation, no quotation marks outside the array.`;

  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000;
  let response: Response | null = null;
  let success = false;

  while (attempt < maxRetries && !success) {
    try {
      response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.status === 429) {
        console.warn(`Rate limit reached. Retrying in ${delay}ms... (Attempt ${attempt + 1} of ${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        delay *= 2;
      } else if (response.status === 403) {
        console.warn("API Key forbidden or invalid. Stopping retries.");
        break;
      } else {
        success = true;
      }
    } catch (fetchErr) {
      console.warn(`Fetch error occurred. Retrying in ${delay}ms... (Attempt ${attempt + 1} of ${maxRetries})`, fetchErr);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
      delay *= 2;
    }
  }

  if (!response || !response.ok) {
    const status = response?.status;
    if (status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ message: "Too many requests to the AI service. Please try again later." }),
      };
    }
    if (status === 403) {
      return {
        statusCode: 502,
        body: JSON.stringify({ message: "AI service authentication failed" }),
      };
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ message: "Failed to contact AI service" }),
    };
  }

  const rawResult: any = await response.json();
  let resultText: string = rawResult.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  // Clean up markdown syntax if AI still outputs it
  resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const generatedTags: string[] = JSON.parse(resultText);

    // Filter to only tags that exist in the available list (case-insensitive)
    const matchedTags = generatedTags
      .filter((tag) => availableTags.some((at) => at.toLowerCase() === tag.toLowerCase()))
      .slice(0, 4);

    return {
      statusCode: 200,
      body: JSON.stringify({ tags: matchedTags }),
    };
  } catch (parseErr) {
    console.error("Failed to parse Gemini response:", resultText);
    return {
      statusCode: 502,
      body: JSON.stringify({ message: "Failed to parse AI response" }),
    };
  }
});
