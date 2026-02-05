import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split 
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib

# --- CONFIGURATION ---
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# --- PART 1: GENERATE SYNTHETIC DATA WITH SEMANTIC VARIATIONS ---
print("Generating dataset with semantic variations...")

def generate_data(n=3000):
    titles = []
    stats = [] # [duration, mooe, ps, co, total, agencies]
    labels = []
    
    # Enhanced vocabulary pools with synonyms and variations
    tech_base = ["AI", "Artificial Intelligence", "Machine Learning", "Deep Learning", "Neural Network"]
    tech_apps = ["System", "Platform", "Framework", "Application", "Tool", "Solution"]
    tech_verbs = ["Development", "Implementation", "Design", "Creation", "Building"]
    
    agri_base = ["Hydroponic", "Crop", "Agricultural", "Farming", "Cultivation"]
    agri_focus = ["Yield", "Production", "Growth", "Harvest", "Optimization"]
    agri_tech = ["Precision", "Smart", "Automated", "IoT-based", "Data-driven"]
    
    social_base = ["Gender", "Community", "Social", "Cultural", "Economic"]
    social_focus = ["Development", "Empowerment", "Policy", "Framework", "Program"]
    social_impact = ["Livelihood", "Welfare", "Equity", "Inclusion", "Sustainability"]
    
    bad_keywords = ["Purchase", "Procurement", "Acquisition", "Buying"]
    bad_items = ["Laptops", "Computers", "Equipment", "Supplies", "Materials", "Vehicles", "Furniture"]

    for _ in range(n):
        is_good = np.random.rand() > 0.35 
        
        # --- 1. Generate Title with Semantic Variations ---
        if is_good:
            category = np.random.choice(['tech', 'agri', 'social'])
            
            if category == 'tech':
                base = np.random.choice(tech_base)
                app = np.random.choice(tech_apps)
                verb = np.random.choice(tech_verbs)
                # Create variations: "AI System Development", "Development of AI Platform", etc.
                patterns = [
                    f"{base} {app} {verb}",
                    f"{verb} of {base}-based {app}",
                    f"{base} for {app} {verb}",
                    f"Innovative {base} {app}"
                ]
                t = np.random.choice(patterns)
                
            elif category == 'agri':
                base = np.random.choice(agri_base)
                focus = np.random.choice(agri_focus)
                tech = np.random.choice(agri_tech)
                patterns = [
                    f"{tech} {base} for {focus}",
                    f"{base} {focus} using {tech} Technology",
                    f"{focus} Enhancement through {base}",
                    f"{tech} Approach to {base} {focus}"
                ]
                t = np.random.choice(patterns)
                
            else:  # social
                base = np.random.choice(social_base)
                focus = np.random.choice(social_focus)
                impact = np.random.choice(social_impact)
                patterns = [
                    f"{base} {focus} for {impact}",
                    f"{impact} through {base}-focused {focus}",
                    f"{focus} Framework for {base} {impact}",
                    f"Strengthening {base} {impact}"
                ]
                t = np.random.choice(patterns)
        else:
            # Bad proposals - procurement focused
            keyword = np.random.choice(bad_keywords)
            item = np.random.choice(bad_items)
            patterns = [
                f"{keyword} of {item}",
                f"{item} {keyword}",
                f"{keyword} and Installation of {item}",
                f"General {keyword} of {item}"
            ]
            t = np.random.choice(patterns)

        # --- 2. Generate Stats ---
        if is_good:
            # Good Logic
            duration = np.random.randint(12, 36)
            cooperating_agencies = np.random.randint(1, 6) 
            
            # Healthy Percentages
            ps_pct = np.random.uniform(0.2, 0.5)
            mooe_pct = np.random.uniform(0.3, 0.6)
            co_pct = 1.0 - (ps_pct + mooe_pct)
            
        else:
            # Bad Logic
            duration = np.random.randint(1, 9)
            cooperating_agencies = np.random.randint(0, 2)
            
            # Unhealthy Percentages (Salary Hoarding or Shopping Spree)
            if np.random.rand() > 0.5:
                ps_pct = np.random.uniform(0.7, 0.9)
                mooe_pct = np.random.uniform(0.05, 0.1)
                co_pct = 1.0 - (ps_pct + mooe_pct)
            else:
                co_pct = np.random.uniform(0.8, 1.0)
                ps_pct = 0.0
                mooe_pct = 0.0

        # --- Calculate Total from Components ---
        base_budget = np.random.randint(500000, 5000000)
        
        ps = int(base_budget * ps_pct)
        mooe = int(base_budget * mooe_pct)
        co = int(base_budget * co_pct)
        
        # Total is exactly the sum of inputs
        total = ps + mooe + co

        titles.append(t)
        stats.append([duration, mooe, ps, co, total, cooperating_agencies])
        labels.append(1 if is_good else 0)

    return np.array(titles), np.array(stats), np.array(labels)

titles, meta_data, labels = generate_data()

# --- PREPROCESSING ---
scaler = StandardScaler()
meta_data_scaled = scaler.fit_transform(meta_data)
joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))

# --- PART 2: DESCRIPTIVE AI (CLUSTERING) ---
print("Training Profiler...")
kmeans = KMeans(n_clusters=4, random_state=42)
kmeans.fit(meta_data_scaled)
joblib.dump(kmeans, os.path.join(MODEL_DIR, "kmeans_profiler.pkl"))

# Update Cluster Descriptions
cluster_descriptions = {}
centers = scaler.inverse_transform(kmeans.cluster_centers_)
for i, center in enumerate(centers):
    # center = [duration, mooe, ps, co, total, agencies]
    dur, mooe, ps, co, total, agencies = center
    
    desc = "Standard R&D Project"
    
    if ps > (total * 0.6): 
        desc = "High-Salary / Overhead Heavy" 
    elif agencies < 1: 
        desc = "Independent / Solo Research" 
    elif total > 3000000 and agencies > 2: 
        desc = "Large-Scale Collaborative Grant"
    elif dur < 10: 
        desc = "Short-Term / Quick Study"
    
    cluster_descriptions[str(i)] = desc
    print(f"   Cluster {i}: {desc}")

with open(os.path.join(MODEL_DIR, "cluster_descriptions.json"), 'w') as f:
    json.dump(cluster_descriptions, f)

# --- PART 3: ENHANCED TEXT VECTORIZATION ---
print("Creating TF-IDF Vectorizer for semantic understanding...")

# Use TF-IDF to capture semantic meaning beyond exact word matching
tfidf = TfidfVectorizer(
    max_features=2000,
    ngram_range=(1, 3),  # Capture 1-3 word phrases
    min_df=2,  # Ignore very rare terms
    stop_words='english'  # Remove common words
)
tfidf.fit(titles)

# Save TF-IDF vocabulary for later use
vocab_dict = {word: int(idx) for word, idx in tfidf.vocabulary_.items()}
with open(os.path.join(MODEL_DIR, "tfidf_vocab.json"), 'w') as f:
    json.dump(vocab_dict, f)

# --- PART 4: PREDICTIVE AI (KERAS WITH IMPROVED ARCHITECTURE) ---
print("Building Enhanced Neural Network...")

# 1. SPLIT DATA MANUALLY (80% Train, 20% Val)
X_text_train, X_text_val, X_meta_train, X_meta_val, y_train, y_val = train_test_split(
    titles, meta_data_scaled, labels, test_size=0.2, random_state=42
)

def make_dataset(t, m, l, batch_size=32):
    return tf.data.Dataset.from_tensor_slices((
        {'text_input': tf.constant(t, dtype=tf.string), 'meta_input': tf.constant(m, dtype=tf.float32)},
        tf.constant(l, dtype=tf.float32)
    )).batch(batch_size)

# Create TWO datasets
train_ds = make_dataset(X_text_train, X_meta_train, y_train)
val_ds = make_dataset(X_text_val, X_meta_val, y_val)

# Text Input with improved vectorization
text_input = keras.Input(shape=(1,), dtype=tf.string, name='text_input')
vectorizer = layers.TextVectorization(
    max_tokens=2000, 
    output_mode='int',
    ngrams=2,  # Capture bi-grams for better semantic understanding
    output_sequence_length=50  # Fixed length for consistency
)
vectorizer.adapt(titles)

# Enhanced embedding with more dimensions for better semantic capture
x1 = layers.Embedding(2001, 64, mask_zero=True)(vectorizer(text_input))
x1 = layers.GlobalAveragePooling1D()(x1)
x1 = layers.Dense(32, activation='relu')(x1)  # Additional dense layer for text

# Stats Input (6 Features)
meta_input = keras.Input(shape=(6,), name='meta_input') 
x2 = layers.Dense(32, activation='relu')(meta_input)
x2 = layers.Dropout(0.3)(x2)  # Add dropout to prevent overfitting

# Merge with attention to both branches
combined = layers.concatenate([x1, x2])
z = layers.Dense(64, activation='relu')(combined)
z = layers.Dropout(0.3)(z)
z = layers.Dense(32, activation='relu')(z)
output = layers.Dense(1, activation='sigmoid')(z)

model = keras.Model(inputs=[text_input, meta_input], outputs=output)
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy', 
    metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
)

print("Training Enhanced Model...")

# --- TRAIN AND SAVE ---
history = model.fit(
    train_ds, 
    validation_data=val_ds, 
    epochs=15,
    callbacks=[
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    ]
)

# Save Models
model.save(os.path.join(MODEL_DIR, "proposal_model.keras"))

# Save Vector DB Base with semantic embeddings
encoder = keras.Model(inputs=text_input, outputs=x1)
vecs = encoder.predict(tf.constant(titles, dtype=tf.string), batch_size=32)
with open(os.path.join(MODEL_DIR, "vector_db.json"), 'w') as f:
    json.dump({"titles": titles.tolist(), "vectors": vecs.tolist()}, f)

print("\n" + "="*60)
print("Training Complete!")
print("="*60)
print(f"Final Training Accuracy: {history.history['accuracy'][-1]:.4f}")
print(f"Final Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
print(f"Model saved to: {os.path.join(MODEL_DIR, 'proposal_model.keras')}")
print("="*60)
