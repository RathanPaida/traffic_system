# backend/train_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor
import joblib
import os

print("Loading data...")
df = pd.read_csv('data/Astram event data_anonymized.csv')

print("Cleaning data & Applying Time Fixes...")
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
# 🚨 Using the system-generated closed_datetime instead of the manual end_datetime
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')

# Calculate duration
df['duration_minutes'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 60
df = df.dropna(subset=['duration_minutes', 'latitude', 'longitude'])

# Keep only realistic events (between 2 minutes and 6 hours)
df = df[(df['duration_minutes'] >= 2) & (df['duration_minutes'] <= 360)]

# Cyclical Time Encoding
df['hour_sin'] = np.sin(2 * np.pi * df['start_datetime'].dt.hour / 24)
df['hour_cos'] = np.cos(2 * np.pi * df['start_datetime'].dt.hour / 24)
df['day_sin'] = np.sin(2 * np.pi * df['start_datetime'].dt.dayofweek / 7)
df['day_cos'] = np.cos(2 * np.pi * df['start_datetime'].dt.dayofweek / 7)

# Handle Missing Categorical Data
df['requires_road_closure'] = df['requires_road_closure'].astype(bool).astype(int)
df['corridor'] = df['corridor'].fillna('Unknown')
df['description'] = df['description'].fillna('') 
df['event_cause'] = df['event_cause'].fillna('Unknown')
df['priority'] = df['priority'].fillna('Medium')
df['veh_type'] = df['veh_type'].fillna('Unknown')

features = ['latitude', 'longitude', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 
            'requires_road_closure', 'event_cause', 'priority', 'veh_type', 'corridor', 'description']
X = df[features]
y = df['duration_minutes']

print("Building AI Pipeline...")
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['latitude', 'longitude', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requires_road_closure']),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['event_cause', 'priority', 'veh_type', 'corridor']),
        ('text', TfidfVectorizer(max_features=25, stop_words='english'), 'description')
    ])

# XGBoost optimized for Median accuracy (ignoring massive outliers)
smart_model = XGBRegressor(
    n_estimators=200, 
    max_depth=5, 
    learning_rate=0.1, 
    objective='reg:absoluteerror', 
    random_state=42
)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', smart_model)
])

print("Training the precision AI model...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

pipeline.fit(X_train, y_train)

predictions = pipeline.predict(X_test)
mae = mean_absolute_error(y_test, predictions)

print(f"\n✅ Training Complete!")
print(f"📊 Final Model Accuracy Error Margin: +/- {mae:.2f} minutes")

print("Saving the Ultimate Pipeline...")
os.makedirs('ml_models', exist_ok=True)
joblib.dump(pipeline, 'ml_models/traffic_pipeline_v3.pkl') 
print("Done! Restart your Django server.")