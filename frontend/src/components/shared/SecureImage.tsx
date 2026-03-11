import { useState, useEffect } from "react";
import { getSignedFileUrl } from "../../utils/signed-url";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallbackSrc?: string;
}

/**
 * Displays an image from a private S3 bucket using presigned URLs.
 * Falls back to fallbackSrc (e.g. ui-avatars) while loading or on error.
 */
export default function SecureImage({ src, fallbackSrc, alt, ...props }: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    if (!src) {
      setSignedUrl(fallbackSrc || "");
      return;
    }

    // Non-S3 URLs (ui-avatars, etc.) — use directly
    if (!src.includes(".s3.amazonaws.com") && !src.includes(".s3.")) {
      setSignedUrl(src);
      return;
    }

    let cancelled = false;
    getSignedFileUrl(src).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [src, fallbackSrc]);

  const displayUrl = error ? (fallbackSrc || "") : signedUrl;

  if (!displayUrl) return null;

  return (
    <img
      {...props}
      src={displayUrl}
      alt={alt}
      onError={() => setError(true)}
    />
  );
}
