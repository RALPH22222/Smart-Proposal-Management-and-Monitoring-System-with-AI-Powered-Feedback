import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { analyzeProposalFile } from "../../services/ai-analyzer.service";
import * as multipart from "lambda-multipart-parser";

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/**
 * Lambda handler: POST /proposal/analyze
 *
 * This handler now acts as a secure proxy. It receives a multipart file upload,
 * verifies auth, and forwards the file to the standalone AI VPS API for 
 * parsing and analysis.
 */
export const handler = buildCorsHeaders(async (event) => {
  // 1. Verify authentication
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  // 2. Parse multipart form data
  const payload = await multipart.parse(event);
  const file = payload.files?.[0];

  if (!file || !file.content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No file uploaded." }),
    };
  }

  // 3. Validate content type
  const contentType = file.contentType || "";
  if (!SUPPORTED_TYPES.includes(contentType as (typeof SUPPORTED_TYPES)[number])) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Unsupported format. Please upload PDF or DOCX. Received: ${contentType}`,
      }),
    };
  }

  // 4. Forward to Standalone AI API
  try {
    const result = await analyzeProposalFile(file.content, contentType, file.filename);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error("AI Analysis forward failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "AI Analysis temporary unavailable.",
        error: err.message 
      }),
    };
  }
});
