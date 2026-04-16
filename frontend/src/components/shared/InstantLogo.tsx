import { useEffect, useState } from "react";

interface InstantLogoProps {
  remoteSrc?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

/**
 * Renders a local fallback instantly, then silently swaps to the remote image
 * after it has fully loaded (no broken-image flash/flicker).
 */
export default function InstantLogo({
  remoteSrc,
  fallbackSrc,
  alt,
  className = "",
}: InstantLogoProps) {
  const [displaySrc, setDisplaySrc] = useState<string>(fallbackSrc);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setDisplaySrc(fallbackSrc);
    setIsVisible(true);

    if (!remoteSrc || remoteSrc === fallbackSrc) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setIsVisible(false);
      // Small frame delay gives opacity transition a smoother swap.
      requestAnimationFrame(() => {
        if (cancelled) return;
        setDisplaySrc(remoteSrc);
        setIsVisible(true);
      });
    };
    img.onerror = () => {
      // Keep local fallback silently.
    };
    img.src = remoteSrc;

    return () => {
      cancelled = true;
    };
  }, [remoteSrc, fallbackSrc]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
      draggable={false}
    />
  );
}
