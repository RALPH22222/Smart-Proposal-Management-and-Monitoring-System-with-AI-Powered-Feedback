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
 * Open a signed URL in a new tab. Use for file download links.
 */
export async function openSignedUrl(s3Url: string): Promise<void> {
  const url = await getSignedFileUrl(s3Url);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open a proposal document for in-browser viewing in a new tab.
 * - PDF: opens the presigned URL directly (browsers render inline).
 * - DOC/DOCX: routes through Microsoft Office Online viewer so the user
 *   can preview without downloading. The presigned URL is sent to
 *   view.officeapps.live.com, which fetches and renders it.
 * Falls back to a direct open for unknown extensions.
 */
export async function openProposalFile(s3Url: string | null | undefined): Promise<void> {
  if (!s3Url) {
    alert("No file uploaded for this proposal.");
    return;
  }

  const ext = (() => {
    try {
      const path = decodeURIComponent(new URL(s3Url).pathname);
      const match = path.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
      return match ? match[1].toLowerCase() : "";
    } catch {
      const match = s3Url.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
      return match ? match[1].toLowerCase() : "";
    }
  })();

  const presigned = await getSignedFileUrl(s3Url);

  if (ext === "doc" || ext === "docx") {
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(presigned)}`;
    window.open(viewerUrl, "_blank", "noopener,noreferrer");
    return;
  }

  window.open(presigned, "_blank", "noopener,noreferrer");
}
