# 🚦 Astram Smart Traffic Routing System

> AI-powered event-driven traffic congestion forecasting and dynamic routing for smart cities.

## 🔴 Live Demo
**[https://traffic-system-five.vercel.app](https://traffic-system-five.vercel.app)**

---

## 🧠 Problem Statement
Political rallies, festivals, sports events, and construction activities create localized traffic breakdowns. Traditional traffic management is reactive — resources are deployed based on experience with no post-event learning system.

**Our Solution:** Use historical and real-time data to forecast event-related traffic impact and recommend optimal manpower, barricading, and diversion plans.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, TailwindCSS |
| Backend | Django REST Framework, Python |
| ML Models | XGBoost, Scikit-learn, KMeans Clustering |
| Routing Algorithm | Dijkstra's Algorithm on dynamic city graph |
| Maps | MapLibre GL (react-map-gl) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Features
- **AI Traffic Prediction** — XGBoost model predicts clearance time based on incident type, severity, location
- **Dynamic Route Generation** — Dijkstra's algorithm finds optimal bypass routes avoiding incidents
- **Live Heatmap** — Real-time visualization of traffic congestion hotspots across the city
- **Resource Dispatch Matrix** — Recommends exact number of officers, barricades, and tow trucks needed

---

## 🛠️ Local Development

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 📁 Project Structure
```
traffic_system/
├── backend/          # Django REST API + ML models
│   ├── api/          # Views, URLs, models
│   ├── ml_models/    # Trained .pkl files
│   ├── data/         # Dataset (Astram event data)
│   └── Procfile      # Render deployment config
└── frontend/         # Next.js dashboard
    └── app/
        └── page.tsx  # Main dashboard component
```
