/**
 * Quarter / period helpers for project monitoring.
 *
 * Phase 2A multi-year model:
 *   - A project has ceil(duration_months / 3) total quarterly periods, up to 40
 *     (10 years × 4 quarters).
 *   - Each period is a (year_number, quarter) pair where quarter is the
 *     QuarterlyReport enum (q1_report..q4_report) and year_number is 1..10.
 *   - Global period_index = (year_number - 1) * 4 + quarter_index is used for
 *     sequence gates ("previous period must exist before next").
 *
 * Single-year-only helpers (`computeMaxQuarterCount`, `getApplicableQuarters`,
 * `isQuarterApplicable`) are kept as thin wrappers around the new API for
 * backwards compatibility during the migration window. They assume
 * `year_number = 1`. Remove them once every caller has been migrated.
 */

import { QuarterlyReport } from "../types/project";

export const ALL_QUARTERS: QuarterlyReport[] = [
  QuarterlyReport.Q1,
  QuarterlyReport.Q2,
  QuarterlyReport.Q3,
  QuarterlyReport.Q4,
];

// Max project duration in months. 120 = 10 years (the Phase 2A envelope —
// Y1Q1..Y10Q4, 40 reporting periods). Used by the extension flow to reject
// requests that would push a project past this boundary.
export const MAX_PROJECT_DURATION_MONTHS = 120;

/** A single reporting period — year + quarter. `quarter` accepts either the
 *  enum value or a plain string literal (the DB/Zod side gives string literals). */
export type Period = { year_number: number; quarter: QuarterlyReport | string };

/** 1-based index of a quarter (q1_report → 1, q2_report → 2, …). */
export function quarterToIndex(quarter: QuarterlyReport | string): number {
  const idx = ALL_QUARTERS.indexOf(quarter as QuarterlyReport);
  return idx === -1 ? 0 : idx + 1;
}

/**
 * Total reporting periods this project has. ceil(duration/3), clamped 1..40.
 * A 6-month project returns 2 (Y1Q1, Y1Q2). A 24-month project returns 8.
 * A 42-month project returns 14.
 */
export function computeTotalPeriods(durationMonths: number | null | undefined): number {
  const months = Number(durationMonths);
  if (!Number.isFinite(months) || months <= 0) return 1;
  return Math.min(40, Math.max(1, Math.ceil(months / 3)));
}

/** Global 1-based period index across all years of the project. */
export function periodIndex(p: Period): number {
  const qIdx = quarterToIndex(p.quarter);
  if (qIdx === 0 || p.year_number < 1) return 0;
  return (p.year_number - 1) * 4 + qIdx;
}

/** Inverse of periodIndex — resolves an index back to (year, quarter). */
export function periodFromIndex(idx: number): Period {
  const clamped = Math.max(1, Math.floor(idx));
  const year = Math.floor((clamped - 1) / 4) + 1;
  const qIdx = ((clamped - 1) % 4) + 1;
  return { year_number: year, quarter: ALL_QUARTERS[qIdx - 1] };
}

/** All applicable periods for this duration, in submission order. */
export function getApplicablePeriods(durationMonths: number | null | undefined): Period[] {
  const total = computeTotalPeriods(durationMonths);
  return Array.from({ length: total }, (_, i) => periodFromIndex(i + 1));
}

/** Whether this (year, quarter) is inside the project's duration envelope. */
export function isPeriodApplicable(
  p: Period,
  durationMonths: number | null | undefined,
): boolean {
  const idx = periodIndex(p);
  if (idx === 0) return false;
  return idx <= computeTotalPeriods(durationMonths);
}

// ---------------------------------------------------------------------------
// Backwards-compat single-year helpers — assume year_number = 1.
// Keep until every caller has been migrated to the Period-based API.
// ---------------------------------------------------------------------------

/** DEPRECATED — use `computeTotalPeriods`. Returns 1..4 (clamped). */
export function computeMaxQuarterCount(durationMonths: number | null | undefined): number {
  return Math.min(4, computeTotalPeriods(durationMonths));
}

/** DEPRECATED — use `getApplicablePeriods`. Returns Y1's quarters only. */
export function getApplicableQuarters(
  durationMonths: number | null | undefined,
): QuarterlyReport[] {
  return ALL_QUARTERS.slice(0, computeMaxQuarterCount(durationMonths));
}

/** DEPRECATED — use `isPeriodApplicable`. Assumes year_number = 1. */
export function isQuarterApplicable(
  quarter: QuarterlyReport | string,
  durationMonths: number | null | undefined,
): boolean {
  return isPeriodApplicable(
    { year_number: 1, quarter: quarter as QuarterlyReport },
    durationMonths,
  );
}

/**
 * Month-count between two ISO date strings, counted as full calendar-month
 * boundaries crossed. If the end-day is earlier in the month than the start-day,
 * the partial month is dropped. Used by the extension flow to recompute
 * `proposals.duration` when `plan_end_date` shifts.
 *
 *   2026-01-01 → 2026-07-01  =  6
 *   2026-01-15 → 2026-07-10  =  5 (July 10 < Jan 15)
 *   2026-01-15 → 2026-07-20  =  6
 */
export function monthsBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(1, months);
}
