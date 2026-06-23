'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Map as MapIcon, Navigation, Users, ShieldAlert, Truck, AlertTriangle } from 'lucide-react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [view, setView] = useState<'predict' | 'map'>('predict');
  const [loading, setLoading] = useState(false);
  
  const [corridors, setCorridors] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    start_node: '', end_node: '',
    latitude: '12.9716', longitude: '77.5946', hour: '17',
    priority: 'High', requires_road_closure: '0', corridor: '',
    veh_type: 'car', description: 'Heavy congestion reported'
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/heatmap/`).then(res => setHeatmapData(res.data)).catch(err => console.error("Heatmap fetch error:", err));
    
    axios.get(`${API_BASE_URL}/api/corridors/`).then(res => {
        setCorridors(res.data.corridors);
        if(res.data.corridors.length > 2) {
            setFormData(prev => ({
                ...prev, 
                start_node: res.data.corridors[0],
                end_node: res.data.corridors[res.data.corridors.length - 1],
                corridor: res.data.corridors[2] 
            }));
        }
    }).catch(err => console.error("Corridors fetch error:", err));
  }, []);

  const analyzeAndRoute = async () => {
    setLoading(true);
    try {
      const aiResponse = await axios.post(`${API_BASE_URL}/api/predict/`, formData);
      setAiResult(aiResponse.data);

      const routeResponse = await axios.post(`${API_BASE_URL}/api/route/`, {
        start: formData.start_node,
        end: formData.end_node,
        incident_location: formData.corridor,
        priority: formData.priority,
        requires_road_closure: formData.requires_road_closure
      });
      setRoute(routeResponse.data);
      setView('map'); 

    } catch (error) {
      alert("No alternate route exists! The path is completely blocked.");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background ambient light */}
      <div className="fixed top-0 inset-x-0 h-screen bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none -z-10"></div>
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Activity className="text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight">Astram Smart Routing</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-1">Intelligent Traffic Management</p>
            </div>
          </div>
          <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-700/50">
            <button 
              onClick={() => setView('predict')} 
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 ${view === 'predict' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              Control Panel
            </button>
            <button 
              onClick={() => setView('map')} 
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 ${view === 'map' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <MapIcon size={16} />
              City Map
            </button>
          </div>
        </header>

        <div className="relative min-h-[750px]">
          <div className={`transition-all duration-500 ease-in-out absolute inset-0 w-full ${view === 'predict' ? 'opacity-100 pointer-events-auto scale-100 z-10' : 'opacity-0 pointer-events-none scale-95 z-0'}`}>
            <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-2xl border border-slate-700/50">
              <div className="flex items-center gap-4 mb-10 pb-5 border-b border-slate-700/50">
                <div className="h-8 w-2.5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Dynamic Routing Simulation</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <div className="group">
                     <label htmlFor="start_node" className="block text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Start Journey At</label>
                     <div className="relative">
                       <select id="start_node" className="w-full p-4 pl-5 appearance-none border border-slate-700/50 rounded-xl bg-slate-950/70 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner hover:border-slate-600" value={formData.start_node} onChange={e => setFormData({...formData, start_node: e.target.value})}>
                           {corridors.map(c => <option key={`start-${c}`} value={c}>{c}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                     </div>
                 </div>
                 <div className="group">
                     <label htmlFor="end_node" className="block text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider group-focus-within:text-blue-400 transition-colors">Destination</label>
                     <div className="relative">
                       <select id="end_node" className="w-full p-4 pl-5 appearance-none border border-slate-700/50 rounded-xl bg-slate-950/70 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner hover:border-slate-600" value={formData.end_node} onChange={e => setFormData({...formData, end_node: e.target.value})}>
                           {corridors.map(c => <option key={`end-${c}`} value={c}>{c}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                     </div>
                 </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-red-950/40 via-slate-900/40 to-slate-900/40 border border-red-500/20 rounded-3xl mb-10 relative overflow-hidden group shadow-[inset_0_0_40px_rgba(220,38,38,0.05)]">
                 <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none transform group-hover:rotate-12">
                    <AlertTriangle size={200} className="text-red-500" />
                 </div>
                 
                 <h3 className="text-red-400 font-bold text-xl mb-8 flex items-center gap-3">
                   <div className="p-2.5 bg-red-500/20 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/30">
                     <AlertTriangle size={22} className="text-red-400" />
                   </div>
                   Inject Incident into City Graph
                 </h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                   <div>
                     <label htmlFor="incident_node" className="block text-xs font-semibold text-red-300/80 mb-2.5 uppercase tracking-wider">Incident Location</label>
                     <div className="relative">
                       <select id="incident_node" className="w-full p-3.5 appearance-none border border-red-900/40 rounded-xl bg-slate-950/80 text-slate-200 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all hover:border-red-800/60" value={formData.corridor} onChange={e => setFormData({...formData, corridor: e.target.value})}>
                           {corridors.map(c => <option key={`crash-${c}`} value={c}>{c}</option>)}
                       </select>
                       <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-red-500/50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                     </div>
                   </div>
                   <div>
                     <label htmlFor="severity" className="block text-xs font-semibold text-red-300/80 mb-2.5 uppercase tracking-wider">Severity Weight</label>
                     <div className="relative">
                       <select id="severity" className="w-full p-3.5 appearance-none border border-red-900/40 rounded-xl bg-slate-950/80 text-slate-200 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all hover:border-red-800/60" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                           <option value="Low">Low (+20 mins)</option>
                           <option value="Medium">Medium (+40 mins)</option>
                           <option value="High">High (+100 mins)</option>
                       </select>
                       <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-red-500/50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                     </div>
                   </div>
                   <div>
                     <label htmlFor="veh_type" className="block text-xs font-semibold text-red-300/80 mb-2.5 uppercase tracking-wider">Vehicle Type</label>
                     <div className="relative">
                       <select id="veh_type" className="w-full p-3.5 appearance-none border border-red-900/40 rounded-xl bg-slate-950/80 text-slate-200 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all hover:border-red-800/60" value={formData.veh_type} onChange={e => setFormData({...formData, veh_type: e.target.value})}>
                           <option value="car">Car / LMV</option>
                           <option value="truck">Truck / Heavy</option>
                       </select>
                       <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-red-500/50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                     </div>
                   </div>
                   <div>
                     <label htmlFor="road_closure" className="block text-xs font-semibold text-red-300/80 mb-2.5 uppercase tracking-wider">Road Closure?</label>
                     <div className="relative">
                       <select id="road_closure" className={`w-full p-3.5 appearance-none border rounded-xl bg-slate-950/80 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all font-bold ${formData.requires_road_closure === '1' ? 'border-red-500/60 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-red-900/40 text-slate-200 hover:border-red-800/60'}`} value={formData.requires_road_closure} onChange={e => setFormData({...formData, requires_road_closure: e.target.value})}>
                           <option value="0">No (Slower Traffic)</option>
                           <option value="1">YES (Delete Edge)</option>
                       </select>
                       <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-red-500/50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                     </div>
                   </div>
                 </div>

                 <label htmlFor="incident_desc" className="block text-xs font-semibold text-red-300/80 mb-2.5 uppercase tracking-wider">NLP Incident Description</label>
                 <textarea id="incident_desc" placeholder="Describe the severity of the incident..." rows={2} className="w-full p-4 border border-red-900/40 rounded-xl bg-slate-950/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all resize-none shadow-inner hover:border-red-800/60" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <button onClick={analyzeAndRoute} disabled={loading} className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white font-bold text-lg py-5 rounded-2xl transition-all duration-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing XGBoost & Graph Algorithms...
                    </>
                  ) : (
                    <>
                      <Navigation size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300" />
                      Generate AI Map Route
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className={`transition-all duration-500 ease-in-out absolute inset-0 w-full ${view === 'map' ? 'opacity-100 pointer-events-auto scale-100 z-10' : 'opacity-0 pointer-events-none scale-95 z-0'}`}>
            <div className="h-[750px] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-slate-700/60 relative bg-slate-900">
              <Map
                initialViewState={{ longitude: 77.5946, latitude: 12.9716, zoom: 10.5 }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              >
                {heatmapData && (
                  <Source type="geojson" data={heatmapData}>
                    <Layer
                      id="heatmap" type="heatmap"
                      paint={{
                        'heatmap-weight': ['get', 'weight'],
                        'heatmap-intensity': 1,
                        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
                        'heatmap-radius': 20
                      }}
                    />
                  </Source>
                )}

                {route && (
                  <>
                    <Source id="route" type="geojson" data={{
                      type: "Feature", properties: {},
                      geometry: { type: "LineString", coordinates: route.route_coordinates }
                    }}>
                      <Layer id="route-line" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 8, 'line-opacity': 0.6 }} />
                      <Layer id="route-line-core" type="line" paint={{ 'line-color': '#60a5fa', 'line-width': 3 }} />
                    </Source>
                    
                    <Marker longitude={route.route_coordinates[0][0]} latitude={route.route_coordinates[0][1]}>
                      <div className="relative flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-2 border-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.8)]"></span>
                      </div>
                    </Marker>
                    <Marker longitude={route.route_coordinates[route.route_coordinates.length-1][0]} latitude={route.route_coordinates[route.route_coordinates.length-1][1]}>
                      <div className="relative flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border-2 border-slate-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></span>
                      </div>
                    </Marker>
                  </>
                )}
              </Map>

              {aiResult && route && (
                <div className="absolute top-6 left-6 bg-slate-900/85 backdrop-blur-xl text-white p-6 rounded-2xl border border-slate-700/60 shadow-2xl max-w-sm transform transition-all duration-300 hover:scale-[1.02] group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
                  <div className="relative">
                    <h3 className="font-bold text-xl mb-5 flex items-center gap-3 border-b border-slate-700/60 pb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <Navigation className="text-blue-400" size={20} />
                      </div>
                      AI Dispatch Matrix
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 font-medium text-sm">Crash Clearance</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                          <span className="text-2xl font-black text-red-400 tracking-tight">{aiResult.estimated_clearance_minutes}<span className="text-xs font-semibold text-red-400/60 ml-1 uppercase tracking-wider">min</span></span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 font-medium text-sm">Bypass Route E.T.A</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                          <span className="text-2xl font-black text-green-400 tracking-tight">{route.total_minutes}<span className="text-xs font-semibold text-green-400/60 ml-1 uppercase tracking-wider">min</span></span>
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-[11px] text-slate-500 mb-3 uppercase tracking-widest">Required Resources</h4>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-950/70 p-3 rounded-xl text-center border border-slate-800/60 transition-colors">
                            <Users size={22} className="mx-auto mb-2 text-blue-400" />
                            <span className="block text-2xl font-black text-slate-100">{aiResult.resources_required?.policemen}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Officers</span>
                        </div>
                        <div className="bg-slate-950/70 p-3 rounded-xl text-center border border-slate-800/60 transition-colors">
                            <ShieldAlert size={22} className="mx-auto mb-2 text-orange-400" />
                            <span className="block text-2xl font-black text-slate-100">{aiResult.resources_required?.barricades}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Barricades</span>
                        </div>
                        <div className="bg-slate-950/70 p-3 rounded-xl text-center border border-slate-800/60 flex flex-col justify-center items-center transition-colors">
                            <Truck size={22} className="mb-2 text-purple-400" />
                            <span className="block text-xl font-black text-slate-100 leading-tight">{aiResult.resources_required?.tow_trucks}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Tow Trucks</span>
                        </div>
                    </div>

                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/60 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <strong className="text-blue-400 font-semibold text-[11px] tracking-widest uppercase block mb-2 pl-2">Dijkstra Safe Path:</strong>
                      <div className="h-20 overflow-y-auto pr-3 text-slate-300 text-sm font-medium leading-relaxed custom-scrollbar pl-2">
                        {route.optimal_path.map((step: string, idx: number) => (
                          <span key={idx}>
                            {step}
                            {idx < route.optimal_path.length - 1 && <span className="text-slate-600 mx-2 text-xs">➔</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.8);
        }
      `}} />
    </main>
  );
}