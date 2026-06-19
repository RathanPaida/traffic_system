# backend/train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("Loading data...")
# Make sure your CSV is inside the backend/data/ folder
df = pd.read_csv('data/Astram event data_anonymized.csv')

print("Cleaning & Upgrading features...")
# Convert to datetime objects
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['end_datetime'] = pd.to_datetime(df['end_datetime'], errors='coerce')

# Calculate duration in minutes
df['duration_minutes'] = (df['end_datetime'] - df['start_datetime']).dt.total_seconds() / 60

# Drop rows that are missing critical data
df = df.dropna(subset=['duration_minutes', 'latitude', 'longitude'])

# 🚨 OUTLIER FIX: Remove impossible administrative errors 🚨
# Only keep events that took between 2 minutes and 12 hours (720 minutes)
df = df[(df['duration_minutes'] >= 2) & (df['duration_minutes'] <= 720)]

# Extract Temporal features
df['hour'] = df['start_datetime'].dt.hour
df['day_of_week'] = df['start_datetime'].dt.dayofweek

# Convert boolean road closure to integer (True = 1, False = 0)
df['requires_road_closure'] = df['requires_road_closure'].astype(bool).astype(int)

# Create Encoders for text-based categorical columns
encoders = {}
categorical_cols = ['event_cause', 'priority', 'veh_type']

for col in categorical_cols:
    le = LabelEncoder()
    # Fill empty text with 'Unknown' so the model doesn't crash on blank cells
    df[col] = df[col].fillna('Unknown').astype(str)
    df[f'{col}_encoded'] = le.fit_transform(df[col])
    encoders[col] = le

# Select the upgraded features for the AI to learn from
features = ['latitude', 'longitude', 'hour', 'day_of_week', 'requires_road_closure', 
            'event_cause_encoded', 'priority_encoded', 'veh_type_encoded']

X = df[features]
y = df['duration_minutes']

print("Training Upgraded Model (this might take a moment)...")
# Split the data into training (80%) and testing (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train the Random Forest AI
model = RandomForestRegressor(n_estimators=100, random_state=42) 
model.fit(X_train, y_train)

print("Creating directory and saving models...")
# Ensure the ml_models folder exists
os.makedirs('ml_models', exist_ok=True)

# Save the trained model and the encoders to disk
joblib.dump(model, 'ml_models/traffic_model_v2.pkl')
joblib.dump(encoders, 'ml_models/encoders_v2.pkl') 

print("Done! Model trained and saved successfully. You can now start the Django server.")