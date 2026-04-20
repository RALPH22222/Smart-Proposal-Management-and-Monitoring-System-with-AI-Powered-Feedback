import { parseLibDocument } from "../src/services/lib-parser.service";
import fs from "fs";

async function run() {
  for (const f of ["wmsu-lib-template-v1-sample.docx", "wmsu-lib-template-v1.docx"]) {
    const buf = fs.readFileSync("tests/fixtures/" + f);
    const r = await parseLibDocument(buf);
    const sum = (cat: string) => r.items.filter((i) => i.category === cat).reduce((s, i) => s + i.totalAmount, 0);
    console.log(f, "rejected=" + r.rejected, "items=" + r.items.length, "PS=" + sum("ps"), "MOOE=" + sum("mooe"), "CO=" + sum("co"), "warn=" + r.warnings.length);
  }
  try {
    const ambBuf = fs.readFileSync("C:/Users/Andre/Downloads/AMBIANCE-LIB-10.26.2022.docx");
    const r2 = await parseLibDocument(ambBuf);
    console.log("AMBIANCE rejected=" + r2.rejected, "items=" + r2.items.length, "warn=" + JSON.stringify(r2.warnings));
  } catch (e) {
    console.log("AMBIANCE: skipped (not found)");
  }
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
