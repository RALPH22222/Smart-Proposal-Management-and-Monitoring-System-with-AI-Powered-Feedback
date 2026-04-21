// Strict WMSU LIB Template v1 parser.
//
// Contract: the import feature accepts ONLY the official WMSU LIB Template v1 Word file.
// Any other document is rejected with a message that directs the proponent to download the
// template (or enter items manually in the form). No heuristics, no fragmentation recovery,
// no confidence tiers — the template IS the schema.
//
// Expected header row (case-insensitive, trimmed):
//   Subcategory | Item Name | Spec / Volume | Qty | Unit | Unit Price | Amount
//
// Expected category header rows (exact match on first cell, all other cells empty due to
// columnSpan rendering to a 1-cell row in mammoth HTML):
//   I. PERSONNEL SERVICES
//   II. MAINTENANCE & OTHER OPERATING EXPENSES
//   III. CAPITAL OUTLAY

import mammoth from "mammoth";

export type ParseConfidence = "high" | "medium" | "low";
export type LibCategory = "ps" | "mooe" | "co";

export interface ParsedLibItem {
  category: LibCategory;
  subcategoryLabel: string | null;
  itemName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalAmount: number;
  confidence: ParseConfidence;
  warning: string | null;
  rawRow: string;
}

export interface ParseLibResult {
  // True when the document is not in WMSU LIB Template v1 format. Frontend shows a
  // rejection card with a template-download CTA instead of trying to render items.
  rejected: boolean;
  items: ParsedLibItem[];
  warnings: string[];
  detected: {
    categories: Record<LibCategory, boolean>;
    grandTotal: number | null;
    tableCount: number;
    yearColumnsDetected: boolean;
  };
}

const EXPECTED_HEADERS = [
  "subcategory",
  "item name",
  "spec / volume",
  "qty",
  "unit",
  "unit price",
  "amount",
];

const CATEGORY_LOOKUP: Record<string, LibCategory> = {
  "i. personnel services": "ps",
  "ii. maintenance & other operating expenses": "mooe",
  "iii. capital outlay": "co",
};

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,₱$\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x?[0-9a-f]+;/gi, "");
}

function stripTags(html: string): string {
  return html
    .replace(/<\/p>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "");
}

function extractTablesFromHtml(html: string): string[][][] {
  const tableRx = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  const rowRx = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRx = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;

  const tables: string[][][] = [];
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRx.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const rows: string[][] = [];

    rowRx.lastIndex = 0;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRx.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];

      cellRx.lastIndex = 0;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRx.exec(rowHtml)) !== null) {
        const text = decodeEntities(stripTags(cellMatch[1]))
          .replace(/\s+/g, " ")
          .trim();
        cells.push(text);
      }

      if (cells.some((c) => c.length > 0)) {
        rows.push(cells);
      }
    }

    if (rows.length > 0) {
      tables.push(rows);
    }
  }

  return tables;
}

function isTemplateHeader(cells: string[]): boolean {
  if (cells.length < EXPECTED_HEADERS.length) return false;
  return EXPECTED_HEADERS.every((expected, idx) => {
    const actual = (cells[idx] ?? "").toLowerCase().trim();
    return actual === expected;
  });
}

function detectCategoryHeader(cells: string[]): LibCategory | null {
  // Category header rows use columnSpan which renders as a single cell in mammoth HTML.
  // Match the first non-empty cell regardless of cell count, so we also accept the edge
  // case where Word renders the span as 1-cell row OR a row with trailing empties.
  const label = (cells[0] ?? "").toLowerCase().trim();
  return CATEGORY_LOOKUP[label] ?? null;
}

// Template also contains subtotal + grand-total rows for visual reference. These must be
// skipped by the parser — their label text (in the first non-empty cell) starts with one of:
//   "subtotal", "total", "grand total"
// Rows containing these labels are informational only, not line items.
const TOTAL_LABEL_RX = /^(grand\s*total|sub\s*total|subtotal|total)\b/i;
function isTotalRow(cells: string[]): boolean {
  for (const c of cells) {
    const trimmed = c.trim();
    if (!trimmed) continue;
    return TOTAL_LABEL_RX.test(trimmed);
  }
  return false;
}

function rejectionResult(message: string, tableCount: number): ParseLibResult {
  return {
    rejected: true,
    items: [],
    warnings: [message],
    detected: {
      categories: { ps: false, mooe: false, co: false },
      grandTotal: null,
      tableCount,
      yearColumnsDetected: false,
    },
  };
}

const REJECTION_MESSAGE =
  "Document is not in WMSU LIB Template v1 format. " +
  "Please download the template from the budget section and use it to populate your line items, " +
  "or enter items manually in the budget form.";

export async function parseLibDocument(buffer: Buffer): Promise<ParseLibResult> {
  const conversion = await mammoth.convertToHtml({ buffer });
  const html = conversion.value || "";
  const tables = extractTablesFromHtml(html);

  if (tables.length === 0) {
    return rejectionResult(REJECTION_MESSAGE, 0);
  }

  // Template has exactly one data table. Locate the first table whose header row matches the
  // WMSU v1 signature — any other tables (e.g. if someone added a summary table before/after)
  // are ignored rather than treated as the budget.
  const table = tables.find((t) => t.length > 0 && isTemplateHeader(t[0]));
  if (!table) {
    return rejectionResult(REJECTION_MESSAGE, tables.length);
  }

  const items: ParsedLibItem[] = [];
  const warnings: string[] = [];
  const detected = {
    categories: { ps: false, mooe: false, co: false } as Record<LibCategory, boolean>,
    grandTotal: null as number | null,
    tableCount: tables.length,
    yearColumnsDetected: false,
  };

  let currentCategory: LibCategory | null = null;

  // Walk rows after the header.
  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    if (cells.length === 0) continue;

    const categoryFromHeader = detectCategoryHeader(cells);
    if (categoryFromHeader) {
      currentCategory = categoryFromHeader;
      detected.categories[categoryFromHeader] = true;
      continue;
    }

    if (isTotalRow(cells)) {
      // Capture the grand total for the detected summary so the frontend can display
      // "Grand total in source: ₱X" if helpful. Use the rightmost numeric cell.
      for (let c = cells.length - 1; c >= 0; c--) {
        const n = parseNumber(cells[c]);
        if (n != null && n > 0) {
          if (detected.grandTotal == null || n > detected.grandTotal) detected.grandTotal = n;
          break;
        }
      }
      continue;
    }

    // Data rows must have all 7 columns. Shorter rows are decorative (blank spacer,
    // signatures, etc.) and should be skipped rather than treated as items.
    if (cells.length < EXPECTED_HEADERS.length) continue;

    const subcategory = cells[0].trim();
    const itemName = cells[1].trim();
    const spec = cells[2].trim();
    const qtyRaw = cells[3].trim();
    const unit = cells[4].trim();
    const unitPriceRaw = cells[5].trim();
    const amountRaw = cells[6].trim();

    // Empty placeholder row in the blank template — skip silently.
    if (!itemName && !qtyRaw && !unitPriceRaw && !amountRaw) continue;

    if (!currentCategory) {
      // Data row appearing before any category header — malformed doc.
      warnings.push(
        `Skipped item "${itemName || subcategory || "(unlabeled)"}" because it appears before a PS / MOOE / CO category header.`,
      );
      continue;
    }

    const quantity = parseNumber(qtyRaw);
    const unitPrice = parseNumber(unitPriceRaw);
    const amount = parseNumber(amountRaw);

    if (quantity == null || unitPrice == null) {
      warnings.push(
        `Row "${itemName || "(unnamed)"}" skipped — Qty and Unit Price must both be valid numbers.`,
      );
      continue;
    }

    // Compute the authoritative total from rounded unit price (same rule as manual entry)
    // so the row passes server-side Zod validation (qty * unitPrice === totalAmount within 0.01).
    const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
    const derivedTotal = Math.round(quantity * roundedUnitPrice * 100) / 100;

    let warning: string | null = null;
    if (amount != null && Math.abs(amount - derivedTotal) > 1) {
      warning = `Amount in document (₱${amount.toFixed(2)}) does not match Qty x Unit Price (₱${derivedTotal.toFixed(2)}). Using computed value.`;
    }

    items.push({
      category: currentCategory,
      subcategoryLabel: subcategory || null,
      itemName: itemName || "(unnamed)",
      spec: spec || null,
      quantity,
      unit: unit || null,
      unitPrice: roundedUnitPrice,
      totalAmount: derivedTotal,
      confidence: "high",
      warning,
      rawRow: cells.join(" | "),
    });
  }

  if (items.length === 0) {
    warnings.push(
      "The template is empty — fill in line items under PS / MOOE / CO before importing.",
    );
  }

  return { rejected: false, items, warnings, detected };
}
