"""
One-time script: Export trained Keras model weights to JSON for TypeScript inference.

Run this locally with Python + TensorFlow installed:
    cd backend/trained-ai
    python export_weights.py

Outputs JSON files to ../src/ai-models/
"""

import os
import json
import numpy as np
import tensorflow as tf
import joblib

MODEL_DIR = "models"
OUTPUT_DIR = os.path.join("..", "src", "ai-models")
DATASET_FILE = "mock_dataset.json"

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading model...")
model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "proposal_model.keras"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
kmeans = joblib.load(os.path.join(MODEL_DIR, "kmeans_profiler.pkl"))

with open(os.path.join(MODEL_DIR, "cluster_descriptions.json"), "r") as f:
    cluster_descs = json.load(f)

# --- 1. Export TextVectorization vocabulary ---
print("Exporting vocabulary...")
vectorizer = None
for layer in model.layers:
    if isinstance(layer, tf.keras.layers.TextVectorization):
        vectorizer = layer
        break

if vectorizer is None:
    raise RuntimeError("TextVectorization layer not found in model")

vocab = vectorizer.get_vocabulary()
# vocab[0] = "" (padding), vocab[1] = "[UNK]", vocab[2..] = actual words
# Build word -> index mapping
vocab_map = {word: idx for idx, word in enumerate(vocab)}

with open(os.path.join(OUTPUT_DIR, "vocab.json"), "w") as f:
    json.dump(vocab_map, f)
print(f"   Vocabulary: {len(vocab)} tokens")

# --- 2. Export Embedding weights ---
print("Exporting embedding weights...")
embedding_layer = None
for layer in model.layers:
    if isinstance(layer, tf.keras.layers.Embedding):
        embedding_layer = layer
        break

if embedding_layer is None:
    raise RuntimeError("Embedding layer not found in model")

embedding_weights = embedding_layer.get_weights()[0]  # shape: (2001, 32)
with open(os.path.join(OUTPUT_DIR, "embedding.json"), "w") as f:
    json.dump(embedding_weights.tolist(), f)
print(f"   Embedding: {embedding_weights.shape}")

# --- 3. Export Dense layer weights ---
print("Exporting dense layer weights...")
dense_layers = []
for layer in model.layers:
    if isinstance(layer, tf.keras.layers.Dense):
        weights = layer.get_weights()  # [kernel, bias]
        dense_layers.append({
            "name": layer.name,
            "kernel": weights[0].tolist(),  # shape: (in, out)
            "bias": weights[1].tolist(),    # shape: (out,)
            "activation": layer.get_config().get("activation", "linear"),
        })
        print(f"   Dense '{layer.name}': kernel={weights[0].shape}, activation={layer.get_config().get('activation')}")

with open(os.path.join(OUTPUT_DIR, "dense_layers.json"), "w") as f:
    json.dump(dense_layers, f)

# --- 4. Export Scaler parameters ---
print("Exporting scaler...")
scaler_data = {
    "mean": scaler.mean_.tolist(),
    "scale": scaler.scale_.tolist(),
}
with open(os.path.join(OUTPUT_DIR, "scaler.json"), "w") as f:
    json.dump(scaler_data, f)
print(f"   Scaler: {len(scaler.mean_)} features")

# --- 5. Export KMeans centroids ---
print("Exporting kmeans...")
kmeans_data = {
    "centroids": kmeans.cluster_centers_.tolist(),
    "descriptions": cluster_descs,
}
with open(os.path.join(OUTPUT_DIR, "kmeans.json"), "w") as f:
    json.dump(kmeans_data, f)
print(f"   KMeans: {kmeans.cluster_centers_.shape[0]} clusters")

# --- 6. Export comparison database vectors ---
print("Exporting comparison database...")

# Setup encoder (same as scan_pdf.py)
text_input = model.input[0]
pool_layer = next(l for l in model.layers if isinstance(l, tf.keras.layers.GlobalAveragePooling1D))
encoder = tf.keras.Model(inputs=text_input, outputs=pool_layer.output)

# Load dataset and encode titles
with open(DATASET_FILE, "r") as f:
    dataset = json.load(f)

db_titles = [item["title"] for item in dataset]
print(f"   Encoding {len(db_titles)} titles...")
db_vecs = encoder.predict(tf.constant(db_titles, dtype=tf.string), batch_size=64, verbose=0)

comparison_db = {
    "titles": db_titles,
    "vectors": db_vecs.tolist(),
}
with open(os.path.join(OUTPUT_DIR, "comparison_db.json"), "w") as f:
    json.dump(comparison_db, f)
print(f"   Comparison DB: {len(db_titles)} titles, {db_vecs.shape[1]}-dim vectors")

print(f"\nAll files exported to {os.path.abspath(OUTPUT_DIR)}/")
print("Files:")
for fname in os.listdir(OUTPUT_DIR):
    fpath = os.path.join(OUTPUT_DIR, fname)
    size_kb = os.path.getsize(fpath) / 1024
    print(f"   {fname}: {size_kb:.1f} KB")
