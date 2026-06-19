# backend/train_model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("Loading data...")
# Look for the CSV in the data folder
df = pd.read_csv('data/Astram event data_anonymized.csv')

print("Cleaning data...")
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['end_datetime'] = pd.to_datetime(df['end_datetime'], errors='coerce')

# Calculate duration in minutes
df['duration_minutes'] = (df['end_datetime'] - df['start_datetime']).dt.total_seconds() / 60
df = df.dropna(subset=['duration_minutes', 'latitude', 'longitude']) 

# Extract time features
df['hour'] = df['start_datetime'].dt.hour
df['day_of_week'] = df['start_datetime'].dt.dayofweek

# Encode the text causes into numbers
le_cause = LabelEncoder()
df['event_cause_encoded'] = le_cause.fit_transform(df['event_cause'].astype(str))

# Prepare inputs (X) and output (y)
features = ['latitude', 'longitude', 'hour', 'day_of_week', 'event_cause_encoded']
X = df[features]
y = df['duration_minutes']

print("Training model (this might take a few seconds)...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

print("Saving model files...")
# Save the trained model and the encoder to the ml_models folder
joblib.dump(model, 'ml_models/traffic_model.pkl')
joblib.dump(le_cause, 'ml_models/cause_encoder.pkl')

print("Done! You can now start the Django server.")