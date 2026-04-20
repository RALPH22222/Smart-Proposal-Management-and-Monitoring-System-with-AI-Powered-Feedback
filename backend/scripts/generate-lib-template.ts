// Generates the WMSU LIB Template v1 .docx files — both blank and sample-filled.
// Outputs to backend/tests/fixtures/ (for unit tests) and frontend/public/templates/
// (for static fallback download). Run: `npx ts-node backend/scripts/generate-lib-template.ts`
//
// Column schema is the contract the strict parser targets:
//   Subcategory | Item Name | Spec / Volume | Qty | Unit | Unit Price | Amount
//
// Category header rows use the exact strings the parser matches:
//   I. PERSONNEL SERVICES
//   II. MAINTENANCE & OTHER OPERATING EXPENSES
//   III. CAPITAL OUTLAY

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from "docx";
import fs from "fs";
import path from "path";

type Row = {
  subcategory: string;
  itemName: string;
  spec: string;
  qty: number | "";
  unit: string;
  unitPrice: number | "";
  amount: number | "";
};

const HEADER_COLUMNS = [
  "Subcategory",
  "Item Name",
  "Spec / Volume",
  "Qty",
  "Unit",
  "Unit Price",
  "Amount",
] as const;

const CATEGORY_HEADERS = {
  ps: "I. PERSONNEL SERVICES",
  mooe: "II. MAINTENANCE & OTHER OPERATING EXPENSES",
  co: "III. CAPITAL OUTLAY",
} as const;

const SAMPLE_PS: Row[] = [
  { subcategory: "Honoraria", itemName: "Project Leader", spec: "Faculty rate, 12 months", qty: 1, unit: "Person", unitPrice: 20000, amount: 20000 },
  { subcategory: "Honoraria", itemName: "Research Assistant", spec: "Graduate student, 6 months", qty: 2, unit: "Person", unitPrice: 15000, amount: 30000 },
  { subcategory: "Honoraria", itemName: "Field Enumerator", spec: "BS-level, project-based", qty: 4, unit: "Person", unitPrice: 8000, amount: 32000 },
];

const SAMPLE_MOOE: Row[] = [
  { subcategory: "Office Supplies", itemName: "Bond Paper", spec: "80GSM, A4", qty: 10, unit: "Ream", unitPrice: 260, amount: 2600 },
  { subcategory: "Office Supplies", itemName: "Ballpen", spec: "Black, 12 pcs/box", qty: 2, unit: "Box", unitPrice: 132, amount: 264 },
  { subcategory: "Office Supplies", itemName: "Folder", spec: "Ordinary, Long, Tagboard", qty: 20, unit: "Piece", unitPrice: 5, amount: 100 },
  { subcategory: "Communication Expenses", itemName: "Mobile Load", spec: "Php 500 denomination", qty: 20, unit: "Piece", unitPrice: 500, amount: 10000 },
  { subcategory: "Communication Expenses", itemName: "Internet Subscription", spec: "Monthly fiber plan", qty: 6, unit: "Month", unitPrice: 1500, amount: 9000 },
  { subcategory: "Electronic Parts and Components", itemName: "Arduino Uno R3", spec: "Atmega328", qty: 12, unit: "Piece", unitPrice: 600, amount: 7200 },
  { subcategory: "Electronic Parts and Components", itemName: "DHT22 Sensor Module", spec: "5V, temp + humidity", qty: 12, unit: "Unit", unitPrice: 600, amount: 7200 },
  { subcategory: "Laboratory Supplies", itemName: "Alcohol 70% Isopropyl", spec: "Disinfectant", qty: 2, unit: "Gallon", unitPrice: 800, amount: 1600 },
  { subcategory: "Other", itemName: "PM2.5 Optical Dust Sensor", spec: "GP2Y1010AUOF", qty: 6, unit: "Unit", unitPrice: 900, amount: 5400 },
  { subcategory: "Other", itemName: "SGP30 Air Quality Sensor", spec: "VOC/CO2 breakout board", qty: 3, unit: "Piece", unitPrice: 850, amount: 2550 },
];

const SAMPLE_CO: Row[] = [
  { subcategory: "ICT Equipment", itemName: "Ink Tank Printer", spec: "All-in-one, Wi-Fi", qty: 1, unit: "Unit", unitPrice: 15000, amount: 15000 },
  { subcategory: "ICT Equipment", itemName: "Laptop", spec: "Intel i5, 16GB RAM, 512GB SSD", qty: 1, unit: "Unit", unitPrice: 45000, amount: 45000 },
  { subcategory: "Semi-expendable Equipment", itemName: "Office Table", spec: "120x60x76cm, 2-tone", qty: 1, unit: "Piece", unitPrice: 6000, amount: 6000 },
  { subcategory: "Semi-expendable Equipment", itemName: "Office Chair", spec: "Swivel, mesh back", qty: 2, unit: "Piece", unitPrice: 3500, amount: 7000 },
];

const EMPTY_ROW: Row = { subcategory: "", itemName: "", spec: "", qty: "", unit: "", unitPrice: "", amount: "" };

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

// WMSU brand crimson — matches the #C8102E token used across the web UI.
const WMSU_CRIMSON = "C8102E";
const WMSU_CRIMSON_TINT = "FDECEE"; // Very light crimson background for category header rows.

function txt(
  s: string,
  opts: { bold?: boolean; align?: Align; color?: string; size?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [
      new TextRun({
        text: s,
        bold: opts.bold ?? false,
        color: opts.color,
        size: opts.size ?? 20,
      }),
    ],
  });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    shading: { fill: WMSU_CRIMSON },
    children: [
      txt(text, { bold: true, align: AlignmentType.CENTER, color: "FFFFFF" }),
    ],
  });
}

function dataCell(text: string, align: Align = AlignmentType.LEFT): TableCell {
  return new TableCell({ children: [txt(text, { align })] });
}

function categoryHeaderRow(label: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: HEADER_COLUMNS.length,
        shading: { fill: WMSU_CRIMSON_TINT },
        children: [
          txt(label, { bold: true, align: AlignmentType.LEFT, color: WMSU_CRIMSON, size: 22 }),
        ],
      }),
    ],
  });
}

function dataRow(r: Row): TableRow {
  const asStr = (v: number | "") => (v === "" ? "" : String(v));
  return new TableRow({
    children: [
      dataCell(r.subcategory),
      dataCell(r.itemName),
      dataCell(r.spec),
      dataCell(asStr(r.qty), AlignmentType.CENTER),
      dataCell(r.unit, AlignmentType.CENTER),
      dataCell(asStr(r.unitPrice), AlignmentType.RIGHT),
      dataCell(asStr(r.amount), AlignmentType.RIGHT),
    ],
  });
}

// Subtotal row — spans first 6 columns as a label, puts the sum in the last (Amount) column.
// The parser skips rows whose first cell starts with "subtotal" / "total" / "grand total",
// so these are visual-only. Proponents fill them in by hand for sanity-check purposes.
function subtotalRow(label: string, amount: number | ""): TableRow {
  const asStr = (v: number | "") => (v === "" ? "" : String(v));
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: HEADER_COLUMNS.length - 1,
        shading: { fill: "F7F7F7" },
        children: [txt(label, { bold: true, align: AlignmentType.RIGHT, color: "4A5568" })],
      }),
      new TableCell({
        shading: { fill: "F7F7F7" },
        children: [txt(asStr(amount), { bold: true, align: AlignmentType.RIGHT })],
      }),
    ],
  });
}

function grandTotalRow(amount: number | ""): TableRow {
  const asStr = (v: number | "") => (v === "" ? "" : String(v));
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: HEADER_COLUMNS.length - 1,
        shading: { fill: WMSU_CRIMSON },
        children: [
          txt("GRAND TOTAL", { bold: true, align: AlignmentType.RIGHT, color: "FFFFFF", size: 22 }),
        ],
      }),
      new TableCell({
        shading: { fill: WMSU_CRIMSON },
        children: [
          txt(asStr(amount), { bold: true, align: AlignmentType.RIGHT, color: "FFFFFF", size: 22 }),
        ],
      }),
    ],
  });
}

function sumRows(rows: Row[]): number | "" {
  const total = rows.reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : 0), 0);
  return total === 0 ? "" : total;
}

function buildDocument(filled: boolean): Document {
  const headerRow = new TableRow({ children: HEADER_COLUMNS.map(headerCell), tableHeader: true });

  const psRows = filled ? SAMPLE_PS : [EMPTY_ROW];
  const mooeRows = filled ? SAMPLE_MOOE : [EMPTY_ROW];
  const coRows = filled ? SAMPLE_CO : [EMPTY_ROW];

  const psTotal = filled ? sumRows(SAMPLE_PS) : "";
  const mooeTotal = filled ? sumRows(SAMPLE_MOOE) : "";
  const coTotal = filled ? sumRows(SAMPLE_CO) : "";
  const grandTotal =
    filled && typeof psTotal === "number" && typeof mooeTotal === "number" && typeof coTotal === "number"
      ? psTotal + mooeTotal + coTotal
      : "";

  const rows: TableRow[] = [
    headerRow,
    categoryHeaderRow(CATEGORY_HEADERS.ps),
    ...psRows.map(dataRow),
    subtotalRow("Subtotal — Personnel Services", psTotal),
    categoryHeaderRow(CATEGORY_HEADERS.mooe),
    ...mooeRows.map(dataRow),
    subtotalRow("Subtotal — MOOE", mooeTotal),
    categoryHeaderRow(CATEGORY_HEADERS.co),
    ...coRows.map(dataRow),
    subtotalRow("Subtotal — Capital Outlay", coTotal),
    grandTotalRow(grandTotal),
  ];

  const table = new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "C0C0C0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "C0C0C0" },
    },
  });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "WMSU LINE-ITEM BUDGET (LIB) TEMPLATE v1",
          bold: true,
          size: 28,
          color: WMSU_CRIMSON,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Western Mindanao State University — Research Development & Evaluation Center",
          size: 20,
          color: "4A5568",
        }),
      ],
    }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "How to use this template: Fill in one item per row. Do not add or remove columns. Keep the category header rows (PS / MOOE / CO) intact. The Amount column should equal Qty x Unit Price.",
          italics: true,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            'Subcategory tip: If your item matches a standard subcategory (e.g. "Office Supplies", "Honoraria"), write that. If your item does not fit any standard subcategory, you have three options — all are acceptable: (1) write "Other" and refine it in the form after import, (2) write your own specific label (e.g. "IoT Sensors") and the system keeps it as-is, or (3) leave the cell blank and pick the subcategory in the form after import.',
          italics: true,
          size: 18,
          color: "4A5568",
        }),
      ],
    }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
    table,
  ];

  return new Document({
    creator: "WMSU RDEC",
    title: "WMSU LIB Template v1",
    description: "Line-Item Budget template for proposal submission",
    sections: [{ properties: {}, children }],
  });
}

async function writeDoc(filled: boolean, fileName: string): Promise<void> {
  const doc = buildDocument(filled);
  const buffer = await Packer.toBuffer(doc);
  const fixturesDir = path.join(__dirname, "..", "tests", "fixtures");
  const publicDir = path.join(__dirname, "..", "..", "frontend", "public", "templates");
  fs.mkdirSync(fixturesDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(fixturesDir, fileName), buffer);
  fs.writeFileSync(path.join(publicDir, fileName), buffer);
  console.log(`wrote ${fileName} (${buffer.length} bytes) → fixtures + public`);
}

async function main() {
  await writeDoc(false, "wmsu-lib-template-v1.docx");
  await writeDoc(true, "wmsu-lib-template-v1-sample.docx");
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
