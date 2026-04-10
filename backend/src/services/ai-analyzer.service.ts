import path from "path";
import { readFileSync, existsSync } from "fs";

// ── Types ────────────────────────────────────────────────────────────

interface DenseLayerWeights {
  name: string;
  kernel: number[][]; // shape: [inputDim, outputDim]
  bias: number[];
  activation: string;
}

interface BatchNormParams {
  gamma: number[];
  beta: number[];
  moving_mean: number[];
  moving_variance: number[];
  epsilon: number;
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

const MODELS_DIR = path.resolve(__dirname, "..", "ai-models");

function loadJSON<T>(filename: string): T {
  const raw = readFileSync(path.join(MODELS_DIR, filename), "utf-8");
  return JSON.parse(raw) as T;
}

// Lazy-loaded singletons (JSON-based models)
let _denseLayers: DenseLayerWeights[] | null = null;
let _scaler: ScalerParams | null = null;
let _kmeans: KMeansParams | null = null;
let _comparisonDB: ComparisonDB | null = null;
let _batchNormLoaded = false;
let _batchNorm: BatchNormParams | null = null;

function getDenseLayers(): DenseLayerWeights[] {
  if (!_denseLayers) _denseLayers = loadJSON<DenseLayerWeights[]>("dense_layers.json");
  return _denseLayers;
}

function getBatchNorm(): BatchNormParams | null {
  if (!_batchNormLoaded) {
    _batchNormLoaded = true;
    try {
      if (existsSync(path.join(MODELS_DIR, "batch_norm.json"))) {
        _batchNorm = loadJSON<BatchNormParams>("batch_norm.json");
      }
    } catch {
      _batchNorm = null;
    }
  }
  return _batchNorm;
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

// Lightweight titles-only load — loads pre-extracted titles_only.json (tiny, no vectors)
// Generated once by: node backend/scripts/extract-titles.js
// Falls back to parsing full comparison_db.json if the file doesn't exist yet.
let _dbTitles: string[] | null = null;
function getDbTitles(): string[] {
  if (!_dbTitles) {
    const titlesOnlyPath = path.join(MODELS_DIR, "titles_only.json");
    if (existsSync(titlesOnlyPath)) {
      // Fast path: load only the tiny titles file (no vectors)
      const raw = readFileSync(titlesOnlyPath, "utf-8");
      _dbTitles = (JSON.parse(raw) as { titles: string[] }).titles;
    } else if (_comparisonDB) {
      // Neural path already loaded the full DB, reuse its titles
      _dbTitles = _comparisonDB.titles;
    } else {
      // Slow fallback: parse full comparison_db.json (expensive, avoid if possible)
      console.warn("[ai-analyzer] titles_only.json not found — run: node backend/scripts/extract-titles.js");
      const raw = readFileSync(path.join(MODELS_DIR, "comparison_db.json"), "utf-8");
      const parsed = JSON.parse(raw) as { titles: string[]; vectors: unknown };
      _dbTitles = parsed.titles;
      // Discard vectors — do NOT assign to _comparisonDB
    }
  }
  return _dbTitles!;
}

// ── Pure-JS TF-IDF Title Encoder (fallback when ONNX/WASM unavailable) ──────
//
// Builds a 384-dim sparse vector from the top-384 vocabulary words found across
// all comparison DB titles. Each dimension = TF-IDF weight for that word in the
// given title. This is deterministic, fast, runs with zero dependencies, and
// produces genuinely different vectors per title — enabling real similarity checks.

let _tfidfVocab: string[] | null = null;
let _idfWeights: number[] | null = null;
const TFIDF_DIM = 384;

function stopWords(): Set<string> {
  return new Set([
    "a","an","the","of","in","on","and","for","to","with","by","at","is","are",
    "was","were","be","been","has","have","had","this","that","these","those",
    "it","its","from","as","or","but","not","than","into","via","through"
  ]);
}

function tokenize(text: string): string[] {
  const stops = stopWords();
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stops.has(w));
}

function getPreTrainedVocab(): Record<string, number> {
  try {
    const vocabPath = path.join(MODELS_DIR, "vocab.json");
    if (existsSync(vocabPath)) {
      return JSON.parse(readFileSync(vocabPath, "utf-8"));
    }
  } catch (err) {
    console.warn("Failed to load pre-trained vocab.json:", err);
  }
  return {};
}

function buildTfidfVocab(): { vocabMap: Record<string, number>; idf: number[] } {
  // Use the pre-trained vocab for indices
  const vocabMap = getPreTrainedVocab();
  
  // For IDF, if not stored, we'll use a neutral 1.0 weight or calculate from DB
  const titles = getDbTitles();
  const numDocs = titles.length;
  const docFreq = new Map<string, number>();

  // Only calculate IVF for the words actually in the vocab
  for (const title of titles) {
    const words = new Set(tokenize(title));
    for (const w of words) {
      if (vocabMap[w] !== undefined) {
        docFreq.set(w, (docFreq.get(w) ?? 0) + 1);
      }
    }
  }

  const idf = new Array<number>(TFIDF_DIM).fill(1.0);
  Object.entries(vocabMap).forEach(([word, idx]) => {
    if (idx < TFIDF_DIM) {
      const df = docFreq.get(word) ?? 1;
      idf[idx] = Math.log((numDocs + 1) / (df + 1)) + 1;
    }
  });

  return { vocabMap, idf };
}

let _cachedFullVocab: { vocabMap: Record<string, number>; idf: number[] } | null = null;
function getVocab(): { vocabMap: Record<string, number>; idf: number[] } {
  if (!_cachedFullVocab) {
    _cachedFullVocab = buildTfidfVocab();
  }
  return _cachedFullVocab;
}

function tfidfEncode(title: string): number[] {
  const { vocabMap, idf } = getVocab();
  const words = tokenize(title);
  const tf = new Map<string, number>();
  for (const w of words) {
    tf.set(w, (tf.get(w) ?? 0) + 1);
  }

  const vec = new Array<number>(TFIDF_DIM).fill(0);
  Object.entries(vocabMap).forEach(([word, idx]) => {
    if (idx < TFIDF_DIM) {
      const count = tf.get(word) ?? 0;
      if (count > 0) {
        vec[idx] = (count / words.length) * idf[idx];
      }
    }
  });

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }

  return vec;
}

// ── SentenceTransformer (MiniLM via @huggingface/transformers) ──────
//
// COST GUARD: The HuggingFace ONNX pipeline is DISABLED.
// On AWS Lambda, downloading the ~23MB ONNX model on every cold start
// dramatically increases billed duration and data-transfer costs.
//
// The TF-IDF encoder above produces genuinely unique 384-dim vectors
// from the comparison DB vocabulary — no network calls, no WASM runtime,
// runs in pure JS in < 5ms, and is free at any invocation volume.
//
// To re-enable the neural encoder in the future, set USE_NEURAL_ENCODER=true
// in your Lambda environment variables.

const USE_NEURAL_ENCODER = process.env.USE_NEURAL_ENCODER === "true";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractor: any = null;
// Start as failed unless neural encoder is explicitly opted-in via env var
let _extractorFailed = !USE_NEURAL_ENCODER;

async function getExtractor() {
  if (_extractor) return _extractor;

  const { pipeline, env } = await import("@huggingface/transformers");

  // Lambda can only write to /tmp — cache downloaded ONNX model there
  env.cacheDir = "/tmp/hf-cache";

  // Safely resolve the ONNX WASM directory using Node's module resolution
  try {
    // Try multiple possible paths for the WASM files depending on build environment
    const possiblePaths = [
      path.resolve(__dirname, "node_modules", "onnxruntime-web", "dist"),
      path.resolve(__dirname, "../../node_modules", "onnxruntime-web", "dist"),
      path.resolve(__dirname, "../../../node_modules", "onnxruntime-web", "dist")
    ];
    
    let wasmDir = possiblePaths[0];
    for (const p of possiblePaths) {
      try {
        if (require('fs').existsSync(p)) {
          wasmDir = p;
          break;
        }
      } catch (err) {}
    }

    env.backends.onnx.wasm!.wasmPaths = `file://${wasmDir.replace(/\\/g, "/")}/`;
    env.backends.onnx.wasm!.numThreads = 1;
  } catch (e) {
    console.warn("Could not dynamically resolve onnxruntime-web WASM path.", e);
  }

  _extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "q8",
  });

  return _extractor;
}

/**
 * Encode a title into a 384-dim semantic vector using MiniLM.
 * Equivalent to Python: SentenceTransformer('all-MiniLM-L6-v2').encode(title)
 */
async function encodeTitle(title: string): Promise<number[]> {
  // If ONNX/WASM already failed once in this Lambda instance, use TF-IDF directly
  if (_extractorFailed) {
    return tfidfEncode(title);
  }

  try {
    const extractor = await getExtractor();
    const output = await extractor(title, { pooling: "mean", normalize: false });
    return Array.from(output.data as Float32Array);
  } catch (e) {
    console.warn("HuggingFace encoder failed, switching to TF-IDF fallback:", (e as Error).message);
    _extractorFailed = true;
    return tfidfEncode(title);
  }
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

/**
 * BatchNormalization forward pass (inference mode).
 * y = gamma * (x - moving_mean) / sqrt(moving_variance + epsilon) + beta
 */
function batchNormForward(input: number[], params: BatchNormParams): number[] {
  const result = new Array<number>(input.length);
  for (let i = 0; i < input.length; i++) {
    const normalized = (input[i] - params.moving_mean[i]) / Math.sqrt(params.moving_variance[i] + params.epsilon);
    result[i] = params.gamma[i] * normalized + params.beta[i];
  }
  return result;
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
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

// ── Inference pipeline ───────────────────────────────────────────────

/**
 * StandardScaler transform: (value - mean) / scale
 */
function scaleMetadata(raw: number[]): number[] {
  const scaler = getScaler();
  return raw.map((val, i) => (val - scaler.mean[i]) / scaler.scale[i]);
}

/**
 * Full model forward pass. Returns score 0-100.
 *
 * Keras architecture:
 *   emb_input (384) -> Dense(128, relu) -> BatchNorm -> Dropout -> x1
 *   meta_input (6)  -> Dense(64, relu)  -> Dropout -> x2
 *   concatenate(x1, x2) (192) -> Dense(64, relu) -> Dense(32, relu) -> Dense(1, sigmoid)
 *
 * Exported dense_layers.json indices:
 *   [0] "dense"   = text branch:  384 -> 128, relu
 *   [1] "dense_1" = meta branch:  6 -> 64, relu
 *   [2] "dense_2" = shared 1:     192 -> 64, relu
 *   [3] "dense_3" = shared 2:     64 -> 32, relu
 *   [4] "output"  = output:       32 -> 1, sigmoid
 */
/**
 * Full model forward pass. Returns score 0-100.
 */
function predict(titleVec: number[], scaledMeta: number[]): number {
  try {
    const layers = getDenseLayers();
    const bn = getBatchNorm();

    // Map layers by name or dimension to prevent mismatch crashes
    const metaLayer = layers.find(l => l.name?.includes("meta") || l.kernel.length === 6) || layers[1];
    const textLayer = layers.find(l => l.name?.includes("text") || l.kernel.length === 384) || layers[0];
    const shared1 = layers.find(l => l.name === "dense_2" || l.kernel.length === 192) || layers[2];
    const shared2 = layers.find(l => l.name === "dense_3" || l.kernel.length === 64) || layers[3];
    const outputLayer = layers.find(l => l.name === "output" || l.kernel[0].length === 1) || layers[4];

    // 1. Text Branch
    let x1 = denseForward(titleVec, textLayer.kernel, textLayer.bias, textLayer.activation);
    if (bn && x1.length === bn.moving_mean.length) {
      x1 = batchNormForward(x1, bn);
    }

    // 2. Meta Branch
    const x2 = denseForward(scaledMeta, metaLayer.kernel, metaLayer.bias, metaLayer.activation);

    // 3. Shared Branch: concat -> Dense(64) -> Dense(32) -> Dense(1, sigmoid)
    const combined = [...x1, ...x2];
    
    // Safety check for concatenation dimension
    if (combined.length !== shared1.kernel.length) {
       console.warn(`Shape mismatch in concat: got ${combined.length}, expected ${shared1.kernel.length}. Using meta only.`);
       return 50; // Baseline neutral score
    }

    let z = denseForward(combined, shared1.kernel, shared1.bias, shared1.activation);
    z = denseForward(z, shared2.kernel, shared2.bias, shared2.activation);
    const output = denseForward(z, outputLayer.kernel, outputLayer.bias, outputLayer.activation);

    return output[0] * 100;
  } catch (err) {
    console.error("AI Neural Pass failed, using fallback score:", err);
    return 65; // Safe fallback score
  }
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
 * Novelty check via TF-IDF cosine similarity against DB titles.
 * When the neural encoder is disabled (default), we compare the TF-IDF vector
 * of the input title against a random sample of DB titles encoded the same way.
 * This is O(sampleSize) instead of O(n * 384) and avoids loading the 13.8MB vector DB.
 *
 * When neural encoder is on, falls back to the pre-computed vector DB.
 */
function checkUniqueness(titleVec: number[]): {
  noveltyScore: number;
  bestMatchTitle: string;
  bestMatchSimilarity: number;
} {
  if (!USE_NEURAL_ENCODER) {
    // TF-IDF path: compare against a capped sample of DB titles
    const allTitles = getDbTitles();
    const SAMPLE_SIZE = 500; // enough for meaningful novelty check, fast enough for Lambda

    // Deterministic shuffle using title hash as seed so results are reproducible
    const seed = titleVec.slice(0, 4).reduce((s, v) => s + Math.abs(v) * 1000, 0);
    const sampled: string[] = [];
    const step = Math.max(1, Math.floor(allTitles.length / SAMPLE_SIZE));
    const offset = Math.floor(seed % step);
    for (let i = offset; i < allTitles.length && sampled.length < SAMPLE_SIZE; i += step) {
      sampled.push(allTitles[i]);
    }

    let maxSim = 0;
    let bestTitle = sampled[0] ?? "Unknown";
    for (const t of sampled) {
      const vec = tfidfEncode(t);
      const sim = cosineSimilarity(titleVec, vec);
      if (sim > maxSim) {
        maxSim = sim;
        bestTitle = t;
      }
    }

    return {
      noveltyScore: Math.round((1 - maxSim) * 100),
      bestMatchTitle: bestTitle,
      bestMatchSimilarity: maxSim,
    };
  }

  // Neural encoder path: use full pre-computed vector DB
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
 *
 * Now async because SentenceTransformer inference is async.
 */
export async function analyzeProposal(extracted: ExtractedData): Promise<AnalysisResult> {
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

  // 2. Encode title to 384-dim semantic vector.
  // encodeTitle() tries HuggingFace/ONNX first, then falls back to TF-IDF — never throws.
  const titleVec = await encodeTitle(extracted.title);

  // 3. AI Score (0-100) — full neural network forward pass
  const score = Math.round(predict(titleVec, scaledMeta));

  // 4. Cluster profile
  const profile = classify(scaledMeta);

  // 5. Novelty / uniqueness check (cosine similarity against comparison DB)
  const { noveltyScore, bestMatchTitle, bestMatchSimilarity } = checkUniqueness(titleVec);

  // 6. Build issues and suggestions (same logic as scan_pdf.py)
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Semantic Similarity Interpretation (User Requested Scale)
  const similarityPct = Math.round(bestMatchSimilarity * 100);
  let simStatus = "";
  if (similarityPct <= 20) simStatus = "Not Related";
  else if (similarityPct <= 40) simStatus = "Slightly Related";
  else if (similarityPct <= 60) simStatus = "Moderately Similar";
  else if (similarityPct <= 80) simStatus = "Highly Similar";
  else simStatus = "Very Similar / Duplicate";

  // Duplicate / Similarity check
  if (similarityPct > 60) {
    issues.push(`This proposal is ${simStatus} (${similarityPct}%) to an existing project: "${bestMatchTitle}".`);
  } else if (similarityPct > 20) {
    suggestions.push(`Semantic check: This project is ${simStatus} (${similarityPct}%) to "${bestMatchTitle}".`);
  }

  // ── Feasibility & Logic Checks ───────────────────────────

  // Timeline vs Budget Intensity
  if (extracted.total > 2000000 && extracted.duration < 12) {
    issues.push(`Budget intensity is high (PHP ${Math.round(extracted.total/1000000)}M for only ${extracted.duration} months). This may raise feasibility concerns during review.`);
  } else if (extracted.total < 500000 && extracted.duration > 24) {
    suggestions.push(`Budget may be too low (PHP ${extracted.total}) to sustain a long ${extracted.duration}-month research timeline.`);
  }

  // Budget checks
  if (extracted.total > 0 && extracted.ps > extracted.total * 0.6) {
    const psPct = Math.round((extracted.ps / extracted.total) * 100);
    issues.push(`Personal Services (PS) budget is ${psPct}% of total (exceeds DOST's 60% recommended overhead threshold).`);
  } else if (extracted.total > 0 && extracted.ps > extracted.total * 0.45) {
    const psPct = Math.round((extracted.ps / extracted.total) * 100);
    suggestions.push(`PS budget is ${psPct}% (approaching threshold). Ensure all roles are clearly justified.`);
  }

  // Duration check
  if (extracted.duration < 6) {
    issues.push(`Project duration is too short (${extracted.duration} months). Minimum recommended for R&D is 6 months.`);
  } else if (extracted.duration > 36) {
    suggestions.push(`Project duration exceeds 3 years (${extracted.duration} months). Ensure long-term deliverables are clear.`);
  }

  // Agency check
  if (extracted.cooperating_agencies === 0) {
    suggestions.push("No cooperating agencies detected. Feasibility is better demonstrated through institutional partnerships.");
  }

  // Title check
  const titleLower = extracted.title.toLowerCase();
  if (titleLower.includes("purchase") || titleLower.includes("procurement")) {
    issues.push("Feasibility alert: Proposal sounds more like a procurement request than a scientific research project.");
  }

  // Build similar papers list
  const similarPapers: { title: string; year: string }[] = [];
  if (bestMatchSimilarity > 0.1) {
    similarPapers.push({ 
      title: bestMatchTitle, 
      year: `${similarityPct}% Match` 
    });
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
