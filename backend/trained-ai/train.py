import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split 
import joblib

# --- CONFIGURATION ---
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# --- PART 1: GENERATE SYNTHETIC DATA ---
print("Generating dataset...")

def generate_data(n=2000):
    titles = []
    stats = [] # [duration, mooe, ps, co, total, agencies]
    labels = []
    
    # Vocabulary pools
    tech = ["AI", "Cloud", "IoT", "Automated", "System", "Platform", "Neural", "Smart"]
    agri = ["Hydroponic", "Crop", "Yield", "Soil", "Precision Farming", "Aqua"]
    social = ["Gender", "Development", "Community", "Policy", "Framework", "Livelihood"]
    bad = ["Purchase", "General", "Basic", "Simple", "Equipment", "Setup", "Procurement"]

    for _ in range(n):
        is_good = np.random.rand() > 0.4 
        
        # --- 1. Generate Title ---
        if is_good:
            base = [tech, agri, social][np.random.randint(0, 3)]
            t = f"{np.random.choice(base)} {np.random.choice(base)} {np.random.choice(['System', 'Analysis', 'Study', 'Application'])}"
        else:
            t = f"{np.random.choice(bad)} of {np.random.choice(['Laptops', 'Supplies', 'Materials', 'Vehicles'])}"

        # --- 2. Generate Stats ---
        if is_good:
            # Good Logic
            duration = np.random.randint(12, 36)
            cooperating_agencies = np.random.randint(0, 6) 
            
            # Healthy Percentages
            ps_pct = np.random.uniform(0.2, 0.5)
            mooe_pct = np.random.uniform(0.3, 0.6)
            co_pct = 1.0 - (ps_pct + mooe_pct)
            
        else:
            # Bad Logic
            duration = np.random.randint(1, 9)
            cooperating_agencies = np.random.randint(0, 3)
            
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

# --- PART 3: PREDICTIVE AI (KERAS) ---
print("Building Brain...")

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

# Text Input
text_input = keras.Input(shape=(1,), dtype=tf.string, name='text_input')
vectorizer = layers.TextVectorization(max_tokens=2000, output_mode='int')
vectorizer.adapt(titles)
x1 = layers.GlobalAveragePooling1D()(layers.Embedding(2001, 32)(vectorizer(text_input)))

# Stats Input (6 Features)
meta_input = keras.Input(shape=(6,), name='meta_input') 
x2 = layers.Dense(32, activation='relu')(meta_input)

# Merge
combined = layers.concatenate([x1, x2])
z = layers.Dense(32, activation='relu')(combined)
output = layers.Dense(1, activation='sigmoid')(z)

model = keras.Model(inputs=[text_input, meta_input], outputs=output)
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

print("Training...")

# --- TRAIN AND SAVE ---
history = model.fit(train_ds, validation_data=val_ds, epochs=12)

# Save Models
model.save(os.path.join(MODEL_DIR, "proposal_model.keras"))

# Save Vector DB Base
encoder = keras.Model(inputs=text_input, outputs=x1)
vecs = encoder.predict(tf.constant(titles, dtype=tf.string), batch_size=32)
with open(os.path.join(MODEL_DIR, "vector_db.json"), 'w') as f:
    json.dump({"titles": titles.tolist(), "vectors": vecs.tolist()}, f)

print("Training and Saving Complete.")