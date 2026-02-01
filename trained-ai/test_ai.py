import os
import json
import numpy as np
import tensorflow as tf
import joblib
from sklearn.metrics.pairwise import cosine_similarity

MODEL_DIR = "models"
DATASET_FILE = "mock_dataset.json" 

# Disable GPU logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

print("Loading AI Models and Dataset...")

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

    # 3. LOAD REAL DATASET
    with open(DATASET_FILE, 'r') as f:
        dataset = json.load(f)
    
    dataset_titles = [item['title'] for item in dataset]
    print(f"   ...Indexing {len(dataset_titles)} proposals...")
    dataset_vectors = encoder.predict(tf.constant(dataset_titles, dtype=tf.string), verbose=0)

    print("System Ready.\n")

except Exception as e:
    print(f"Error: {e}")
    exit()

def run_interactive_check():
    while True:
        print("="*60)
        print("PROPOSAL ANALYZER (Type 'exit' to quit)")
        print("-" * 60)
        
        # --- A. INPUT ---
        title = input("Project Title:         ")
        if title.lower() == 'exit': break
        
        try:
            duration = int(input("Duration (Months):     "))
            agencies = int(input("Agency Count:          "))
            
            # --- NEW INPUT STYLE: Components First ---
            print("\n--- BUDGET BREAKDOWN (PHP) ---")
            mooe_str = input("MOOE (Ops/Travel):     ")
            ps_str   = input("PS (Salaries):         ")
            co_str   = input("CO (Equipment):        ")
            
            # Convert to float
            mooe = float(mooe_str.replace(",", ""))
            ps = float(ps_str.replace(",", ""))
            co = float(co_str.replace(",", ""))
            
            # CALCULATE TOTAL AUTOMATICALLY
            total_budget = mooe + ps + co
            print(f"------------------------------")
            print(f"CALCULATED TOTAL:      PHP {total_budget:,.2f}")
            
        except ValueError:
            print("Error: Invalid number.")
            continue

        # --- B. PREPARE DATA ---
        stats = scaler.transform([[duration, mooe, ps, co, total_budget, agencies]])

        # --- C. RUN AI ANALYSIS ---
        print("\nComparing against dataset...")
        
        # 1. AI Score
        score = model.predict({
            'text_input': tf.constant([title], dtype=tf.string), 
            'meta_input': stats
        }, verbose=0)[0][0] * 100
        
        # 2. Cluster Profile
        cluster_id = kmeans.predict(stats)[0]
        profile = cluster_descs.get(str(cluster_id), "Unknown")
        
        # 3. Real Similarity Comparison
        new_vec = encoder.predict(tf.constant([title], dtype=tf.string), verbose=0)
        sim_scores = cosine_similarity(new_vec, dataset_vectors)[0]
        max_similarity = np.max(sim_scores)
        novelty = int((1 - max_similarity) * 100)

        # --- D. DISPLAY REPORT ---
        status = "HIGH CHANCE OF BEING ACCEPTED" if score >= 70 else "HIGH CHANGE OF BEING REJECTED"
        
        print("\n" + "-"*60)
        print(f"ANALYSIS RESULTS")
        print("-" * 60)
        print(f"   Title:    {title}")
        print(f"   AI Score: {int(score)}% ({status})")
        print(f"   Profile:  {profile}")
        print(f"   Uniqueness: {novelty}% (vs {DATASET_FILE})") 
        print("-" * 60)
        
        # E. RECOMMENDATION
        if max_similarity > 0.85:
            print("WARNING: DUPLICATE DETECTED")
            print("   * This proposal is over 85% similar to an existing project.")
        elif status == "REJECTED":
            print("RECOMMENDATION: REVISE")
            if agencies == 0: print("   * Add cooperating agencies.")
            if duration < 6: print("   * Increase project duration.")
            if ps > (total_budget * 0.6): print(f"   * Salary (PS) is too high ({int(ps/total_budget*100)}%). Reduce it.")
            if "Purchase" in title: print("   * Title sounds like procurement.")
        else:
            print("RECOMMENDATION: PROCEED")
            print("   * Proposal is compliant and unique.")

        print("\n")

if __name__ == "__main__":
    run_interactive_check()