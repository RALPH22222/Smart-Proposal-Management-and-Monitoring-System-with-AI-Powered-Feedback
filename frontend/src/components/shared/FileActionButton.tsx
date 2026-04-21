import React from "react";
import { Eye, Download, type LucideIcon } from "lucide-react";
import { openSignedUrl } from "../../utils/signed-url";

const BROWSER_NATIVE_EXTS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
]);
const OFFICE_EXTS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

function extractExtension(urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return "";
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

export type FileActionMode = "view" | "download";

export interface FileActionMeta {
  Icon: LucideIcon;
  label: string;
  title: string;
  mode: FileActionMode;
  isOffice: boolean;
  isViewable: boolean;
}

/**
 * Decide the right affordance for a given file URL:
 * - PDF / image → Eye icon, "View" label (browser renders inline)
 * - Office doc  → Download icon, "Download" label (browser can't preview)
 * - Unknown     → Download (fallback matches `openSignedUrl` behavior)
 *
 * The click action is the same in all cases (`openSignedUrl`) — only the
 * visual cue changes so the button doesn't lie about what will happen.
 */
export function getFileActionMeta(
  url: string | null | undefined,
): FileActionMeta {
  const ext = extractExtension(url);
  const isViewable = BROWSER_NATIVE_EXTS.has(ext);
  const isOffice = OFFICE_EXTS.has(ext);
  if (isViewable) {
    return { Icon: Eye, label: "View", title: "View", mode: "view", isOffice: false, isViewable: true };
  }
  return {
    Icon: Download,
    label: "Download",
    title: "Download",
    mode: "download",
    isOffice,
    isViewable: false,
  };
}

interface FileActionButtonProps {
  url: string | null | undefined;
  className?: string;
  iconClassName?: string;
  /** Force hide the label; only render the icon. */
  iconOnly?: boolean;
  /** Override the auto-picked label (e.g. "Download revised LIB document"). */
  label?: string;
  /** Override the tooltip title; defaults to the label. */
  title?: string;
  /** When the button sits inside a row whose parent also handles click. */
  stopPropagation?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

/**
 * Standard file-open button. Picks Eye+"View" for PDFs/images and
 * Download+"Download" for Office docs, then calls `openSignedUrl` on click.
 *
 * Caller owns the container styling via `className` — this keeps the button
 * visually consistent with whatever card/pill/inline style the page uses.
 */
export const FileActionButton: React.FC<FileActionButtonProps> = ({
  url,
  className = "",
  iconClassName = "w-3 h-3",
  iconOnly = false,
  label,
  title,
  stopPropagation = false,
  disabled = false,
  type = "button",
}) => {
  const meta = getFileActionMeta(url);
  const { Icon } = meta;
  const resolvedLabel = label ?? meta.label;
  const resolvedTitle = title ?? resolvedLabel;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    if (!url || disabled) return;
    openSignedUrl(url);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      title={resolvedTitle}
      disabled={disabled || !url}
      className={className}
    >
      <Icon className={iconClassName} />
      {!iconOnly && <span>{resolvedLabel}</span>}
    </button>
  );
};

export default FileActionButton;
