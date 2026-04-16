// Phase 2 of LIB feature: POST /proposal/parse-lib
//
// Accepts a multipart-uploaded LIB .docx, runs lib-parser.service against it, and returns
// a preview JSON the frontend renders in an import modal. Does NOT persist anything — the
// proponent reviews/edits and only the form submission writes to the database.

import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { parseLibDocument } from "../../services/lib-parser.service";
import multipart from "lambda-multipart-parser";

const SUPPORTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const handler = buildCorsHeaders(async (event) => {
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  const payload = await multipart.parse(event);
  const file = payload.files?.[0];

  if (!file || !file.content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No file uploaded. Please attach a LIB .docx file." }),
    };
  }

  const contentType = file.contentType || "";
  if (!SUPPORTED_TYPES.includes(contentType as (typeof SUPPORTED_TYPES)[number])) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Unsupported file format. Please upload a Word .docx file. Received: ${contentType}`,
      }),
    };
  }

  // Reasonable safety cap — LIBs are tiny by AWS Lambda standards but we don't want to
  // accept arbitrarily large uploads via the API Gateway 10 MB limit either.
  if (file.content.length > 5 * 1024 * 1024) {
    return {
      statusCode: 413,
      body: JSON.stringify({ message: "File is too large. Maximum LIB document size is 5 MB." }),
    };
  }

  try {
    const result = await parseLibDocument(file.content);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("parse-lib error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to parse the LIB document. It may be corrupted or use an unsupported format.",
      }),
    };
  }
});
