from rest_framework.decorators import api_view
from rest_framework.response import Response
import joblib
import os
import math
import heapq
import pandas as pd
import numpy as np
from django.conf import settings
import warnings

warnings.filterwarnings("ignore")

PIPELINE_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'traffic_pipeline_v3.pkl')
KMEANS_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'kmeans_cluster.pkl')
pipeline_model = joblib.load(PIPELINE_PATH)
kmeans_model = joblib.load(KMEANS_PATH)

# --- DYNAMIC GRAPH BUILDER ---
BANGALORE_GRAPH = None
NODE_COORDS = None

def build_city_graph():
    global BANGALORE_GRAPH, NODE_COORDS
    if BANGALORE_GRAPH is not None: return BANGALORE_GRAPH, NODE_COORDS

    df = pd.read_csv(os.path.join(settings.BASE_DIR, 'data/Astram event data_anonymized.csv'))
    df = df.dropna(subset=['latitude', 'longitude', 'corridor'])
    corridors = df.groupby('corridor').agg({'latitude': 'mean', 'longitude': 'mean'}).to_dict('index')
    
    NODE_COORDS = {}
    BANGALORE_GRAPH = {}
    
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371.0
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        a = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
        return R * (2 * math.asin(math.sqrt(a)))

    for c1, coords1 in corridors.items():
        if str(c1) in ['nan', 'Unknown_Entity']: continue
        NODE_COORDS[c1] = [coords1['longitude'], coords1['latitude']]
        BANGALORE_GRAPH[c1] = {}
        distances = []
        for c2, coords2 in corridors.items():
            if c1 != c2 and str(c2) not in ['nan', 'Unknown_Entity']:
                dist = haversine(coords1['latitude'], coords1['longitude'], coords2['latitude'], coords2['longitude'])
                distances.append((dist, c2))
                
        distances.sort()
        for dist, c2 in distances[:6]: # Connect to 6 nearest neighbors
            base_mins = max(1.0, dist * 3)
            BANGALORE_GRAPH[c1][c2] = base_mins

    return BANGALORE_GRAPH, NODE_COORDS

@api_view(['GET'])
def get_corridors(request):
    _, coords = build_city_graph()
    return Response({"corridors": list(coords.keys())})

@api_view(['GET'])
def get_heatmap_data(request):
    df = pd.read_csv(os.path.join(settings.BASE_DIR, 'data/Astram event data_anonymized.csv'))
    df = df.dropna(subset=['latitude', 'longitude']).tail(1500)
    
    features = []
    for _, row in df.iterrows():
        weight = 3 if row['priority'] == 'High' else (2 if row['priority'] == 'Medium' else 1)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row['longitude'], row['latitude']]},
            "properties": {"weight": weight}
        })
    return Response({"type": "FeatureCollection", "features": features})

@api_view(['POST'])
def predict_traffic(request):
    data = request.data
    lat, lon = float(data.get('latitude', 12.97)), float(data.get('longitude', 77.59))
    hour = int(data.get('hour', 12))
    
    severity = data.get('priority', 'Medium')
    road_closure = int(data.get('requires_road_closure', 0))
    veh_type = data.get('veh_type', 'car')
    
    input_df = pd.DataFrame([{
        'latitude': lat, 'longitude': lon,
        'spatial_cluster': kmeans_model.predict([[lat, lon]])[0],
        'hour_sin': np.sin(2 * np.pi * hour / 24), 'hour_cos': np.cos(2 * np.pi * hour / 24),
        'requires_road_closure': road_closure,
        'event_cause': data.get('event_cause', 'accident'),
        'priority': severity,
        'veh_type': veh_type,
        'corridor': data.get('corridor', 'Unknown'),
        'assigned_to_police_id': 'Unknown', 'police_station': 'Unknown',
        'description': data.get('description', '')
    }])
        
    raw_minutes = pipeline_model.predict(input_df)[0]
    clearance_time = round(min(max(raw_minutes, 5), 720))

    # DYNAMIC RESOURCE DISPATCH ENGINE
    policemen = 2
    barricades = 4
    tow_trucks = "1 Standard"

    if severity == 'Medium':
        policemen = 4
        barricades = 8
    elif severity == 'High':
        policemen = 8
        barricades = 15

    if road_closure == 1:
        barricades += 10
        policemen += 4

    if veh_type.lower() == 'truck':
        tow_trucks = "1 Heavy Duty"
        policemen += 2

    return Response({
        "estimated_clearance_minutes": clearance_time,
        "resources_required": {
            "policemen": policemen,
            "barricades": barricades,
            "tow_trucks": tow_trucks
        }
    })

@api_view(['POST'])
def calculate_dynamic_route(request):
    graph, coords = build_city_graph()
    data = request.data
    
    start_node = data.get('start')
    end_node = data.get('end')
    incident_node = data.get('incident_location')
    severity = data.get('priority', 'Medium')
    road_closure = int(data.get('requires_road_closure', 0))

    if start_node not in graph or end_node not in graph:
        return Response({"error": "Nodes missing"}, status=400)

    # DIJKSTRA SEVERITY WEIGHTS
    penalty = 20
    if severity == 'Medium': penalty = 40
    elif severity == 'High': penalty = 100

    dynamic_graph = {u: {v: w for v, w in edges.items()} for u, edges in graph.items()}
    
    if incident_node in dynamic_graph:
        for neighbor in dynamic_graph[incident_node]:
            if road_closure == 1:
                dynamic_graph[incident_node][neighbor] = float('inf')
                dynamic_graph[neighbor][incident_node] = float('inf')
            else:
                dynamic_graph[incident_node][neighbor] += penalty
                dynamic_graph[neighbor][incident_node] += penalty

    # Dijkstra Execution
    queue = [(0, start_node, [])]
    seen = set()
    mins = {start_node: 0}
    
    while queue:
        (cost, v1, path) = heapq.heappop(queue)
        if v1 not in seen:
            seen.add(v1)
            path = path + [v1]
            if v1 == end_node:
                return Response({
                    "optimal_path": path, 
                    "total_minutes": round(cost, 1),
                    "route_coordinates": [coords[p] for p in path]
                })
            for v2, c in dynamic_graph.get(v1, {}).items():
                if v2 not in seen and c != float('inf'):
                    next_cost = cost + c
                    if mins.get(v2) is None or next_cost < mins.get(v2):
                        mins[v2] = next_cost
                        heapq.heappush(queue, (next_cost, v2, path))
                        
    return Response({"error": "Path blocked completely."}, status=400)