// Lightweight CSV exporter. No library — just Blob + URL.createObjectURL.
// Used wherever a table view exposes an "Export CSV" button.

import type { Project } from "../types/InterfaceProject";

export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => unknown;
};

// ─── Shared column sets ─────────────────────────────────────────────
// Keep monitoring CSV consistent between R&D and Admin views so exports are comparable.
// Every cell reflects a real system value — no client-side computed guesswork.

const formatDate = (d: string | null | undefined): string => {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
};

const formatCurrency = (n: number | null | undefined): string => {
  if (n == null) return "";
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const FUNDED_PROJECT_CSV_COLUMNS: CsvColumn<Project>[] = [
  { header: "Project ID", accessor: (p) => p.projectId },
  { header: "Title", accessor: (p) => p.title },
  { header: "Principal Investigator", accessor: (p) => p.principalInvestigator },
  {
    header: "Co-Leads",
    accessor: (p) =>
      (p.coLeads ?? [])
        .map((c) => [c.firstName, c.lastName].filter(Boolean).join(" "))
        .filter(Boolean)
        .join("; "),
  },
  { header: "Department", accessor: (p) => p.department },
  { header: "Planned Start", accessor: (p) => formatDate(p.startDate) },
  { header: "Planned End", accessor: (p) => formatDate(p.endDate) },
  { header: "Funded Date", accessor: (p) => formatDate(p.fundedDate) },
  { header: "Status", accessor: (p) => p.status },
  // Renamed from "Completion %" — that label was misleading. This is the proponent's
  // self-reported progress on their most recent report, not a verified completion figure.
  { header: "Last Reported Progress %", accessor: (p) => p.completionPercentage },
  {
    header: "Verified Quarters (n/4)",
    accessor: (p) => `${p.verifiedReportsCount ?? 0}/4`,
  },
  {
    header: "Terminal Verified",
    accessor: (p) => (p.terminalReportVerified ? "Yes" : "No"),
  },
  { header: "Total Budget (PHP)", accessor: (p) => formatCurrency(p.totalBudget) },
  { header: "Approved (PHP)", accessor: (p) => formatCurrency(p.approvedAmount) },
  { header: "Utilized (PHP)", accessor: (p) => formatCurrency(p.utilizedAmount) },
  { header: "Remaining (PHP)", accessor: (p) => formatCurrency(p.remainingAmount) },
  { header: "Reports Submitted", accessor: (p) => p.reportsSubmittedCount ?? 0 },
  { header: "Overdue Reports", accessor: (p) => p.overdueReportsCount ?? 0 },
  { header: "Pending Fund Requests", accessor: (p) => p.pendingFundRequestsCount ?? 0 },
  { header: "Pending Extensions", accessor: (p) => p.pendingExtensionsCount ?? 0 },
  { header: "Last Activity", accessor: (p) => formatDate(p.lastActivityAt) },
];

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) s = value.toISOString();
  else if (typeof value === "string") s = value;
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  // Quote cells containing comma, quote, newline, or carriage return.
  // Inner quotes are doubled per RFC 4180.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Triggers a browser download of `rows` serialized to CSV.
 *
 * @param filename base name (no extension). A timestamp + `.csv` is appended.
 * @param rows ordered dataset — this is what the user currently sees, so any
 *   caller-side filtering / sorting carries through to the export.
 * @param columns ordered list of {header, accessor(row)} — defines both the
 *   CSV header row and how each cell is extracted from a row.
 */
export function exportToCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  if (rows.length === 0 || columns.length === 0) return;

  const lines: string[] = [];
  lines.push(columns.map((c) => escapeCsvCell(c.header)).join(","));
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(c.accessor(row))).join(","));
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `${filename}_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
