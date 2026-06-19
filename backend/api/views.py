# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
import joblib
import os
from django.conf import settings

# Point to the ml_models folder
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'traffic_model.pkl')
ENCODER_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'cause_encoder.pkl')

# Load models when server starts
model = joblib.load(MODEL_PATH)
encoder = joblib.load(ENCODER_PATH)

@api_view(['POST'])
def predict_traffic(request):
    try:
        data = request.data
        
        # 1. Get data from the frontend request
        lat = float(data.get('latitude', 12.9716))
        lon = float(data.get('longitude', 77.5946))
        hour = int(data.get('hour', 12))
        day = int(data.get('day_of_week', 0))
        cause = data.get('event_cause', 'vehicle_breakdown')
        
        # 2. Convert text cause to number
        try:
            cause_encoded = encoder.transform([cause])[0]
        except ValueError:
            cause_encoded = 0 # Default if unknown cause
            
        # 3. Ask the ML model to predict duration
        prediction = model.predict([[lat, lon, hour, day, cause_encoded]])
        estimated_minutes = round(prediction[0])
        
        # 4. Determine Resources based on prediction
        resources = {"personnel": 2, "barricades": 5}
        if estimated_minutes > 120:
            resources = {"personnel": 6, "barricades": 20}
        elif estimated_minutes > 60:
            resources = {"personnel": 4, "barricades": 10}

        return Response({
            "status": "success",
            "estimated_clearance_minutes": estimated_minutes,
            "required_resources": resources
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)