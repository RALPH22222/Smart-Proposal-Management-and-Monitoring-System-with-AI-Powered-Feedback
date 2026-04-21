import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Bundle the PDF.js worker with the app so redaction doesn't depend on a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/**
 * XML file paths within a DOCX archive that may contain visible text.
 * Header/footer counts vary per document, so match them dynamically.
 */
const DOCX_XML_PATH_PATTERNS = [
  /^word\/document\.xml$/i,
  /^word\/(header|footer)\d+\.xml$/i,
  /^word\/footnotes\.xml$/i,
  /^word\/endnotes\.xml$/i,
  /^word\/comments\d*\.xml$/i,
];

const DOCX_TEXT_NODE_NAMES = new Set(["t", "delText", "instrText"]);

interface DocxTextSegment {
  node: Element;
  start: number;
  text: string;
}

/**
 * Build a global, case-insensitive regex that matches any of the target strings.
 * Special regex characters in the targets are escaped.
 */
function buildTargetRegex(targets: string[]): RegExp {
  const escaped = targets
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((t) =>
      t
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s+"),
    );
  if (escaped.length === 0) {
    return /(?!)/; // matches nothing
  }
  return new RegExp(escaped.join("|"), "gi");
}

function listDocxXmlParts(zip: JSZip): string[] {
  return Object.keys(zip.files)
    .filter((path) => !zip.files[path]?.dir)
    .filter((path) => DOCX_XML_PATH_PATTERNS.some((pattern) => pattern.test(path)))
    .sort();
}

function parseDocxXml(xml: string): XMLDocument {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Failed to parse DOCX XML for redaction.");
  }
  return doc;
}

function collectDocxTextSegments(doc: XMLDocument): { segments: DocxTextSegment[]; fullText: string } {
  const segments: DocxTextSegment[] = [];
  let cursor = 0;

  for (const element of Array.from(doc.getElementsByTagName("*"))) {
    if (!DOCX_TEXT_NODE_NAMES.has(element.localName)) continue;

    const text = element.textContent ?? "";
    if (!text) continue;

    segments.push({
      node: element,
      start: cursor,
      text,
    });
    cursor += text.length;
  }

  return {
    segments,
    fullText: segments.map((segment) => segment.text).join(""),
  };
}

function buildRedactionMask(text: string, targets: string[]): { count: number; mask: Uint8Array } {
  const mask = new Uint8Array(text.length);
  if (!text || targets.length === 0) {
    return { count: 0, mask };
  }

  const regex = buildTargetRegex(targets);
  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchText = match[0];
    if (!matchText) {
      regex.lastIndex += 1;
      continue;
    }

    mask.fill(1, match.index, match.index + matchText.length);
    count += 1;
  }

  return { count, mask };
}

function redactDocxXml(xml: string, targets: string[]): { count: number; redactedXml: string } {
  const doc = parseDocxXml(xml);
  const { segments, fullText } = collectDocxTextSegments(doc);
  const { count, mask } = buildRedactionMask(fullText, targets);

  if (count === 0 || segments.length === 0) {
    return { count, redactedXml: xml };
  }

  // Word often splits names across multiple <w:t> nodes. Redact against the
  // reconstructed visible text, then project the mask back onto each node.
  let previousMasked = false;
  for (const segment of segments) {
    let nextText = "";

    for (let i = 0; i < segment.text.length; i += 1) {
      const masked = mask[segment.start + i] === 1;
      if (masked) {
        if (!previousMasked) {
          nextText += "[REDACTED]";
        }
      } else {
        nextText += segment.text[i];
      }
      previousMasked = masked;
    }

    segment.node.textContent = nextText;
  }

  return {
    count,
    redactedXml: new XMLSerializer().serializeToString(doc),
  };
}

// ---------------------------------------------------------------------------
// DOCX Redaction
// ---------------------------------------------------------------------------

/**
 * Redact target strings from a DOCX file.
 *
 * DOCX files are ZIP archives containing XML. This function opens the archive,
 * performs case-insensitive replacement of each target with `[REDACTED]` in all
 * relevant XML parts, then re-packages the archive.
 *
 * @param file   - The original DOCX file
 * @param targets - Strings to redact (e.g. names, agency names)
 * @returns A new DOCX file as a Blob with redacted content
 */
export async function redactDocx(
  file: File,
  targets: string[],
): Promise<Blob> {
  if (targets.length === 0) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  for (const partPath of listDocxXmlParts(zip)) {
    const entry = zip.file(partPath);
    if (!entry) continue;

    const xml = await entry.async("string");
    const { redactedXml } = redactDocxXml(xml, targets);
    zip.file(partPath, redactedXml);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return blob;
}

/**
 * Count the total number of target occurrences across all XML parts in a DOCX.
 */
async function countDocxRedactions(
  file: File,
  targets: string[],
): Promise<number> {
  if (targets.length === 0) return 0;

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let count = 0;

  for (const partPath of listDocxXmlParts(zip)) {
    const entry = zip.file(partPath);
    if (!entry) continue;

    const xml = await entry.async("string");
    count += redactDocxXml(xml, targets).count;
  }

  return count;
}

// ---------------------------------------------------------------------------
// PDF Redaction
// ---------------------------------------------------------------------------

/**
 * Create a canvas element, preferring OffscreenCanvas when available.
 */
function createCanvas(
  width: number,
  height: number,
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Check whether a text string contains any of the target strings
 * (case-insensitive).
 */
function containsTarget(text: string, targets: string[]): boolean {
  const lower = text.toLowerCase();
  return targets.some((t) => t.length > 0 && lower.includes(t.toLowerCase()));
}

/**
 * Redact target strings from a PDF file.
 *
 * This works by rendering each page to a canvas, overlaying black rectangles
 * on text regions that match any target, then assembling the canvases into a
 * new image-based PDF via pdf-lib.
 *
 * @param file    - The original PDF file
 * @param targets - Strings to redact
 * @returns A new PDF as a Blob with redacted content
 */
export async function redactPdf(
  file: File,
  targets: string[],
): Promise<Blob> {
  if (targets.length === 0) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const outputDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvasWidth = Math.floor(viewport.width);
    const canvasHeight = Math.floor(viewport.height);
    const canvas = createCanvas(canvasWidth, canvasHeight);

    const ctx = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) {
      throw new Error(`Failed to get 2D context for page ${pageNum}`);
    }

    // Render the original page onto the canvas.
    // pdfjs-dist v5 accepts a `canvas` parameter; we cast for OffscreenCanvas
    // compatibility since the type definition only declares HTMLCanvasElement.
    const renderTask = page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      canvas: null,
      viewport,
    });
    await renderTask.promise;

    // Retrieve text content and draw black rectangles over matching items.
    const textContent = await page.getTextContent();
    const pageHeight = viewport.height / scale; // un-scaled page height

    for (const item of textContent.items) {
      // Skip marked-content items (they lack a `str` property)
      if (!("str" in item)) continue;
      const textItem = item as TextItem;

      if (!containsTarget(textItem.str, targets)) continue;

      // Extract position from the transform matrix.
      // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const tx = textItem.transform[4] as number;
      const ty = textItem.transform[5] as number;

      const x = tx * scale;
      const y = (pageHeight - ty) * scale;
      const w = textItem.width * scale;
      const h = textItem.height * scale;

      // Small padding for reliable coverage
      const pad = 2;
      ctx.fillStyle = "#000000";
      ctx.fillRect(x - pad, y - h - pad, w + pad * 2, h + pad * 2);
    }

    // Convert the canvas to a PNG and embed it into the output PDF.
    let pngBytes: Uint8Array;

    if (canvas instanceof OffscreenCanvas) {
      const blob = await canvas.convertToBlob({ type: "image/png" });
      pngBytes = new Uint8Array(await blob.arrayBuffer());
    } else {
      // HTMLCanvasElement path
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];
      const binaryStr = atob(base64);
      pngBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        pngBytes[i] = binaryStr.charCodeAt(i);
      }
    }

    const pngImage = await outputDoc.embedPng(pngBytes);
    const outputPage = outputDoc.addPage([canvasWidth, canvasHeight]);
    outputPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    });
  }

  const pdfBytes = await outputDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
}

/**
 * Count the number of text items in a PDF that contain any target string.
 */
async function countPdfRedactions(
  file: File,
  targets: string[],
): Promise<number> {
  if (targets.length === 0) return 0;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;
  let count = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const textItem = item as TextItem;
      if (containsTarget(textItem.str, targets)) {
        count++;
      }
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Unified Entry Point
// ---------------------------------------------------------------------------

export interface RedactionResult {
  /** The redacted file as a Blob */
  blob: Blob;
  /** Number of redaction targets found in the document */
  redactionCount: number;
  /** The detected file type */
  type: "docx" | "pdf";
}

/**
 * Determine file type from name and MIME.
 */
function detectFileType(file: File): "docx" | "pdf" {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (
    name.endsWith(".docx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (name.endsWith(".pdf") || mime === "application/pdf") {
    return "pdf";
  }

  throw new Error(
    `Unsupported file type: "${file.name}" (${file.type || "unknown MIME"}). ` +
      "Only DOCX and PDF files are supported for redaction.",
  );
}

/**
 * Redact target strings from a file (DOCX or PDF).
 *
 * Determines the file type from the file extension or MIME type, applies
 * the appropriate redaction strategy, and returns the redacted blob along
 * with the number of redactions performed and the detected file type.
 *
 * @param file    - The original file (DOCX or PDF)
 * @param targets - Strings to redact (e.g. ["Juan Dela Cruz", "ABC University"])
 * @returns Object with the redacted blob, redaction count, and file type
 * @throws Error if the file type is not DOCX or PDF
 */
export async function redactFile(
  file: File,
  targets: string[],
): Promise<RedactionResult> {
  const fileType = detectFileType(file);

  // Filter out empty strings from targets
  const validTargets = targets.filter((t) => t.trim().length > 0);

  if (fileType === "docx") {
    // Count first (uses its own read of the file), then redact
    const redactionCount = await countDocxRedactions(file, validTargets);
    const blob = await redactDocx(file, validTargets);
    return { blob, redactionCount, type: "docx" };
  }

  // PDF
  const redactionCount = await countPdfRedactions(file, validTargets);
  const blob = await redactPdf(file, validTargets);
  return { blob, redactionCount, type: "pdf" };
}
