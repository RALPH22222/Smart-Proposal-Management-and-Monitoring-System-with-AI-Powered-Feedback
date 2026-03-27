// No-op shim: sharp is statically imported by @huggingface/transformers but
// never used in this Lambda (text/NLP only, no image processing).
export default function sharp() {
  throw new Error("sharp is not available (shim)");
}
