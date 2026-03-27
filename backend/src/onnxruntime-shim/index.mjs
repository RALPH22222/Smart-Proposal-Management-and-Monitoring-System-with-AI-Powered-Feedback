// Shim: redirect onnxruntime-node → onnxruntime-web (WASM backend)
// onnxruntime-node contains 211MB of native Linux binaries that exceed Lambda's 250MB limit.
// onnxruntime-web provides the same InferenceSession API via WASM, which works on Lambda.
export * from "onnxruntime-web";
import * as ort from "onnxruntime-web";
export default ort;
