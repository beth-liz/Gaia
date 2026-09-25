import { useState, useEffect } from "react"
import GISMapComponent, { type GISFeature } from "@/components/gis/GISMapComponent"
import { Badge } from "@/components/ui/badge"
import { Search, Map, AlertTriangle, CheckCircle, Activity, MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export default function GISPage() {
  const [features, setFeatures] = useState<GISFeature[]>([])
  const [analytics, setAnalytics] = useState({ total_incidents: 0, active_incidents: 0, resolved_incidents: 0, stations_count: 0 })
  const [selectedFeature, setSelectedFeature] = useState<GISFeature | null>(null)
  
  // Filters & State
  const [searchQuery, setSearchQuery] = useState("")
  const [days, setDays] = useState<number | "">("")
  const [species, setSpecies] = useState("")
  const [status, setStatus] = useState("")
  const [mode, setMode] = useState<"map" | "heatmap">("map")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const params = new URLSearchParams()
      if (days) params.append("days", days.toString())
      if (species) params.append("species", species)
      if (status) params.append("status", status)

      const res = await fetch(`http://127.0.0.1:8000/api/gis/data?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("gaia_token")}`
        }
      })
      if (res.status === 401 || res.status === 403) {
        throw new Error("Authentication failed. Please log in again.")
      }
      if (!res.ok) throw new Error("Unable to load incident locations. Please try again.")
      const data = await res.json()
      setFeatures(data.features || [])
      setAnalytics(data.analytics || { total_incidents: 0, active_incidents: 0, resolved_incidents: 0, stations_count: 0 })
      
      // Auto-select first feature if nothing selected
      if (!selectedFeature && data.features?.length > 0) {
        setSelectedFeature(data.features[0])
      }
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || "Unable to load incident locations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [days, species, status])

  const filteredFeatures = features.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.species && f.species.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Derive simple chart data
  const speciesCounts = features.filter(f => f.type === "incident").reduce((acc, f) => {
    acc[f.species || "Other"] = (acc[f.species || "Other"] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const chartData = Object.keys(speciesCounts).map(k => ({ name: k, value: speciesCounts[k] })).sort((a,b) => b.value - a.value).slice(0, 5)

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* ArcGIS Style Operational Header */}
      <div className="bg-white border border-[#dcd8cd] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-900 text-white rounded-lg shadow-sm">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-emerald-950">
              Gaia GIS Intelligence
            </h2>
            <p className="text-xs font-semibold text-emerald-800/70">
              Real-time spatial view of wildlife incidents and conflict patterns
            </p>
          </div>
        </div>

        {/* Spatial Search & Mode Switch */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50 shadow-inner">
            <button 
              onClick={() => setMode("map")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === "map" ? "bg-white text-emerald-700 shadow shadow-emerald-100 border border-emerald-100" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}`}
            >
              <MapPin className="w-3.5 h-3.5" />
              GIS Incident Map
            </button>
            <button 
              onClick={() => setMode("heatmap")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === "heatmap" ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Conflict Heat Map
            </button>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ID, species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-500">Total Incidents</p>
            <p className="text-xl font-black text-gray-900">{analytics.total_incidents}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-500">Active Incidents</p>
            <p className="text-xl font-black text-gray-900">{analytics.active_incidents}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-500">Resolved</p>
            <p className="text-xl font-black text-gray-900">{analytics.resolved_incidents}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><MapPin className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-gray-500">Monitoring Stations</p>
            <p className="text-xl font-black text-gray-900">{analytics.stations_count}</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <span className="text-xs font-black uppercase text-gray-400">Filters:</span>
        <select value={days} onChange={e => setDays(e.target.value ? Number(e.target.value) : "")} className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 3 Months</option>
        </select>
        <select value={species} onChange={e => setSpecies(e.target.value)} className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="">All Species</option>
          <option value="Elephant">Elephant</option>
          <option value="Tiger">Tiger</option>
          <option value="Leopard">Leopard</option>
          <option value="Monkey">Monkey</option>
          <option value="Boar">Wild Boar</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Action In Progress">Action In Progress</option>
          <option value="Verified">Verified</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Main Spatial Viewport Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Center Spatial Map Viewport (8 Cols) */}
        <div className="lg:col-span-8 relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-emerald-900 font-black animate-pulse">Syncing Spatial Data...</div>
            </div>
          )}
          {errorMsg && !isLoading ? (
            <div className="h-[600px] w-full bg-gray-50 flex items-center justify-center flex-col gap-4">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-bold text-gray-700">{errorMsg}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition"
              >
                Retry
              </button>
            </div>
          ) : features.length === 0 && !isLoading ? (
            <div className="h-[600px] w-full bg-gray-50 flex items-center justify-center flex-col gap-2">
              <MapPin className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-bold text-gray-500">No geographic data available for current filters.</p>
            </div>
          ) : (
            <GISMapComponent 
              height="h-[600px]" 
              features={filteredFeatures}
              showHeatmap={mode === "heatmap"}
              onSelectFeature={(feat) => setSelectedFeature(feat)}
              selectedFeatureId={selectedFeature?.id}
              onRefresh={fetchData}
            />
          )}
        </div>

        {/* Right Spatial Inspection & Analytics Panel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Detail Drawer */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="bg-emerald-950 px-4 py-3 border-b border-emerald-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-50">Intelligence Panel</span>
              <Badge variant={selectedFeature?.status === "critical" ? "critical" : "default"}>
                {selectedFeature?.status || "SELECT NODE"}
              </Badge>
            </div>

            {selectedFeature ? (
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase">{selectedFeature.name}</h3>
                  <p className="text-[11px] font-bold text-gray-500">{selectedFeature.id}</p>
                </div>

                {selectedFeature.species && selectedFeature.species !== "Unknown" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase">Primary Species</span>
                    <p className="text-sm font-black text-amber-950">{selectedFeature.species}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 border border-gray-100 rounded-lg text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-gray-500">
                    <span className="font-bold">Latitude:</span>
                    <span className="font-bold text-gray-900">{selectedFeature.lat.toFixed(5)}A N</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="font-bold">Longitude:</span>
                    <span className="font-bold text-gray-900">{selectedFeature.lng.toFixed(5)}A E</span>
                  </div>
                  {selectedFeature.timestamp && (
                    <div className="flex justify-between text-gray-500">
                      <span className="font-bold">Logged:</span>
                      <span className="font-bold text-gray-900">{new Date(selectedFeature.timestamp).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Details</span>
                  <p className="text-xs font-semibold text-gray-700 leading-snug">{selectedFeature.details}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-bold text-gray-400">
                Select a marker on the map to inspect location details.
              </div>
            )}
          </div>

          {/* Simple Analytics Chart */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm flex-1 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Conflict Species Breakdown</h3>
            {chartData.length > 0 ? (
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#6b7280' }} width={70} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400">
                No species data to graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
