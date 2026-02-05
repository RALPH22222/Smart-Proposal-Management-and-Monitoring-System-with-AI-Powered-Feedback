/**
 * Pure TypeScript reimplementation of the proposal AI model inference.
 *
 * Replicates the forward pass of the trained Keras model without any ML framework:
 *   TextVectorization -> Embedding -> GlobalAveragePooling1D -> concat with metadata Dense -> Dense -> sigmoid
 *
 * Model JSON files are loaded from ../ai-models/ (exported by trained-ai/export_weights.py).
 */

import path from "path";
import { readFileSync } from "fs";

// ── Types ────────────────────────────────────────────────────────────

interface DenseLayerWeights {
  name: string;
  kernel: number[][]; // shape: [inputDim, outputDim]
  bias: number[];
  activation: string;
}

interface ScalerParams {
  mean: number[];
  scale: number[];
}

interface KMeansParams {
  centroids: number[][];
  descriptions: Record<string, string>;
}

interface ComparisonDB {
  titles: string[];
  vectors: number[][];
}

export interface AnalysisResult {
  title: string;
  score: number;
  isValid: boolean;
  noveltyScore: number;
  keywords: string[];
  similarPapers: { title: string; year: string }[];
  issues: string[];
  suggestions: string[];
}

export interface ExtractedData {
  title: string;
  duration: number;
  cooperating_agencies: number;
  total: number;
  mooe: number;
  ps: number;
  co: number;
}

// ── Model loading ────────────────────────────────────────────────────

const MODELS_DIR = path.resolve(__dirname, "ai-models");

function loadJSON<T>(filename: string): T {
  const raw = readFileSync(path.join(MODELS_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

// Lazy-loaded singletons
let _vocab: Record<string, number> | null = null;
let _embedding: number[][] | null = null;
let _denseLayers: DenseLayerWeights[] | null = null;
let _scaler: ScalerParams | null = null;
let _kmeans: KMeansParams | null = null;
let _comparisonDB: ComparisonDB | null = null;

function getVocab(): Record<string, number> {
  if (!_vocab) _vocab = loadJSON<Record<string, number>>("vocab.json");
  return _vocab;
}

function getEmbedding(): number[][] {
  if (!_embedding) _embedding = loadJSON<number[][]>("embedding.json");
  return _embedding;
}

function getDenseLayers(): DenseLayerWeights[] {
  if (!_denseLayers) _denseLayers = loadJSON<DenseLayerWeights[]>("dense_layers.json");
  return _denseLayers;
}

function getScaler(): ScalerParams {
  if (!_scaler) _scaler = loadJSON<ScalerParams>("scaler.json");
  return _scaler;
}

function getKMeans(): KMeansParams {
  if (!_kmeans) _kmeans = loadJSON<KMeansParams>("kmeans.json");
  return _kmeans;
}

function getComparisonDB(): ComparisonDB {
  if (!_comparisonDB) _comparisonDB = loadJSON<ComparisonDB>("comparison_db.json");
  return _comparisonDB;
}

// ── Math primitives ──────────────────────────────────────────────────

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Matrix-vector multiply: result[j] = sum_i(input[i] * kernel[i][j]) + bias[j] */
function denseForward(input: number[], kernel: number[][], bias: number[], activation: string): number[] {
  const outputDim = bias.length;
  const result = new Array<number>(outputDim);

  for (let j = 0; j < outputDim; j++) {
    let sum = bias[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * kernel[i][j];
    }

    if (activation === "relu") {
      result[j] = relu(sum);
    } else if (activation === "sigmoid") {
      result[j] = sigmoid(sum);
    } else {
      result[j] = sum; // linear
    }
  }

  return result;
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Euclidean distance between two vectors */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// ── Text processing ──────────────────────────────────────────────────

/**
 * Replicates Keras TextVectorization: lowercase, split on whitespace/punct, lookup indices.
 * Returns array of integer token indices.
 */
function tokenize(text: string, vocab: Record<string, number>): number[] {
  const OOV_INDEX = 1; // [UNK] token
  // Keras TextVectorization default: lowercase, strip punctuation, split on whitespace
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // replace punctuation with space
    .split(/\s+/)
    .filter((w) => w.length > 0);

  return cleaned.map((word) => vocab[word] ?? OOV_INDEX);
}

/**
 * Replicates Embedding + GlobalAveragePooling1D.
 * Looks up each token index in the embedding matrix and averages all vectors.
 */
function embedAndPool(tokens: number[], embeddingMatrix: number[][]): number[] {
  const embDim = embeddingMatrix[0].length; // 32

  if (tokens.length === 0) {
    // Return zero vector if no tokens
    return new Array<number>(embDim).fill(0);
  }

  const sum = new Array<number>(embDim).fill(0);
  for (const idx of tokens) {
    // Clamp index to valid range
    const safeIdx = Math.min(idx, embeddingMatrix.length - 1);
    const vec = embeddingMatrix[safeIdx];
    for (let j = 0; j < embDim; j++) {
      sum[j] += vec[j];
    }
  }

  // Average pooling
  for (let j = 0; j < embDim; j++) {
    sum[j] /= tokens.length;
  }

  return sum;
}

// ── Inference pipeline ───────────────────────────────────────────────

/**
 * Encode a title string to its 32-dim embedding vector.
 * Replicates: TextVectorization -> Embedding -> GlobalAveragePooling1D
 */
function encodeTitle(title: string): number[] {
  const vocab = getVocab();
  const embedding = getEmbedding();
  const tokens = tokenize(title, vocab);
  return embedAndPool(tokens, embedding);
}

/**
 * StandardScaler transform: (value - mean) / scale
 */
function scaleMetadata(raw: number[]): number[] {
  const scaler = getScaler();
  return raw.map((val, i) => (val - scaler.mean[i]) / scaler.scale[i]);
}

/**
 * Full model forward pass.
 * Returns score 0-100.
 *
 * Model architecture:
 *   text_input -> TextVectorization -> Embedding -> GlobalAveragePooling1D -> x1 (32)
 *   meta_input -> Dense(32, relu) -> x2 (32)
 *   concatenate(x1, x2) -> (64) -> Dense(32, relu) -> Dense(1, sigmoid)
 */
function predict(title: string, scaledMeta: number[]): number {
  const denseLayers = getDenseLayers();

  // === ADAPTIVE ARCHITECTURE SUPPORT ===

  // Case A: Improved Model (5 Dense Layers)
  // Architecture: Text(Dense) + Meta(Dense) -> Concat -> Dense(64) -> Dense(32) -> Output
  if (denseLayers.length === 5) {
    // 1. Text Branch
    // getEmbedding() will return 64-dim vectors for the new model
    let x1 = encodeTitle(title);

    // Apply Text Dense Layer (Layer 0)
    const textDense = denseLayers[0];
    x1 = denseForward(x1, textDense.kernel, textDense.bias, textDense.activation);

    // 2. Meta Branch
    // Apply Meta Dense Layer (Layer 1)
    const metaDense = denseLayers[1];
    const x2 = denseForward(scaledMeta, metaDense.kernel, metaDense.bias, metaDense.activation);

    // 3. Combine branches
    const combined = [...x1, ...x2];

    // 4. Hidden Layer 1 (Layer 2)
    const hidden1 = denseLayers[2];
    const z1 = denseForward(combined, hidden1.kernel, hidden1.bias, hidden1.activation);

    // 5. Hidden Layer 2 (Layer 3)
    const hidden2 = denseLayers[3];
    const z2 = denseForward(z1, hidden2.kernel, hidden2.bias, hidden2.activation);

    // 6. Output Layer (Layer 4)
    const outputLayer = denseLayers[4];
    const output = denseForward(z2, outputLayer.kernel, outputLayer.bias, outputLayer.activation);

    return output[0] * 100;
  }

  // Case B: Standard Model (3 Dense Layers) - Fallback
  // Architecture: Text(Pooling) + Meta(Dense) -> Concat -> Dense(32) -> Output

  // Text branch: encode title to 32-dim vector
  const x1 = encodeTitle(title);

  // Meta branch: Dense(32, relu) on scaled metadata
  const metaDense = denseLayers[0];
  const x2 = denseForward(scaledMeta, metaDense.kernel, metaDense.bias, metaDense.activation);

  // Concatenate x1 and x2 -> 64-dim
  const combined = [...x1, ...x2];

  // Hidden layer: Dense(32, relu)
  const hiddenDense = denseLayers[1];
  const hidden = denseForward(combined, hiddenDense.kernel, hiddenDense.bias, hiddenDense.activation);

  // Output layer: Dense(1, sigmoid)
  const outputDense = denseLayers[2];
  const output = denseForward(hidden, outputDense.kernel, outputDense.bias, outputDense.activation);

  return output[0] * 100; // Convert 0-1 to 0-100
}

/**
 * KMeans classify: find nearest centroid.
 * Returns cluster description string.
 */
function classify(scaledMeta: number[]): string {
  const kmeans = getKMeans();
  let bestCluster = 0;
  let bestDist = Infinity;

  for (let i = 0; i < kmeans.centroids.length; i++) {
    const dist = euclideanDistance(scaledMeta, kmeans.centroids[i]);
    if (dist < bestDist) {
      bestDist = dist;
      bestCluster = i;
    }
  }

  return kmeans.descriptions[String(bestCluster)] ?? "Unknown";
}

/**
 * Novelty check via cosine similarity against comparison DB.
 * Returns { noveltyScore: 0-100, bestMatch: { title, similarity } }
 */
function checkUniqueness(titleVec: number[]): {
  noveltyScore: number;
  bestMatchTitle: string;
  bestMatchSimilarity: number;
} {
  const db = getComparisonDB();
  let bestIdx = 0;
  let maxSim = -1;

  for (let i = 0; i < db.vectors.length; i++) {
    const sim = cosineSimilarity(titleVec, db.vectors[i]);
    if (sim > maxSim) {
      maxSim = sim;
      bestIdx = i;
    }
  }

  return {
    noveltyScore: Math.round((1 - maxSim) * 100),
    bestMatchTitle: db.titles[bestIdx],
    bestMatchSimilarity: maxSim,
  };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Run the full AI analysis on extracted proposal data.
 * Returns the shape expected by the frontend AIModal component.
 */
export function analyzeProposal(extracted: ExtractedData): AnalysisResult {
  // ========== ERROR HANDLING FOR UNDETECTABLE PROPOSALS ==========

  // Check for "Unknown" title (default when extraction fails)
  if (extracted.title === "Unknown Project" || extracted.title.toLowerCase().includes("unknown")) {
    return {
      title: "Cannot Detect Proposal",
      score: 0,
      isValid: false,
      noveltyScore: 0,
      keywords: ["Undetectable"],
      similarPapers: [],
      issues: [
        "❌ Cannot detect proposal content. Please try again.",
        "",
        "Your PDF must follow the standard VAWC Capsule Proposal format:",
        "",
        "Required sections:",
        "  ✓ Project Title: [Your project title here]",
        "  ✓ Duration: (In months) [number]",
        "  ✓ Budget breakdown (PS, MOOE, CO)",
        "  ✓ Total Project Cost",
        "",
        "Common issues:",
        "  • PDF is scanned image without text (use OCR first)",
        "  • Missing 'Project Title:' label in document",
        "  • Document structure doesn't match template",
        "  • File is corrupted or password-protected",
        "",
        "📄 Reference format: VAWC_CapsuleProposal-updated.pdf"
      ],
      suggestions: [
        "Use the official VAWC Capsule Proposal template",
        "Ensure 'Project Title:' label is present in the document",
        "If using a scanned PDF, apply OCR (Optical Character Recognition)",
        "Check that the PDF contains extractable text (not just images)",
        "Verify all required fields are filled in the template"
      ],
    };
  }

  // Check if proposal data is valid and detectable
  const hasValidTitle = extracted.title && extracted.title.trim().length > 0;
  const hasValidData = extracted.total > 0 || extracted.duration > 0;

  if (!hasValidTitle || !hasValidData) {
    // Return error result for undetectable proposals
    return {
      title: "Analysis Error",
      score: 0,
      isValid: false,
      noveltyScore: 0,
      keywords: ["Undetectable"],
      similarPapers: [],
      issues: [
        "❌ Proposal content could not be detected or analyzed.",
        "The uploaded PDF/document may be:",
        "  • Empty or contains only images",
        "  • Scanned without OCR (text not extractable)",
        "  • Corrupted or in an unsupported format",
        "  • Missing critical information (title, budget, duration)",
        "",
        "Please ensure your document:",
        "  ✓ Contains readable text (not just scanned images)",
        "  ✓ Includes a clear project title",
        "  ✓ Has budget and timeline information",
        "  ✓ Is in a supported format (PDF, DOC, DOCX)"
      ],
      suggestions: [
        "Try re-uploading the document with text content",
        "If using a scanned PDF, apply OCR (Optical Character Recognition) first",
        "Verify the document is not password-protected or encrypted",
        "Check that the file is not corrupted"
      ],
    };
  }

  // Check for minimal title quality
  if (extracted.title.trim().length < 10) {
    return {
      title: extracted.title || "Incomplete Proposal",
      score: 0,
      isValid: false,
      noveltyScore: 0,
      keywords: ["Incomplete"],
      similarPapers: [],
      issues: [
        "❌ Proposal title is too short or incomplete.",
        `Detected title: "${extracted.title}"`,
        "",
        "A valid research proposal should have:",
        "  • A descriptive title (at least 10 characters)",
        "  • Clear research objectives",
        "  • Budget breakdown",
        "  • Timeline information"
      ],
      suggestions: [
        "Ensure the document contains a complete project title",
        "Check if the PDF text extraction was successful",
        "Verify the document structure and formatting"
      ],
    };
  }

  // ========== NORMAL ANALYSIS FLOW ==========

  // 1. Prepare metadata vector: [duration, mooe, ps, co, total, agencies]
  const rawMeta = [
    extracted.duration,
    extracted.mooe,
    extracted.ps,
    extracted.co,
    extracted.total,
    extracted.cooperating_agencies,
  ];
  const scaledMeta = scaleMetadata(rawMeta);

  // 2. AI Score (0-100)
  const score = Math.round(predict(extracted.title, scaledMeta));

  // 3. Cluster profile
  const profile = classify(scaledMeta);

  // 4. Novelty / uniqueness check
  const titleVec = encodeTitle(extracted.title);
  const { noveltyScore, bestMatchTitle, bestMatchSimilarity } = checkUniqueness(titleVec);

  // 5. Build issues and suggestions (same logic as scan_pdf.py)
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Duplicate check
  if (noveltyScore < 20) {
    issues.push(`This proposal is very similar to an existing project: "${bestMatchTitle}" (${Math.round(bestMatchSimilarity * 100)}% match).`);
  }

  // Budget checks
  if (extracted.total > 0 && extracted.ps > extracted.total * 0.6) {
    const psPct = Math.round((extracted.ps / extracted.total) * 100);
    issues.push(`Personal Services (PS) budget is ${psPct}% of total (exceeds 60% threshold).`);
  } else if (extracted.total > 0 && extracted.ps > extracted.total * 0.5) {
    const psPct = Math.round((extracted.ps / extracted.total) * 100);
    suggestions.push(`PS budget is ${psPct}% (approaching the 60% limit). Consider redistributing.`);
  }

  // Duration check
  if (extracted.duration < 6) {
    issues.push(`Project duration is too short (${extracted.duration} months). Minimum recommended is 6 months.`);
  }

  // Agency check
  if (extracted.cooperating_agencies === 0) {
    suggestions.push("No cooperating agencies detected. Consider adding partner institutions to strengthen the proposal.");
  }

  // Title check
  const titleLower = extracted.title.toLowerCase();
  if (titleLower.includes("purchase") || titleLower.includes("procurement")) {
    issues.push("Title sounds like a procurement request rather than a research proposal.");
  }

  // Build similar papers list
  const similarPapers: { title: string; year: string }[] = [];
  if (bestMatchSimilarity > 0.5) {
    similarPapers.push({ title: bestMatchTitle, year: "N/A" });
  }

  // Determine validity
  const isValid = score >= 70 && noveltyScore >= 20;

  return {
    title: extracted.title || "AI Analysis Report",
    score,
    isValid,
    noveltyScore,
    keywords: [profile],
    similarPapers,
    issues,
    suggestions,
  };
}
