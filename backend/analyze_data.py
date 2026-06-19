# backend/analyze_data.py
import pandas as pd

# Load the data
df = pd.read_csv('data/Astram event data_anonymized.csv')

print("--- TIMESTAMP MISSING DATA ANALYSIS ---")
print(f"Total Rows in Dataset: {len(df)}")
print(f"Rows missing 'end_datetime': {df['end_datetime'].isna().sum()}")
print(f"Rows missing 'closed_datetime': {df['closed_datetime'].isna().sum()}")

# Let's look at the actual durations using the correct column
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
df['duration_minutes'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 60

# Filter out the crazy outliers just for analysis
valid_durations = df[(df['duration_minutes'] >= 2) & (df['duration_minutes'] <= 360)]
print(f"\nAverage valid clearance time: {valid_durations['duration_minutes'].mean():.2f} minutes")
print(f"Median valid clearance time: {valid_durations['duration_minutes'].median():.2f} minutes")