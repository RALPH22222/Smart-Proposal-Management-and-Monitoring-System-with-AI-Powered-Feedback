import { api } from "./axios";

const SIGNED_URL_CACHE_TTL = 55 * 60 * 1000; // 55 minutes (URLs valid for 60)
const signedUrlCache: Record<string, { url: string; timestamp: number }> = {};

/**
 * Convert an S3 URL to a presigned URL via the backend.
 * Caches results for 55 minutes to minimize API calls.
 * Returns the original URL if it's not an S3 URL.
 */
export async function getSignedFileUrl(s3Url: string): Promise<string> {
  if (!s3Url) return s3Url;

  // Not an S3 URL — return as-is (e.g. ui-avatars.com fallback)
  if (!s3Url.includes(".s3.amazonaws.com") && !s3Url.includes(".s3.")) return s3Url;

  const cached = signedUrlCache[s3Url];
  if (cached && Date.now() - cached.timestamp < SIGNED_URL_CACHE_TTL) {
    return cached.url;
  }

  try {
    const url = new URL(s3Url);
    const key = decodeURIComponent(url.pathname.substring(1)); // remove leading / and decode %20 etc.
    const hostname = url.hostname;

    const bucket = hostname.includes("profile") ? "profiles" : "proposals";

    const { data } = await api.get<{ url: string }>("/files/signed-url", {
      params: { key, bucket },
      withCredentials: true,
    });

    signedUrlCache[s3Url] = { url: data.url, timestamp: Date.now() };
    return data.url;
  } catch (err) {
    console.error("Failed to get signed URL:", err);
    return s3Url; // fallback to original URL (will fail but won't break UI)
  }
}

/**
 * Extract a human-readable filename from an S3 URL or path.
 * Returns a sensible fallback if the input is empty or unparseable.
 */
export function getFileName(url: string | null | undefined): string {
  if (!url) return "Document.pdf";
  try {
    const decoded = decodeURIComponent(url);
    const withoutQuery = decoded.split("?")[0];
    const parts = withoutQuery.split(/[/\\]/);
    return parts[parts.length - 1] || "Document.pdf";
  } catch {
    return "Document.pdf";
  }
}

// Extract the file extension from an S3 URL (or plain path). Lowercase, empty if unknown.
function extractExtension(urlOrPath: string): string {
  const source = (() => {
    try {
      return decodeURIComponent(new URL(urlOrPath).pathname);
    } catch {
      return urlOrPath;
    }
  })();
  const match = source.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Open a file in a new tab, routing Office documents through the Microsoft Office
 * Online viewer so they preview in-browser instead of downloading.
 *
 * - `.pdf` and images → opens the presigned URL directly; browsers render inline.
 * - `.doc` / `.docx` / `.xls` / `.xlsx` / `.ppt` / `.pptx` → wrapped with
 *   `view.officeapps.live.com/op/view.aspx?src=...` so the user sees a preview.
 *   Requires the presigned URL to be publicly fetchable by Microsoft's servers;
 *   our S3 presigned URLs are time-limited but open during their TTL, which is
 *   exactly what the viewer needs.
 * - Anything else → direct open (browser decides download vs render).
 *
 * Callers don't need to branch by type — every "view this file" button just calls
 * this function. Used for proposal uploads, report proofs, MOA, agency certification,
 * liquidation receipts, and anywhere else S3-backed files are exposed in the UI.
 */
export async function openSignedUrl(s3Url: string | null | undefined): Promise<void> {
  if (!s3Url) return;

  const presigned = await getSignedFileUrl(s3Url);

  // If signing failed for an S3 URL, getSignedFileUrl returns the input unchanged.
  // Opening that raw URL shows S3's "AccessDenied" XML — warn the user instead.
  const isS3 = s3Url.includes(".s3.amazonaws.com") || s3Url.includes(".s3.");
  const signedOk = presigned !== s3Url && presigned.includes("X-Amz-Signature=");
  if (isS3 && !signedOk) {
    alert("This file is no longer available. It may have been moved or deleted — please re-upload or contact the administrator.");
    return;
  }

  const ext = extractExtension(s3Url);
  const officeExts = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
  if (officeExts.has(ext)) {
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(presigned)}`;
    window.open(viewerUrl, "_blank", "noopener,noreferrer");
    return;
  }

  window.open(presigned, "_blank", "noopener,noreferrer");
}

/**
 * @deprecated Use `openSignedUrl` instead — it now handles Office documents too.
 * Kept as a thin alias so existing imports don't break; safe to rip out in a follow-up.
 */
export async function openProposalFile(s3Url: string | null | undefined): Promise<void> {
  if (!s3Url) {
    alert("No file uploaded for this proposal.");
    return;
  }
  return openSignedUrl(s3Url);
}
