// Phase 2 smoke test — runs the LIB parser against real teacher-provided documents
// and prints a summary. Throwaway script; not a Jest test (no assertions, just a sanity
// check during development). Delete once Phase 2 ships.

import * as fs from "fs";
import { parseLibDocument } from "../src/services/lib-parser.service";

async function run(path: string) {
  console.log(`\n========== ${path} ==========`);
  const buffer = fs.readFileSync(path);
  const result = await parseLibDocument(buffer);

  console.log(`Tables detected: ${result.detected.tableCount}`);
  console.log(`Categories detected:`, result.detected.categories);
  console.log(`Grand total detected: ${result.detected.grandTotal}`);
  console.log(`Total items parsed: ${result.items.length}`);
  console.log(`Warnings: ${result.warnings.length}`);
  result.warnings.forEach((w) => console.log(`  - ${w}`));

  const byConfidence = { high: 0, medium: 0, low: 0 };
  result.items.forEach((it) => {
    byConfidence[it.confidence]++;
  });
  console.log(`Confidence breakdown:`, byConfidence);

  console.log(`\nFirst 10 items:`);
  result.items.slice(0, 10).forEach((it, i) => {
    const subStr = it.subcategoryLabel ? ` [${it.subcategoryLabel}]` : "";
    console.log(
      `  ${i + 1}. [${it.category.toUpperCase()}]${subStr} ${it.itemName} | spec=${it.spec ?? "—"} | qty=${it.quantity} ${it.unit ?? ""} @ ₱${it.unitPrice} = ₱${it.totalAmount} (${it.confidence})${it.warning ? " ⚠ " + it.warning : ""}`,
    );
  });

  if (result.items.length > 10) {
    console.log(`  ... and ${result.items.length - 10} more`);
  }

  // Also print any low-confidence rows in full so we can see why
  const lowRows = result.items.filter((it) => it.confidence === "low");
  if (lowRows.length > 0) {
    console.log(`\nLow-confidence rows (${lowRows.length}):`);
    lowRows.forEach((it, i) => {
      console.log(`  ${i + 1}. ${it.itemName} | warning=${it.warning} | raw="${it.rawRow}"`);
    });
  }
}

(async () => {
  try {
    await run("C:\\Users\\Andre\\Downloads\\AMBIANCE-LIB-10.26.2022.docx");
    await run("C:\\Users\\Andre\\Downloads\\Revised-LIB-as-of-08-23-2023.docx");
  } catch (err) {
    console.error("Smoke test failed:", err);
    process.exit(1);
  }
})();
