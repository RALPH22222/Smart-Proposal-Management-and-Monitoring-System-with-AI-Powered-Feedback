/**
 * AI Analyzer Service (Client)
 * 
 * This is a lightweight proxy that calls the standalone AI processing API.
 * The heavy neural network logic has been moved to a separate VPS to 
 * improve Lambda performance and reduce costs.
 */

export interface AnalysisResult {
  title: string;
  score: number;
  isValid: boolean;
  noveltyScore: number;
  keywords: string[];
  similarPapers: { title: string; year: string }[];
  issues: string[];
  suggestions: string[];
  formFields?: any;
}

export interface ExtractedData {
  title: string;
  duration: number;
  cooperating_agencies: number;
  total: number;
  mooe: number;
  ps: number;
  co: number;
}

const AI_API_URL = process.env.AI_API_URL || "http://localhost:5001";

/**
 * Run AI analysis by sending a FILE to the standalone VPS API.
 * The VPS will handle text extraction (mammoth/pdf-parse) and neural analysis.
 */
export async function analyzeProposalFile(buffer: Buffer, contentType: string, filename: string): Promise<AnalysisResult> {
  const ANALYZE_ENDPOINT = `${AI_API_URL}/analyze`;
  console.log(`[AI-Client] Forwarding file to AI API: ${filename} (${contentType})`);

  try {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for the built-in Fetch API/Blob compatibility
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
    
    console.log(`[AI-Client] Appending "file" field: ${filename}, ${contentType}, size: ${buffer.length}`);
    formData.append("file", blob, filename);

    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI-Client] VPS Error (${response.status}):`, errorText);
      throw new Error(`AI VPS Error: ${response.status}`);
    }

    return (await response.json()) as AnalysisResult;
  } catch (err: any) {
    console.error("[AI-Client] Connection to AI VPS failed:", err.message);
    throw err;
  }
}

/**
 * Run the AI analysis by sending JSON metadata to the standalone VPS API.
 */
export async function analyzeProposal(extracted: ExtractedData): Promise<AnalysisResult> {
  const ANALYZE_ENDPOINT = `${AI_API_URL}/analyze`;

  try {
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extracted),
    });

    if (!response.ok) throw new Error(`AI API Error: ${response.status}`);
    return await response.json() as AnalysisResult;
  } catch (err: any) {
    console.error("[AI-Client] Failed to reach AI API, using fallback:", err.message);
    return {
      title: extracted.title || "Uploaded Proposal",
      score: 70,
      isValid: true,
      noveltyScore: 100,
      keywords: ["Safe Mode"],
      similarPapers: [],
      issues: ["AI engine unreachable."],
      suggestions: ["Check VPS status."],
    };
  }
}
