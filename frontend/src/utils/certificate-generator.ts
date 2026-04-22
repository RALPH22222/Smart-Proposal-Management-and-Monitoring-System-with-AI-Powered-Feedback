import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatDate } from "./date-formatter";

export interface CertificateData {
  projectTitle: string;
  programTitle?: string;
  projectLeader: string;
  department: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  issuedAt: string;
  issuedByName: string;
  // Optional. When present and non-empty, an "in collaboration with
  // Co-Project Leader(s):" block is drawn beneath the project leader.
  // When empty/undefined, the layout is identical to single-lead projects.
  coLeads?: string[];
}

// Embed a PNG image from a URL/import path
async function embedImage(pdfDoc: PDFDocument, url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  // Check PNG signature
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return pdfDoc.embedPng(bytes);
  }
  return pdfDoc.embedJpg(bytes);
}

/**
 * Generate a completion certificate PDF and trigger download.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<void> {
  const pdfDoc = await PDFDocument.create();

  // Landscape letter: 792 x 612
  const page = pdfDoc.addPage([792, 612]);
  const { width, height } = page.getSize();

  // Load fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const darkRed = rgb(0.78, 0.063, 0.18); // #C8102E
  const gold = rgb(0.72, 0.58, 0.2);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const medGray = rgb(0.4, 0.4, 0.4);

  // === BORDER ===
  const borderMargin = 20;
  const borderWidth = 2;
  // Outer border
  page.drawRectangle({
    x: borderMargin,
    y: borderMargin,
    width: width - borderMargin * 2,
    height: height - borderMargin * 2,
    borderColor: darkRed,
    borderWidth: borderWidth,
  });
  // Inner border
  page.drawRectangle({
    x: borderMargin + 8,
    y: borderMargin + 8,
    width: width - (borderMargin + 8) * 2,
    height: height - (borderMargin + 8) * 2,
    borderColor: gold,
    borderWidth: 1,
  });

  // === LOGOS ===
  try {
    const [wmsuLogo, rdecLogo] = await Promise.all([
      embedImage(pdfDoc, new URL("../assets/IMAGES/WMSU.png", import.meta.url).href),
      embedImage(pdfDoc, new URL("../assets/IMAGES/RDEC-WMSU.png", import.meta.url).href),
    ]);

    const logoSize = 70;
    // Left logo (WMSU)
    page.drawImage(wmsuLogo, {
      x: 60,
      y: height - 55 - logoSize,
      width: logoSize,
      height: logoSize,
    });
    // Right logo (RDEC)
    page.drawImage(rdecLogo, {
      x: width - 60 - logoSize,
      y: height - 55 - logoSize,
      width: logoSize,
      height: logoSize,
    });
  } catch (e) {
    console.warn("Could not embed logos:", e);
  }

  // === HEADER TEXT ===
  let y = height - 65;

  const drawCenteredText = (text: string, yPos: number, font: typeof timesRoman, size: number, color = darkGray) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: yPos,
      size,
      font,
      color,
    });
  };

  drawCenteredText("Western Mindanao State University", y, timesRomanBold, 13, darkGray);
  y -= 16;
  drawCenteredText("Research Development and Evaluation Center", y, timesRoman, 11, medGray);
  y -= 14;
  drawCenteredText("Zamboanga City, Philippines", y, timesRoman, 10, medGray);

  // === DECORATIVE LINE ===
  y -= 20;
  page.drawLine({
    start: { x: 100, y },
    end: { x: width - 100, y },
    thickness: 1.5,
    color: darkRed,
  });
  page.drawLine({
    start: { x: 140, y: y - 3 },
    end: { x: width - 140, y: y - 3 },
    thickness: 0.5,
    color: gold,
  });

  // === CERTIFICATE TITLE ===
  y -= 35;
  drawCenteredText("CERTIFICATE OF COMPLETION", y, helveticaBold, 26, darkRed);

  // === BODY TEXT ===
  y -= 35;
  drawCenteredText("This is to certify that the research project entitled", y, timesRomanItalic, 12, darkGray);

  // Project title (bold, wrapped)
  y -= 30;
  const maxTitleWidth = width - 160;
  const titleSize = data.projectTitle.length > 80 ? 13 : 15;
  const titleWords = data.projectTitle.split(" ");
  const titleLines: string[] = [];
  let currentLine = "";

  for (const word of titleWords) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (timesRomanBold.widthOfTextAtSize(testLine, titleSize) > maxTitleWidth) {
      titleLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) titleLines.push(currentLine);

  for (const line of titleLines) {
    drawCenteredText(`"${line}"`, y, timesRomanBold, titleSize, darkRed);
    y -= titleSize + 5;
  }

  // Program title if available
  if (data.programTitle) {
    y -= 2;
    drawCenteredText(`under the program "${data.programTitle}"`, y, timesRomanItalic, 11, medGray);
    y -= 18;
  } else {
    y -= 8;
  }

  // Led by
  drawCenteredText("has been successfully completed under the leadership of", y, timesRoman, 12, darkGray);
  y -= 24;
  drawCenteredText(data.projectLeader, y, timesRomanBold, 16, darkGray);
  y -= 16;
  drawCenteredText(data.department, y, timesRomanItalic, 11, medGray);

  // Co-Project Leader(s) — only drawn when present, so single-lead layout is unchanged.
  const coLeads = (data.coLeads ?? []).filter((n) => n && n.trim().length > 0);
  if (coLeads.length > 0) {
    y -= 20;
    const label = coLeads.length === 1
      ? "in collaboration with Co-Project Leader:"
      : "in collaboration with Co-Project Leaders:";
    drawCenteredText(label, y, timesRomanItalic, 11, medGray);

    // Wrap comma-separated names to fit within maxTitleWidth (also used for the title).
    const namesFullLine = coLeads.join(", ");
    const nameSize = 12;
    const lineMax = maxTitleWidth;
    const nameLines: string[] = [];
    if (timesRoman.widthOfTextAtSize(namesFullLine, nameSize) <= lineMax) {
      nameLines.push(namesFullLine);
    } else {
      let current = "";
      for (let i = 0; i < coLeads.length; i++) {
        const token = i === coLeads.length - 1 ? coLeads[i] : `${coLeads[i]},`;
        const candidate = current ? `${current} ${token}` : token;
        if (timesRoman.widthOfTextAtSize(candidate, nameSize) > lineMax) {
          if (current) nameLines.push(current);
          current = token;
        } else {
          current = candidate;
        }
      }
      if (current) nameLines.push(current);
    }

    for (const line of nameLines) {
      y -= 15;
      drawCenteredText(line, y, timesRoman, nameSize, darkGray);
    }
  }

  // Project details
  y -= 28;
  const duration = `${formatDate(data.startDate)} - ${formatDate(data.endDate)}`;
  drawCenteredText(`Project Duration: ${duration}`, y, timesRoman, 10, medGray);
  y -= 14;
  const budgetStr = `Total Budget: PHP ${data.totalBudget.toLocaleString()}`;
  drawCenteredText(budgetStr, y, timesRoman, 10, medGray);

  // === DECORATIVE LINE ===
  y -= 22;
  page.drawLine({
    start: { x: 200, y },
    end: { x: width - 200, y },
    thickness: 0.5,
    color: gold,
  });

  // === ISSUED INFO ===
  y -= 25;
  drawCenteredText(`Issued on ${formatDate(data.issuedAt)}`, y, timesRoman, 11, darkGray);

  // === SIGNATURE AREA ===
  y -= 50;
  const sigX = width / 2;
  // Signature line
  page.drawLine({
    start: { x: sigX - 100, y: y + 12 },
    end: { x: sigX + 100, y: y + 12 },
    thickness: 0.75,
    color: darkGray,
  });
  drawCenteredText(data.issuedByName, y, timesRomanBold, 12, darkGray);
  y -= 14;
  drawCenteredText("R&D Office", y, timesRomanItalic, 10, medGray);

  // === FOOTER ===
  page.drawText("Smart Proposal Management and Monitoring System (SPMAMS)", {
    x: (width - timesRomanItalic.widthOfTextAtSize("Smart Proposal Management and Monitoring System (SPMAMS)", 8)) / 2,
    y: borderMargin + 15,
    size: 8,
    font: timesRomanItalic,
    color: rgb(0.6, 0.6, 0.6),
  });

  // === SAVE & DOWNLOAD ===
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certificate_${data.projectTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
