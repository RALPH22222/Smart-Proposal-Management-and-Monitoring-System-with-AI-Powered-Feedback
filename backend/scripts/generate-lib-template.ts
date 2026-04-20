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

function txt(s: string, opts: { bold?: boolean; align?: Align } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [new TextRun({ text: s, bold: opts.bold ?? false, size: 20 })],
  });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    shading: { fill: "D9D9D9" },
    children: [txt(text, { bold: true, align: AlignmentType.CENTER })],
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
        shading: { fill: "FFF2CC" },
        children: [txt(label, { bold: true, align: AlignmentType.LEFT })],
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

function buildDocument(filled: boolean): Document {
  const headerRow = new TableRow({ children: HEADER_COLUMNS.map(headerCell), tableHeader: true });

  const psRows = filled ? SAMPLE_PS : [EMPTY_ROW];
  const mooeRows = filled ? SAMPLE_MOOE : [EMPTY_ROW];
  const coRows = filled ? SAMPLE_CO : [EMPTY_ROW];

  const rows: TableRow[] = [
    headerRow,
    categoryHeaderRow(CATEGORY_HEADERS.ps),
    ...psRows.map(dataRow),
    categoryHeaderRow(CATEGORY_HEADERS.mooe),
    ...mooeRows.map(dataRow),
    categoryHeaderRow(CATEGORY_HEADERS.co),
    ...coRows.map(dataRow),
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
      children: [new TextRun({ text: "WMSU LINE-ITEM BUDGET (LIB) TEMPLATE v1", bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Western Mindanao State University — Research Development & Evaluation Center", size: 20 })],
    }),
    new Paragraph({ children: [new TextRun({ text: " " })] }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "Fill in one item per row. Do not add or remove columns. Category header rows (PS / MOOE / CO) separate the three sections — keep them intact. Amount should equal Qty x Unit Price.",
          italics: true,
          size: 18,
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
