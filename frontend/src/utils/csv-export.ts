// Lightweight CSV exporter. No library — just Blob + URL.createObjectURL.
// Used wherever a table view exposes an "Export CSV" button.

export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => unknown;
};

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
