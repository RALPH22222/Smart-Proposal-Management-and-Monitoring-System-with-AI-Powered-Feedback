const PH_TIMEZONE = "Asia/Manila";

/**
 * Format a date string/Date to PH timezone — date only.
 * e.g., "Mar 18, 2026"
 */
export function formatDate(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: PH_TIMEZONE,
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format a date string/Date to PH timezone — date + time.
 * e.g., "Mar 18, 2026, 6:30 PM"
 */
export function formatDateTime(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: PH_TIMEZONE,
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format a date string to MM/DD/YYYY in PH timezone.
 */
export function formatDateShort(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: PH_TIMEZONE,
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format a date string to time only in PH timezone.
 * e.g., "6:30 PM"
 */
export function formatTime(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: PH_TIMEZONE,
    }).format(date);
  } catch {
    return String(dateStr);
  }
}
