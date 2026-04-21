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

// File types the browser can render natively inline. Everything else (Office
// docs, zips, archives, etc.) gets force-downloaded instead of opened inline —
// which avoids the unreliable `view.officeapps.live.com` round-trip and its
// intermittent "network error" failures.
const BROWSER_NATIVE_EXTS = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]);
const OFFICE_EXTS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

export function isOfficeExtension(ext: string): boolean {
  return OFFICE_EXTS.has(ext.toLowerCase());
}

/**
 * Trigger a browser download of the given URL. Works for both S3-signed and
 * any-other URLs. Uses a temporary anchor with the `download` attribute so
 * the browser writes to disk instead of trying to render inline.
 */
function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface OpenSignedUrlOptions {
  /**
   * When true, Office docs are routed through the Microsoft Office Online
   * Viewer instead of being downloaded. Historical behavior — kept as an
   * opt-in because the viewer fails unpredictably (URL length, MS-side IP
   * rate limits, transient "network error"). Leave unset for the reliable
   * download-to-disk path.
   */
  preview?: boolean;
}

/**
 * Open a file the user clicked on, using the most reliable path per file type.
 *
 * - **PDF and images** (`.pdf` / `.png` / `.jpg` / `.jpeg` / `.gif` / `.webp` /
 *   `.svg` / `.bmp`) → opens the presigned URL in a new tab. Browsers render
 *   these natively; nothing to do on our end.
 * - **Office documents** (`.doc` / `.docx` / `.xls` / `.xlsx` / `.ppt` /
 *   `.pptx`) → downloads to the user's machine so they open it in their
 *   desktop app. Previous behavior wrapped with `view.officeapps.live.com`
 *   but that service frequently fails from Microsoft's side and surfaces a
 *   generic "network error" to the user. Pass `{ preview: true }` to restore
 *   the old viewer path when the caller really wants in-browser preview.
 * - **Anything else** → opens in a new tab and lets the browser decide
 *   (usually downloads).
 *
 * Callers don't need to branch by type — every "view this file" button just
 * calls this function. Used for proposal uploads, report proofs, MOA, agency
 * certification, liquidation receipts, etc.
 */
export async function openSignedUrl(
  s3Url: string | null | undefined,
  options: OpenSignedUrlOptions = {},
): Promise<void> {
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

  // Office docs: opt-in to MS viewer (flaky), otherwise reliable download.
  if (OFFICE_EXTS.has(ext)) {
    if (options.preview) {
      const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(presigned)}`;
      window.open(viewerUrl, "_blank", "noopener,noreferrer");
      return;
    }
    triggerDownload(presigned, getFileName(s3Url));
    return;
  }

  // PDF + images render inline; anything else we don't recognize also opens
  // in a new tab so the browser can do its default thing.
  if (BROWSER_NATIVE_EXTS.has(ext) || ext === "") {
    window.open(presigned, "_blank", "noopener,noreferrer");
    return;
  }

  // Unrecognized non-Office extension → download to be safe. Opening archives
  // and the like in a tab shows a raw XML / binary preview in most browsers.
  triggerDownload(presigned, getFileName(s3Url));
}

/**
 * Force a download of the given S3 file regardless of type. Use this when the
 * UI explicitly exposes a "Download" button alongside (or instead of) an
 * in-browser preview — e.g. a PDF that the user wants to annotate offline.
 *
 * For Office docs `openSignedUrl` already downloads, so a separate Download
 * button is redundant there; this helper exists so the Download control can
 * be rendered consistently without branching on extension at every call site.
 */
export async function downloadSignedUrl(s3Url: string | null | undefined): Promise<void> {
  if (!s3Url) return;

  const presigned = await getSignedFileUrl(s3Url);

  const isS3 = s3Url.includes(".s3.amazonaws.com") || s3Url.includes(".s3.");
  const signedOk = presigned !== s3Url && presigned.includes("X-Amz-Signature=");
  if (isS3 && !signedOk) {
    alert("This file is no longer available. It may have been moved or deleted — please re-upload or contact the administrator.");
    return;
  }

  triggerDownload(presigned, getFileName(s3Url));
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
