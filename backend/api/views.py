# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
import joblib
import os
from django.conf import settings

# Load Upgraded Models
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'traffic_model_v2.pkl')
ENCODER_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'encoders_v2.pkl')

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

@api_view(['POST'])
def predict_traffic(request):
    try:
        data = request.data
        
        # 1. Parse Data (with defaults if missing)
        lat = float(data.get('latitude', 12.9716))
        lon = float(data.get('longitude', 77.5946))
        hour = int(data.get('hour', 12))
        day = int(data.get('day_of_week', 0))
        closure = int(data.get('requires_road_closure', 0))
        
        cause = data.get('event_cause', 'vehicle_breakdown')
        priority = data.get('priority', 'High')
        veh_type = data.get('veh_type', 'car')
        
        # 2. Safely encode text (if unknown text comes from frontend, default to 0)
        def encode_safe(col_name, val):
            try:
                return encoders[col_name].transform([val])[0]
            except ValueError:
                return 0

        cause_encoded = encode_safe('event_cause', cause)
        priority_encoded = encode_safe('priority', priority)
        veh_encoded = encode_safe('veh_type', veh_type)
            
        # 3. Predict
        input_data = [[lat, lon, hour, day, closure, cause_encoded, priority_encoded, veh_encoded]]
        estimated_minutes = round(model.predict(input_data)[0])
        
        # 4. Smart Resource Allocation Logic
        resources = {
            "personnel": 2, 
            "barricades": 5, 
            "tow_trucks": 1 if veh_type in ['hgv', 'truck', 'bus'] else 0,
            "severity": "Low"
        }
        
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