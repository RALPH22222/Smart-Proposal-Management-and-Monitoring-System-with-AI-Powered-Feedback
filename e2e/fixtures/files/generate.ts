/**
 * Generates the small binary fixture files used by the upload tests.
 *
 * Run once after `npm install`:  npx tsx fixtures/files/generate.ts
 *
 * Produces:
 *   - sample-report.pdf         (~3 KB, valid PDF used by the quarterly-report test)
 *
 * The larger DOCX fixtures used by the proposal-submission test
 * (`sample-proposal.docx`, `sample-lib-template.docx`) are committed to
 * the repo as-is because they must match the real DOST Form 1B +
 * WMSU LIB v1 templates — we cannot synthesise them programmatically.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";
import path from "path";

async function makePdf(title: string, body: string, outPath: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(title, { x: 50, y: 740, size: 20, font, color: rgb(0, 0, 0) });
  page.drawText(body, {
    x: 50,
    y: 700,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: 500,
    lineHeight: 16,
  });
  const bytes = await pdf.save();
  writeFileSync(outPath, bytes);
  console.log("wrote", outPath, `(${bytes.length} bytes)`);
}

async function main() {
  const dir = __dirname;
  await makePdf(
    "E2E Sample Quarterly Report",
    "Automatically generated quarterly report fixture. Used to exercise the project-monitoring " +
      "upload endpoint for PS/MOOE/CO line items and progress tracking.",
    path.join(dir, "sample-report.pdf"),
  );
  console.log("\nNote: sample-proposal.docx and sample-lib-template.docx are committed");
  console.log("directly (they must match the DOST Form 1B and WMSU LIB v1 templates).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
