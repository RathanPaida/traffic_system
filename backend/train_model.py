# backend/train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("Loading data...")
df = pd.read_csv('data/Astram event data_anonymized.csv')

print("Cleaning & Upgrading features...")
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['end_datetime'] = pd.to_datetime(df['end_datetime'], errors='coerce')
df['duration_minutes'] = (df['end_datetime'] - df['start_datetime']).dt.total_seconds() / 60

# Drop rows with missing critical data
df = df.dropna(subset=['duration_minutes', 'latitude', 'longitude'])

# Time features
df['hour'] = df['start_datetime'].dt.hour
df['day_of_week'] = df['start_datetime'].dt.dayofweek

# Convert boolean to integer (True = 1, False = 0)
df['requires_road_closure'] = df['requires_road_closure'].astype(bool).astype(int)

# Create Encoders for text columns
encoders = {}
categorical_cols = ['event_cause', 'priority', 'veh_type']

for col in categorical_cols:
    le = LabelEncoder()
    # Fill empty text with 'Unknown' so the model doesn't crash
    df[col] = df[col].fillna('Unknown').astype(str)
    df[f'{col}_encoded'] = le.fit_transform(df[col])
    encoders[col] = le

# Select upgraded features
features = ['latitude', 'longitude', 'hour', 'day_of_week', 'requires_road_closure', 
            'event_cause_encoded', 'priority_encoded', 'veh_type_encoded']

X = df[features]
y = df['duration_minutes']

print("Training Upgraded Model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
# Increased trees to 100 for better accuracy
model = RandomForestRegressor(n_estimators=100, random_state=42) 
model.fit(X_train, y_train)

print("Saving upgraded model and encoders...")
joblib.dump(model, 'ml_models/traffic_model_v2.pkl')
joblib.dump(encoders, 'ml_models/encoders_v2.pkl') # Save all encoders together

