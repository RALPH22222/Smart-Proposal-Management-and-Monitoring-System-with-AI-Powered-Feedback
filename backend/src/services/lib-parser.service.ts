// Phase 2 of LIB feature: parse a Line-Item Budget .docx into structured rows the
// proponent submission form can pre-fill. Returns a "preview" payload — never persisted
// directly. The frontend renders it in an import preview modal so the proponent can fix
// ambiguous rows before committing.
//
// Strategy:
//   1. mammoth.convertToHtml — preserves table structure (extractRawText loses cells)
//   2. Walk each <table><tr><td> via regex (no extra deps)
//   3. Classify rows: header / category / subcategory / item / total
//   4. For item rows, extract trailing "-N Unit" pattern + parenthesized spec
//   5. Compute unit price from the rightmost numeric cell; recompute total from
//      qty * unitPrice so imported rows pass server-side Zod validation (which
//      requires totalAmount === quantity * unitPrice within 0.01 tolerance)

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
  items: ParsedLibItem[];
  warnings: string[];
  detected: {
    categories: Record<LibCategory, boolean>;
    grandTotal: number | null;
    tableCount: number;
    // Phase 2B: true when at least one table had "Year 1 / Year 2 / …" columns.
    // The amounts are summed into flat items (Phase 2B design — see docs/PHASE_2A_MULTI_YEAR.md
    // non-goals and the 2026-04-20 codex consult). The frontend should surface a note
    // so the proponent understands their per-year template was flattened at import.
    yearColumnsDetected: boolean;
  };
}

// Roman-numeral-prefixed category headings AND fallback keyword matches for "PERSONNEL
// SERVICES", "MAINTENANCE & OTHER OPERATING EXPENSES", "EQUIPMENT OUTLAY" / "CAPITAL OUTLAY".
const CATEGORY_RX = {
  ps: /^\s*i\s*\.\s*personnel|personnel\s+services|^\s*total\s+for\s+ps$/i,
  mooe: /^\s*ii\s*\.\s*maintenance|maintenance\s*(?:&|and)?\s*other\s*operating|\bmooe\b/i,
  co: /^\s*iii\s*\.\s*equipment|equipment\s+outlay|capital\s+outlay/i,
};

const TOTAL_RX = /^(total\b|grand\s+total|sub\s*total)/i;
const HEADER_RX = /^(items?|year\s*\d|total|status|description|particulars)$/i;

// Trailing "-N <Unit>" or "- N <Unit>s" pattern. Allows asterisk markers (revised LIB uses
// * / ** / *** to flag pre-bid / delivery / fabrication notes).
const ITEM_TAIL_RX = /\s*[-–—]\s*(\d+(?:\.\d+)?)\s+([A-Za-z][A-Za-z\s/]*?)[*\s]*$/;

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[*]+/g, "")
    .replace(/[,₱$\s]/g, "")
    .trim();
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

function detectCategoryFromText(text: string): LibCategory | null {
  if (CATEGORY_RX.ps.test(text)) return "ps";
  if (CATEGORY_RX.mooe.test(text)) return "mooe";
  if (CATEGORY_RX.co.test(text)) return "co";
  return null;
}

function rightmostPositiveNumber(cells: string[]): number | null {
  for (let i = cells.length - 1; i >= 0; i--) {
    const n = parseNumber(cells[i]);
    if (n != null && n > 0) return n;
  }
  return null;
}

/**
 * Inspect a table's header row to identify Year N columns (Y1, Year 1, Year 2, …)
 * and a Total column. Returns indexes so per-row extraction can sum the Year columns
 * when no explicit Total column exists.
 *
 *   | Item | Qty | Unit | Year 1 | Year 2 | Total |   → totalIdx=5, yearIdx=[3,4]
 *   | Item | Qty | Unit | Year 1 | Year 2 |           → totalIdx=null, yearIdx=[3,4]  (sum)
 *   | Item | Qty | Unit | Amount |                    → totalIdx=3, yearIdx=[]       (today's path)
 */
function analyzeHeader(cells: string[]): {
  yearColIndexes: number[];
  totalColIndex: number | null;
} {
  const yearColIndexes: number[] = [];
  let totalColIndex: number | null = null;
  const yearRx = /^\s*(?:year\s*\d+|y\s*\d+|yr\s*\d+)\s*$/i;
  const totalRx = /^\s*(?:total|grand\s*total|amount)\s*$/i;

  cells.forEach((cell, idx) => {
    const trimmed = cell.trim();
    if (yearRx.test(trimmed)) yearColIndexes.push(idx);
    else if (totalColIndex === null && totalRx.test(trimmed)) totalColIndex = idx;
  });

  return { yearColIndexes, totalColIndex };
}

function isHeaderRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const trimmed = cells.map((c) => c.trim().toLowerCase());
  // Classic LIB headers — every non-empty cell looks like a column label
  const allHeaderish = trimmed.every((c) => c === "" || HEADER_RX.test(c));
  if (allHeaderish && trimmed.some((c) => c !== "")) return true;
  return false;
}

function isTotalRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  return TOTAL_RX.test(cells[0].trim());
}

interface ParsedDescription {
  itemName: string;
  spec: string | null;
  quantity: number | null;
  unit: string | null;
}

function parseItemDescription(desc: string): ParsedDescription {
  // Drop trailing asterisks (revised LIB markers like "*", "**", "***")
  let cleaned = desc.replace(/[*]+\s*$/, "").trim();

  // Try to extract the trailing "-N Unit" pattern
  let quantity: number | null = null;
  let unit: string | null = null;
  const tail = cleaned.match(ITEM_TAIL_RX);
  if (tail) {
    quantity = parseFloat(tail[1]);
    unit = tail[2].trim();
    cleaned = cleaned.slice(0, tail.index).trim();
  }

  // Extract parenthesized spec — only if the parens are at the END of the remaining string,
  // since parens in the middle of a name (e.g. "Atmega328") aren't necessarily a spec.
  let spec: string | null = null;
  const parenMatch = cleaned.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  let itemName = cleaned;
  if (parenMatch) {
    itemName = parenMatch[1].trim();
    spec = parenMatch[2].trim();
  }

  itemName = itemName.replace(/[*]+\s*$/, "").trim();
  if (!itemName) itemName = cleaned;

  return { itemName, spec, quantity, unit };
}

export async function parseLibDocument(buffer: Buffer): Promise<ParseLibResult> {
  const conversion = await mammoth.convertToHtml({ buffer });
  const html = conversion.value || "";
  const tables = extractTablesFromHtml(html);

  const items: ParsedLibItem[] = [];
  const warnings: string[] = [];
  const detected = {
    categories: { ps: false, mooe: false, co: false } as Record<LibCategory, boolean>,
    grandTotal: null as number | null,
    tableCount: tables.length,
    yearColumnsDetected: false,
  };

  let currentCategory: LibCategory | null = null;
  let currentSubcategory: string | null = null;

  for (const table of tables) {
    // Scan the first few rows of this table for header columns. Year / Total column
    // positions may differ per table (AMBIENCE uses a single table; some LIBs split
    // PS/MOOE/CO into separate tables with their own headers). Scoped per table.
    let yearColIndexes: number[] = [];
    let totalColIndex: number | null = null;
    for (const cells of table.slice(0, 4)) {
      if (isHeaderRow(cells)) {
        const analyzed = analyzeHeader(cells);
        if (analyzed.yearColIndexes.length > 0 || analyzed.totalColIndex !== null) {
          yearColIndexes = analyzed.yearColIndexes;
          totalColIndex = analyzed.totalColIndex;
          if (analyzed.yearColIndexes.length > 0) detected.yearColumnsDetected = true;
          break;
        }
      }
    }

    for (const cells of table) {
      if (cells.length === 0) continue;
      const firstCell = cells[0].trim();
      if (!firstCell) continue;

      if (isHeaderRow(cells)) continue;

      const detectedCategory = detectCategoryFromText(firstCell);
      // A category header has the keyword AND no item-tail pattern (so we don't catch a real
      // item that mentions "personnel" in its name).
      if (detectedCategory && !ITEM_TAIL_RX.test(firstCell)) {
        currentCategory = detectedCategory;
        detected.categories[detectedCategory] = true;
        currentSubcategory = null;
        continue;
      }

      if (isTotalRow(cells)) {
        const lower = firstCell.toLowerCase();
        if (lower.includes("grand total") || lower.includes("subtotal")) {
          const grand = rightmostPositiveNumber(cells);
          if (grand != null && (detected.grandTotal == null || grand > detected.grandTotal)) {
            detected.grandTotal = grand;
          }
        }
        continue;
      }

      // Skip rows that appear before any category header (signatures, prep notes, etc.)
      if (!currentCategory) continue;

      const looksLikeItem = ITEM_TAIL_RX.test(firstCell);

      // Per-item total extraction priority (Phase 2B):
      //   1. Explicit "Total" / "Amount" column from the header analysis
      //   2. Sum of "Year 1 / Year 2 / …" columns (multi-year LIB → flat)
      //   3. Rightmost positive number (today's fallback for headerless tables)
      let sourceTotal: number | null = null;
      if (totalColIndex !== null && totalColIndex < cells.length) {
        sourceTotal = parseNumber(cells[totalColIndex]);
      }
      if (sourceTotal === null && yearColIndexes.length > 0) {
        let sum = 0;
        let anyFound = false;
        for (const idx of yearColIndexes) {
          if (idx >= cells.length) continue;
          const n = parseNumber(cells[idx]);
          if (n !== null && n > 0) {
            sum += n;
            anyFound = true;
          }
        }
        sourceTotal = anyFound ? sum : null;
      }
      if (sourceTotal === null) {
        sourceTotal = rightmostPositiveNumber(cells);
      }

      if (!looksLikeItem) {
        // Subcategory header — has a description but no qty/unit pattern
        currentSubcategory = firstCell;
        continue;
      }

      const parsed = parseItemDescription(firstCell);
      let confidence: ParseConfidence = "high";
      let warning: string | null = null;

      if (sourceTotal == null) {
        confidence = "low";
        warning = "Could not detect total amount column";
      }
      if (parsed.quantity == null || parsed.unit == null) {
        confidence = "low";
        warning = warning ?? "Could not detect quantity / unit";
      }

      const finalQty = parsed.quantity ?? 1;
      const total = sourceTotal ?? 0;
      const rawUnitPrice = finalQty > 0 ? total / finalQty : 0;
      const unitPrice = Math.round(rawUnitPrice * 100) / 100;
      // Recompute total from rounded unit price so the row passes server-side
      // qty * unitPrice = total validation. If this drifts from the source doc by more
      // than 1 PHP, flag a warning so the proponent can review.
      const derivedTotal = Math.round(finalQty * unitPrice * 100) / 100;

      if (sourceTotal != null && Math.abs(derivedTotal - sourceTotal) > 1) {
        confidence = confidence === "high" ? "medium" : confidence;
        warning =
          warning ??
          `Total recomputed from rounded unit price (₱${derivedTotal.toFixed(
            2,
          )}); source said ₱${sourceTotal.toFixed(2)}`;
      }

      items.push({
        category: currentCategory,
        subcategoryLabel: currentSubcategory,
        itemName: parsed.itemName,
        spec: parsed.spec,
        quantity: finalQty,
        unit: parsed.unit,
        unitPrice,
        totalAmount: derivedTotal,
        confidence,
        warning,
        rawRow: cells.join(" | "),
      });
    }
  }

  if (items.length === 0) {
    warnings.push(
      "No line items were detected. The document may not be a recognized Line-Item Budget format, or its tables may use merged cells the parser cannot read.",
    );
  }

  if (detected.yearColumnsDetected) {
    warnings.push(
      "Year 1 / Year 2 columns detected — amounts were summed into flat line items. Per-year budget segmentation is not tracked; quarterly monitoring handles the time dimension.",
    );
  }

  return { items, warnings, detected };
}
