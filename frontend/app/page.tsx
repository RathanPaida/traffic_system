'use client';
import { useState } from 'react';
import axios from 'axios';
import { Clock, Users, ShieldAlert, Truck, Activity, MapPin } from 'lucide-react';

interface PredictionResult {
  estimated_clearance_minutes: number;
  required_resources: {
    severity: string;
    personnel: number;
    barricades: number;
    tow_trucks: number;
  };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  const [formData, setFormData] = useState({
    latitude: '12.9716',
    longitude: '77.5946',
    hour: '17',
    day_of_week: '4', 
    event_cause: 'vehicle_breakdown',
    priority: 'High',
    veh_type: 'truck',
    requires_road_closure: '0'
  });

  const analyzeImpact = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/predict/', formData);
      setResult(response.data);
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to backend. Is Django running?");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            Traffic Intelligence & Resource AI
          </h1>
          <p className="text-slate-500 mt-2">Predict event impact and optimize city resource deployment.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Input Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Event Parameters</h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-slate-600 mb-1">Latitude</label>
                  <input 
                    id="latitude"
                    title="Latitude"
                    placeholder="12.9716"
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.latitude} 
                    onChange={e => setFormData({...formData, latitude: e.target.value})} 
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-slate-600 mb-1">Longitude</label>
                  <input 
                    id="longitude"
                    title="Longitude"
                    placeholder="77.5946"
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.longitude} 
                    onChange={e => setFormData({...formData, longitude: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hour" className="block text-sm font-medium text-slate-600 mb-1">Time of Day (0-23)</label>
                  <input 
                    id="hour"
                    title="Hour of day"
                    placeholder="17"
                    type="number" 
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.hour} 
                    onChange={e => setFormData({...formData, hour: e.target.value})} 
                  />
                </div>
                <div>
                  <label htmlFor="day" className="block text-sm font-medium text-slate-600 mb-1">Day (0=Mon, 6=Sun)</label>
                  <input 
                    id="day"
                    title="Day of week"
                    placeholder="4"
                    type="number" 
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.day_of_week} 
                    onChange={e => setFormData({...formData, day_of_week: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cause" className="block text-sm font-medium text-slate-600 mb-1">Event Cause</label>
                <select 
                  id="cause"
                  title="Select event cause"
                  className="w-full p-2.5 border rounded-lg bg-slate-50" 
                  value={formData.event_cause} 
                  onChange={e => setFormData({...formData, event_cause: e.target.value})}
                >
                  <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  <option value="accident">Accident</option>
                  <option value="water_logging">Water Logging</option>
                  <option value="political_rally">Political Rally</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-600 mb-1">Road Priority</label>
                  <select 
                    id="priority"
                    title="Select road priority"
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.priority} 
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="vehicle" className="block text-sm font-medium text-slate-600 mb-1">Vehicle Type</label>
                  <select 
                    id="vehicle"
                    title="Select vehicle type"
                    className="w-full p-2.5 border rounded-lg bg-slate-50" 
                    value={formData.veh_type} 
                    onChange={e => setFormData({...formData, veh_type: e.target.value})}
                  >
                    <option value="car">Car / LMV</option>
                    <option value="truck">Truck / HGV</option>
                    <option value="bus">Bus</option>
                    <option value="bike">Two Wheeler</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={analyzeImpact}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Generate Forecast"
              >
                {loading ? 'Analyzing...' : 'Generate AI Forecast'}
              </button>
            </div>
          </div>

          {/* RIGHT: Output Dashboard */}
          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Clearance Time Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 font-medium mb-1">Predicted Clearance Time</p>
                    <h2 className="text-5xl font-black text-slate-800">
                      {result.estimated_clearance_minutes} <span className="text-2xl text-slate-400 font-bold">mins</span>
                    </h2>
                  </div>
                  <div className={`p-5 rounded-full ${result.required_resources.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    <Clock size={48} />
                  </div>
                </div>

                {/* Resource Allocation Grid */}
                <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Required Deployment Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                    <Users className="text-blue-500 mb-3" size={28} />
                    <p className="text-3xl font-bold text-slate-800">{result.required_resources.personnel}</p>
                    <p className="text-slate-500 text-sm font-medium">Traffic Personnel</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500">
                    <ShieldAlert className="text-orange-500 mb-3" size={28} />
                    <p className="text-3xl font-bold text-slate-800">{result.required_resources.barricades}</p>
                    <p className="text-slate-500 text-sm font-medium">Barricades Required</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                    <Truck className="text-purple-500 mb-3" size={28} />
                    <p className="text-3xl font-bold text-slate-800">{result.required_resources.tow_trucks}</p>
                    <p className="text-slate-500 text-sm font-medium">Heavy Tow Trucks</p>
                  </div>

                </div>
                
                {/* Status indicator */}
                <div className={`mt-4 p-4 rounded-xl border ${result.required_resources.severity === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <strong>AI Assessment:</strong> {result.required_resources.severity} impact event. Please execute deployment strategy immediately.
                </div>

              </div>
            ) : (
              <div className="h-full bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-12 min-h-[400px]">
                <MapPin size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Awaiting Event Parameters</p>
                <p className="text-sm">Input data on the left to generate forecast.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}