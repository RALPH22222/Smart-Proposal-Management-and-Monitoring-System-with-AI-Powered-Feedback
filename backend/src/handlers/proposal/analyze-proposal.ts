import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { analyzeProposal, type ExtractedData } from "../../services/ai-analyzer.service";
import multipart from "lambda-multipart-parser";
import mammoth from "mammoth";

// pdf-parse v1 eagerly reads a test PDF in its index.js which breaks in Lambda.
// Import the inner module directly to bypass that behaviour.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require("pdf-parse/lib/pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const officeParser = require("officeparser");

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/**
 * Extract plain text from a document buffer based on its MIME type.
 */
async function extractTextFromFile(buffer: Buffer, contentType: string): Promise<string> {
  switch (contentType) {
    case "application/pdf": {
      const pdfData = await pdf(buffer);
      return pdfData.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "application/msword": {
      const text = await officeParser.parseOfficeAsync(buffer);
      return typeof text === "string" ? text : String(text);
    }
    default:
      throw new Error(`Unsupported file format: ${contentType}`);
  }
}

/**
 * Lambda handler: POST /proposal/analyze
 *
 * Accepts multipart/form-data with a document file (PDF, DOC, or DOCX),
 * extracts text, parses proposal metadata using regex (same patterns as scan_pdf.py),
 * runs pure-TypeScript AI inference, and returns analysis results.
 */
export const handler = buildCorsHeaders(async (event) => {
  // Verify authentication
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  // Parse multipart form data
  const payload = await multipart.parse(event);
  const file = payload.files?.[0];

  if (!file || !file.content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No file uploaded. Please attach a PDF, DOC, or DOCX file." }),
    };
  }

  // Validate content type
  const contentType = file.contentType || "";
  if (!SUPPORTED_TYPES.includes(contentType as (typeof SUPPORTED_TYPES)[number])) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Unsupported file format. Please upload a PDF, DOC, or DOCX file. Received: ${contentType}`,
      }),
    };
  }

  // Extract text from document
  let text: string;
  try {
    text = await extractTextFromFile(file.content, contentType);
  } catch (err) {
    console.error("Document parse error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Failed to read the uploaded file. Please ensure it is a valid PDF, DOC, or DOCX." }),
    };
  }

  if (!text || text.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Could not extract text from the file. It may be empty or image-based." }),
    };
  }

  // Extract proposal data from text (replicates scan_pdf.py regex patterns)
  const extracted = extractDataFromText(text);

  // Run AI analysis
  const result = analyzeProposal(extracted);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
});

/**
 * Extract proposal metadata from raw PDF text.
 * Replicates the regex patterns from trained-ai/scan_pdf.py.
 */
function extractDataFromText(text: string): ExtractedData {
  const data: ExtractedData = {
    title: "Unknown Project",
    duration: 12,
    cooperating_agencies: 0,
    total: 0,
    mooe: 0,
    ps: 0,
    co: 0,
  };

  // 1. Extract Title: "Project Title: ..." (allow multiple spaces between words)
  //    PDF extractors often insert extra spaces. Also handle multi-line titles
  //    by grabbing the next line if the first line ends without punctuation.
  const titleMatch = text.match(/Project\s+Title[:\s]*(.+)/i);
  if (titleMatch) {
    let title = titleMatch[1].trim();
    // Check if title continues on the next line (line ends mid-sentence)
    const matchEnd = (titleMatch.index ?? 0) + titleMatch[0].length;
    const restText = text.substring(matchEnd);
    const nextLineMatch = restText.match(/^\n([^\n]+)/);
    if (nextLineMatch) {
      const nextLine = nextLineMatch[1].trim();
      // Append next line if it doesn't look like a new field label
      if (nextLine && !/^(Leader|Agency|Address|Telephone|Fax|Email|Program)/i.test(nextLine)) {
        title = title + " " + nextLine;
      }
    }
    // Collapse multiple spaces into single space
    data.title = title.replace(/\s{2,}/g, " ").trim();
  }

  // 2. Extract Duration
  const monthLabelMatch = text.match(/\(In months\)\s*(\d+)/i);
  const durationLabelMatch = text.match(/Duration[:\s]+(\d+)/i);

  if (monthLabelMatch) {
    data.duration = parseInt(monthLabelMatch[1], 10);
  } else if (durationLabelMatch) {
    const val = parseInt(durationLabelMatch[1], 10);
    if (val < 120) {
      data.duration = val;
    }
  }

  // 3. Extract Cooperating Agencies
  const agencySection = text.match(/Cooperating Agencies.*?\n(.*?)(?=\n\(\d\)|$|Classification)/is);
  if (agencySection) {
    const rawAgencies = agencySection[1].trim();
    if (rawAgencies.length > 3 && !rawAgencies.includes("N/A")) {
      const count = (rawAgencies.match(/,/g) || []).length + 1;
      data.cooperating_agencies = count;
    }
  }

  // 4. Extract Budget
  const numbers = text.match(/([\d,]+\.\d{2})/g);
  if (numbers && numbers.length > 0) {
    const cleanNums: number[] = [];
    for (const n of numbers) {
      try {
        const val = parseFloat(n.replace(/,/g, ""));
        if (!isNaN(val)) cleanNums.push(val);
      } catch {
        // skip invalid numbers
      }
    }

    if (cleanNums.length > 0) {
      data.total = Math.max(...cleanNums);

      // Extract PS
      if (text.includes("PS")) {
        const psMatch = text.match(/PS.*?([\d,]+\.\d{2})/s);
        if (psMatch) {
          const val = parseFloat(psMatch[1].replace(/,/g, ""));
          if (val < data.total) data.ps = val;
        }
      }

      // Extract MOOE
      if (text.includes("MOOE")) {
        const mooeMatch = text.match(/MOOE.*?([\d,]+\.\d{2})/s);
        if (mooeMatch) {
          const val = parseFloat(mooeMatch[1].replace(/,/g, ""));
          if (val < data.total) data.mooe = val;
        }
      }

      // Calculate CO as remainder
      if (data.co === 0 && data.total > 0) {
        const remainder = data.total - (data.ps + data.mooe);
        if (remainder > 0) data.co = remainder;
      }
    }
  }

  return data;
}
