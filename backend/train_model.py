import os
import warnings
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error
from sklearn.cluster import KMeans
from xgboost import XGBRegressor
from category_encoders import TargetEncoder

# Silence memory leak warnings
os.environ["OMP_NUM_THREADS"] = "1"
warnings.filterwarnings("ignore")

print("Loading Astram Data...")
df = pd.read_csv('data/Astram event data_anonymized.csv')

# 1. Clean and Extract Target Variable
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
df['duration_minutes'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 60
df = df.dropna(subset=['duration_minutes', 'latitude', 'longitude'])
df = df[(df['duration_minutes'] >= 2) & (df['duration_minutes'] <= 360)]

# 2. Feature Engineering
df['hour_sin'] = np.sin(2 * np.pi * df['start_datetime'].dt.hour / 24)
df['hour_cos'] = np.cos(2 * np.pi * df['start_datetime'].dt.hour / 24)
df['requires_road_closure'] = df['requires_road_closure'].astype(bool).astype(int)
df['description'] = df['description'].fillna('') 

for col in ['event_cause', 'priority', 'veh_type', 'corridor', 'assigned_to_police_id', 'police_station']:
    df[col] = df[col].fillna('Unknown_Entity').astype(str)

# 3. Spatial Clustering
kmeans = KMeans(n_clusters=20, random_state=42, n_init=10)
df['spatial_cluster'] = kmeans.fit_predict(df[['latitude', 'longitude']])

X = df[['latitude', 'longitude', 'spatial_cluster', 'hour_sin', 'hour_cos', 'requires_road_closure', 
        'event_cause', 'priority', 'veh_type', 'corridor', 'assigned_to_police_id', 'police_station', 'description']]
y = df['duration_minutes']

print("Building AI Pipeline (NLP + Target Encoding + XGBoost)...")
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['latitude', 'longitude', 'spatial_cluster', 'hour_sin', 'hour_cos', 'requires_road_closure']),
        ('target_enc', TargetEncoder(smoothing=10), ['event_cause', 'priority', 'veh_type', 'corridor', 'assigned_to_police_id', 'police_station']),
        ('text', TfidfVectorizer(max_features=30, stop_words='english'), 'description')
    ])

# Optimize for Mean Absolute Error to ignore extreme outliers
model = XGBRegressor(n_estimators=400, max_depth=7, learning_rate=0.05, objective='reg:absoluteerror', random_state=42, n_jobs=-1)

pipeline = Pipeline([('preprocessor', preprocessor), ('model', model)])
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

pipeline.fit(X_train, y_train)
mae = mean_absolute_error(y_test, pipeline.predict(X_test))

print(f"✅ Training Complete! Error Margin: +/- {mae:.2f} mins")
os.makedirs('ml_models', exist_ok=True)
joblib.dump(pipeline, 'ml_models/traffic_pipeline_v3.pkl')
joblib.dump(kmeans, 'ml_models/kmeans_cluster.pkl')