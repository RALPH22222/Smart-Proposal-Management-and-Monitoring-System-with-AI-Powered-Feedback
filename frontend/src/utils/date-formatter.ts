const PH_TIMEZONE = "Asia/Manila";

/**
 * Some Postgres columns on this project were created as `TIMESTAMP` (no time
 * zone) instead of `TIMESTAMPTZ`. Values written to them via JS
 * `new Date().toISOString()` arrive as `"2026-04-13T01:55:25.583Z"` but lose
 * their `Z` on insert, and Supabase hands them back as `"2026-04-13T01:55:25.583"`.
 * Per the ECMAScript spec, a date-time string without a TZ designator is
 * interpreted as LOCAL time by `new Date()` — which on a PH browser shifts the
 * time by +8 hours vs. the true moment. We normalize here: if the string looks
 * like an ISO date-time with no TZ offset, we append `Z` so it parses as UTC,
 * matching what the server originally meant to store.
 */
function parseDate(input: string | Date | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return input;
  if (typeof input !== "string") return new Date(input);
  const hasTzDesignator = /Z$|[+-]\d{2}:?\d{2}$/.test(input);
  const looksLikeIsoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(input);
  const normalized = !hasTzDesignator && looksLikeIsoDateTime ? input + "Z" : input;
  return new Date(normalized);
}

/**
 * Format a date string/Date to PH timezone — date only.
 * e.g., "Mar 18, 2026"
 */
export function formatDate(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "N/A";
  try {
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return String(dateStr);
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
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return String(dateStr);
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
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return String(dateStr);
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
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return String(dateStr);
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
