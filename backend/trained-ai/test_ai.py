import os
import re
import json
import numpy as np
import tensorflow as tf
import joblib
from pypdf import PdfReader
import docx
import docx2txt
from sklearn.metrics.pairwise import cosine_similarity

# --- CONFIGURATION ---
MODEL_DIR = "models"
DATASET_FILE = "mock_dataset.json" 

# Disable GPU logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

print("="*60)
print("AI SYSTEM TEST SUITE: SEMANTIC & MULTI-FORMAT")
print("="*60)

try:
    # 1. Load Brains
    model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "proposal_model.keras"))
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    kmeans = joblib.load(os.path.join(MODEL_DIR, "kmeans_profiler.pkl"))
    
    with open(os.path.join(MODEL_DIR, "cluster_descriptions.json"), 'r') as f:
        cluster_descs = json.load(f)
        
    # 2. Setup Encoder
    text_input = model.input[0]
    pool_layer = next(l for l in model.layers if isinstance(l, tf.keras.layers.GlobalAveragePooling1D))
    encoder = tf.keras.Model(inputs=text_input, outputs=pool_layer.output)

    # 3. Load Comparison Dataset
    if os.path.exists(DATASET_FILE):
        with open(DATASET_FILE, 'r') as f:
            dataset = json.load(f)
        db_titles = [item['title'] for item in dataset]
        db_vectors = encoder.predict(tf.constant(db_titles, dtype=tf.string), verbose=0)
        source_name = "Real Dataset"
    else:
        with open(os.path.join(MODEL_DIR, "vector_db.json"), 'r') as f:
            db = json.load(f)
            db_vectors = np.array(db['vectors'])
            db_titles = db['titles']
        source_name = "Training DB"

    print(f"System Ready. Comparison Source: {source_name} ({len(db_titles)} items)\n")

except Exception as e:
    print(f"Error initializing: {e}")
    exit()

# --- UTILITY: DOCUMENT PARSING (Sync with scan_pdf.py) ---
def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            return "\n".join([p.extract_text() for p in reader.pages])
        elif ext == ".docx":
            doc = docx.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        elif ext == ".doc":
            return docx2txt.process(file_path)
    except Exception as e:
        return f"Error: {e}"
    return "Unsupported format."

def parse_data_from_text(text):
    data = {"title": "Unknown", "duration": 12, "agencies": 0, "total": 0.0, "ps": 0.0, "mooe": 0.0, "co": 0.0}
    # Title
    t_match = re.search(r"(?:Project Title|Title|Name)[:\s]+(.+)", text, re.IGNORECASE)
    if t_match: data["title"] = t_match.group(1).strip()
    # Duration
    d_match = re.search(r"(?:Duration|months)[:\s]+(\d+)", text, re.IGNORECASE)
    if d_match: data["duration"] = int(d_match.group(1))
    # Budget
    nums = re.findall(r"([\d,]+\.\d{2})", text)
    if nums:
        vals = [float(n.replace(",", "")) for n in nums]
        data["total"] = max(vals)
        # Simple extraction for components
        ps = re.search(r"PS.*?([\d,]+\.\d{2})", text, re.DOTALL)
        if ps: data["ps"] = float(ps.group(1).replace(",", ""))
        mooe = re.search(r"MOOE.*?([\d,]+\.\d{2})", text, re.DOTALL)
        if mooe: data["mooe"] = float(mooe.group(1).replace(",", ""))
        data["co"] = data["total"] - (data["ps"] + data["mooe"])
    return data

# --- TESTING MODES ---

def test_semantic_equivalence():
    print("\n--- SEMANTIC EQUIVALENCE TEST ---")
    print("Test if the AI understands different phrasing for the same idea.")
    t1 = input("Original Title:   ")
    t2 = input("Paraphrased Title: ")
    
    vec1 = encoder.predict(tf.constant([t1], dtype=tf.string), verbose=0)
    vec2 = encoder.predict(tf.constant([t2], dtype=tf.string), verbose=0)
    
    similarity = cosine_similarity(vec1, vec2)[0][0]
    percentage = int(similarity * 100)
    
    print("-" * 40)
    print(f"SEMANTIC MATCH: {percentage}%")
    if percentage > 80:
        print("RESULT: EQUIVALENT (Would be flagged as duplicate)")
    elif percentage > 60:
        print("RESULT: SIMILAR (Worth investigating)")
    else:
        print("RESULT: UNIQUE (Distinct concepts)")
    print("-" * 40)

def test_document_scan():
    print("\n--- MULTI-FORMAT DOCUMENT SCAN TEST ---")
    path = input("Enter file path (.pdf, .docx, .doc): ")
    if not os.path.exists(path):
        print("File not found.")
        return
        
    print(f"Reading {os.path.basename(path)}...")
    text = extract_text(path)
    data = parse_data_from_text(text)
    
    print("\nEXTRACTED DATA:")
    print(f"   Title:    {data['title']}")
    print(f"   Budget:   PHP {data['total']:,.2f}")
    
    # Analysis
    stats = scaler.transform([[data['duration'], data['mooe'], data['ps'], data['co'], data['total'], data['agencies']]])
    score = model.predict({'text_input': tf.constant([data['title']], dtype=tf.string), 'meta_input': stats}, verbose=0)[0][0] * 100
    
    vec = encoder.predict(tf.constant([data['title']], dtype=tf.string), verbose=0)
    sims = cosine_similarity(vec, db_vectors)[0]
    best_idx = np.argmax(sims)
    max_sim = sims[best_idx]
    
    print("-" * 40)
    print(f"SCORE:     {int(score)}%")
    print(f"UNIQUENESS:{int((1-max_sim)*100)}%")
    if max_sim > 0.75:
        print(f"DUPLICATE FOUND: \"{db_titles[best_idx]}\"")
    print("-" * 40)

def test_uniqueness_against_dataset():
    print("\n--- UNIQUENESS CHECK (TITLE VS DATASET) ---")
    print("Check if a single title mimics any existing project in the dataset.")
    title = input("Enter Title to Check: ")
    if not title: return
    
    # 1. Prediction Score
    vec = encoder.predict(tf.constant([title], dtype=tf.string), verbose=0)
    
    # 2. Similarity Comparison
    sim_scores = cosine_similarity(vec, db_vectors)[0]
    best_idx = np.argmax(sim_scores)
    max_sim = sim_scores[best_idx]
    percentage = int(max_sim * 100)
    
    print("\n" + "-" * 60)
    print(f"SEARCH TITLE: \"{title}\"")
    print(f"BEST MATCH:   \"{db_titles[best_idx]}\"")
    print(f"SIMILARITY:   {percentage}% Match")
    print("-" * 60)
    
    if percentage > 80:
        print("RESULT: CRITICAL MATCH - This proposal is too similar to existing work.")
    elif percentage > 60:
        print("RESULT: MODERATE MATCH - Consider rephrasing or clarifying novelty.")
    else:
        print("RESULT: UNIQUE - No similar projects found in records.")
    print("-" * 60)

def interactive_mode():
    while True:
        print("\n--- INTERACTIVE BUDGET ANALYZER ---")
        title = input("Title (or 'back'): ")
        if title.lower() == 'back': break
        
        try:
            mooe = float(input("MOOE: ").replace(",", ""))
            ps = float(input("PS:   ").replace(",", ""))
            total = mooe + ps
            stats = scaler.transform([[12, mooe, ps, 0, total, 1]])
            score = model.predict({'text_input': tf.constant([title], dtype=tf.string), 'meta_input': stats}, verbose=0)[0][0] * 100
            print(f"RESULT: {int(score)}% Score")
        except: print("Invalid input.")

# --- MAIN MENU ---
if __name__ == "__main__":
    while True:
        print("\nCHOOSE TEST MODE:")
        print("1. Semantic Equivalence Check (Title A vs Title B)")
        print("2. Multi-Format Document Scan (.pdf, .docx, .doc)")
        print("3. Uniqueness Check (Single Title vs Dataset)")
        print("4. Manual Interactive Entry")
        print("5. Exit")
        
        choice = input("\nChoice: ")
        
        if choice == '1': test_semantic_equivalence()
        elif choice == '2': test_document_scan()
        elif choice == '3': test_uniqueness_against_dataset()
        elif choice == '4': interactive_mode()
        elif choice == '5': break
        else: print("Invalid choice.")