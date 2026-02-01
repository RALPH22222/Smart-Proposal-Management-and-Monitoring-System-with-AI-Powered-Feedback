import os
import re
import json
import numpy as np
import tensorflow as tf
import joblib
from pypdf import PdfReader
from sklearn.metrics.pairwise import cosine_similarity

# --- CONFIGURATION ---
MODEL_DIR = "models"
PDF_FILE = "VAWC_CapsuleProposal-updated.pdf" 
DATASET_FILE = "mock_dataset.json"

print("Loading AI Models...")

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

    # 3. Load Comparison Database (Smart Fallback)
    # This prepares the list of titles we check against for duplicates.
    try:
        with open(DATASET_FILE, 'r') as f:
            dataset = json.load(f)
        db_titles = [item['title'] for item in dataset]
        print(f"   ...Comparison Mode: Real Dataset ({len(db_titles)} items)")
        
        # Pre-calculate vectors for the dataset
        db_vecs = encoder.predict(tf.constant(db_titles, dtype=tf.string), verbose=0)
        comparison_source = DATASET_FILE
        
    except FileNotFoundError:
        # Fallback to the generic training memory if mock_dataset.json is missing
        with open(os.path.join(MODEL_DIR, "vector_db.json"), 'r') as f:
            db = json.load(f)
            db_vecs = np.array(db['vectors'])
            db_titles = db['titles']
        print("   ...Comparison Mode: Training Database (Generic)")
        comparison_source = "Training DB"
        
    print("System Ready.\n")

except Exception as e:
    print(f"Error loading models: {e}")
    exit()

# --- PART 1: THE INTELLIGENT PARSER ---
def extract_data_from_pdf(pdf_path):
    print(f"Reading PDF: {pdf_path}...")
    
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
    except FileNotFoundError:
        print("File not found! Please ensure the PDF is in this folder.")
        return None

    data = {
        "title": "Unknown Project",
        "duration": 12, 
        "cooperating_agencies": 0,
        "total": 0.0,
        "mooe": 0.0,
        "ps": 0.0,
        "co": 0.0
    }

    # 1. Extract Title
    title_match = re.search(r"Project Title[:\s]+(.+)", text, re.IGNORECASE)
    if title_match:
        data["title"] = title_match.group(1).strip()

    # 2. Extract Duration
    month_label_match = re.search(r"\(In months\)\s*(\d+)", text, re.IGNORECASE)
    duration_label_match = re.search(r"Duration[:\s]+(\d+)", text, re.IGNORECASE)

    if month_label_match:
        data["duration"] = int(month_label_match.group(1))
    elif duration_label_match:
        val = int(duration_label_match.group(1))
        if val < 120: 
            data["duration"] = val

    # 3. Extract Cooperating Agencies
    agency_section = re.search(r"Cooperating Agencies.*?\n(.*?)(?=\n\(\d\)|$|Classification)", text, re.IGNORECASE | re.DOTALL)
    
    if agency_section:
        raw_agencies = agency_section.group(1).strip()
        if len(raw_agencies) > 3 and "N/A" not in raw_agencies:
            count = raw_agencies.count(",") + 1
            data["cooperating_agencies"] = count

    # 4. Extract Budget
    numbers = re.findall(r"([\d,]+\.\d{2})", text)
    
    if numbers:
        clean_nums = []
        for n in numbers:
            try:
                val = float(n.replace(",", "").strip())
                clean_nums.append(val)
            except:
                pass
        
        if clean_nums:
            data["total"] = max(clean_nums)
            
            if "PS" in text:
                ps_match = re.search(r"PS.*?([\d,]+\.\d{2})", text, re.DOTALL)
                if ps_match: 
                    val = float(ps_match.group(1).replace(",", ""))
                    if val < data["total"]: data["ps"] = val
            
            if "MOOE" in text:
                mooe_match = re.search(r"MOOE.*?([\d,]+\.\d{2})", text, re.DOTALL)
                if mooe_match: 
                    val = float(mooe_match.group(1).replace(",", ""))
                    if val < data["total"]: data["mooe"] = val
            
            if data["co"] == 0 and data["total"] > 0:
                remainder = data["total"] - (data["ps"] + data["mooe"])
                if remainder > 0: data["co"] = remainder

    return data

# --- PART 2: THE AI ANALYSIS ---
def analyze_pdf():
    extracted = extract_data_from_pdf(PDF_FILE)
    if not extracted: return

    print("\nDATA EXTRACTED FROM DOCUMENT:")
    print(f"   Title:    {extracted['title'][:60]}...")
    print(f"   Duration: {extracted['duration']} months")
    print(f"   Agencies: {extracted['cooperating_agencies']}")
    print(f"   Budget:   PHP {extracted['total']:,.2f}")
    
    # Prepare Data Vector
    stats = scaler.transform([[
        extracted['duration'], 
        extracted['mooe'], 
        extracted['ps'], 
        extracted['co'], 
        extracted['total'], 
        extracted['cooperating_agencies']
    ]])

    # 1. AI Score (The Math Check)
    score = model.predict({
        'text_input': tf.constant([extracted['title']], dtype=tf.string),
        'meta_input': stats
    }, verbose=0)[0][0] * 100
    
    # 2. Profile
    cluster_id = kmeans.predict(stats)[0]
    profile = cluster_descs.get(str(cluster_id), "Unknown")
    
    # 3. Uniqueness (The Duplicate Check)
    vec = encoder.predict(tf.constant([extracted['title']], dtype=tf.string), verbose=0)
    
    # Compare against all DB items
    sim_scores = cosine_similarity(vec, db_vecs)[0]
    
    # Find the single best match
    best_match_idx = np.argmax(sim_scores)
    max_sim = sim_scores[best_match_idx]
    
    # Novelty is the opposite of Similarity
    novelty = int((1 - max_sim) * 100)

    # --- FINAL REPORT ---
    print("\n" + "-"*50)
    print(f"ANALYSIS RESULTS")
    print("-" * 50)
    print(f"PROFILE:     {profile}")
    
    # LOGIC: Check Duplicates FIRST. If Duplicate, Reject immediately.
    if novelty < 20: # This means > 80% Similarity
        print(f"SCORE:       {int(score)}")
        print(f"UNIQUENESS:  {novelty}% (vs {comparison_source})")
        print("\nSTATUS: HIGH CHANGE OF BEING REJECTED")
        print("   This proposal is too similar to an existing project.")
        print(f"  Match Found: '{db_titles[best_match_idx]}'")

    elif score < 70:
        print(f"SCORE:       {int(score)}%")
        print(f"UNIQUENESS:  {novelty}% (vs {comparison_source})")
        print("\nSTATUS: WILL BE REJECTED PROBABLY")
        
        if extracted['ps'] > (extracted['total'] * 0.6):
            print("   • Salary (PS) budget is too high (>60%).")
        if extracted['duration'] < 6:
            print("   • Project duration is too short.")
        if extracted['cooperating_agencies'] == 0:
            print("   • No cooperating agencies (Solo Project).")
            
    else:
        print(f"SCORE:       {int(score)}%")
        print(f"UNIQUENESS:  {novelty}% (vs {comparison_source})")
        print("\nSTATUS: PASSED")
        print("   • Proposal is compliant and unique.")

    print("-" * 50)

if __name__ == "__main__":
    analyze_pdf()