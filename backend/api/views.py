# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
import joblib
import os
import pandas as pd
import numpy as np
from django.conf import settings

# Load the single Pipeline
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'traffic_pipeline_v3.pkl')
pipeline_model = joblib.load(MODEL_PATH)

@api_view(['POST'])
def predict_traffic(request):
    try:
        data = request.data
        
        hour = int(data.get('hour', 12))
        day = int(data.get('day_of_week', 0))
        
        # Apply cyclical math in the backend
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)
        day_sin = np.sin(2 * np.pi * day / 7)
        day_cos = np.cos(2 * np.pi * day / 7)

        # Build a single-row DataFrame exactly like the training data
        input_df = pd.DataFrame([{
            'latitude': float(data.get('latitude', 12.9716)),
            'longitude': float(data.get('longitude', 77.5946)),
            'hour_sin': hour_sin,
            'hour_cos': hour_cos,
            'day_sin': day_sin,
            'day_cos': day_cos,
            'requires_road_closure': int(data.get('requires_road_closure', 0)),
            'event_cause': data.get('event_cause', 'vehicle_breakdown'),
            'priority': data.get('priority', 'Medium'),
            'veh_type': data.get('veh_type', 'car'),
            'corridor': data.get('corridor', 'Unknown'),       # NEW
            'description': data.get('description', '')         # NEW (NLP)
        }])
            
        # The Pipeline processes text/categories and predicts automatically
        raw_minutes = pipeline_model.predict(input_df)[0]
        estimated_minutes = round(min(max(raw_minutes, 5), 720))
        
        # Resources
        priority = data.get('priority', 'Medium')
        resources = {"personnel": 2, "barricades": 5, "tow_trucks": 1 if data.get('veh_type') in ['hgv', 'truck', 'bus'] else 0, "severity": "Low"}
        
        if estimated_minutes > 120 or priority == 'High':
            resources.update({"personnel": 6, "barricades": 20, "severity": "Critical"})
        elif estimated_minutes > 60:
            resources.update({"personnel": 4, "barricades": 10, "severity": "Medium"})

        return Response({
            "status": "success",
            "estimated_clearance_minutes": estimated_minutes,
            "required_resources": resources
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)