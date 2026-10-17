import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import GISMapComponent, { type GISFeature } from "@/components/gis/GISMapComponent"
import { Badge } from "@/components/ui/badge"
import { Search, Map, AlertTriangle, CheckCircle, Activity, MapPin, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { api } from "@/services/api"

export default function GISPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [features, setFeatures] = useState<GISFeature[]>([])
  const [analytics, setAnalytics] = useState({ total_incidents: 0, active_incidents: 0, resolved_incidents: 0, stations_count: 0 })
  const [selectedFeature, setSelectedFeature] = useState<GISFeature | null>(null)
  
  // View mode synced with URL search params: ?view=map or ?view=heatmap
  const urlView = searchParams.get("view")
  const mode: "map" | "heatmap" = urlView === "heatmap" ? "heatmap" : "map"

  const setMode = (newMode: "map" | "heatmap") => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newMode === "heatmap") {
        next.set("view", "heatmap")
      } else {
        next.delete("view")
      }
      return next
    })
  }
  
  // Filters & State
  const [searchQuery, setSearchQuery] = useState("")
  const [days, setDays] = useState<number | "">("")
  const [species, setSpecies] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await api.getGISData({
        days,
        species: species || undefined,
        status: status || undefined
      })
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
    (f.name && f.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.id && f.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.species && f.species.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Derive simple chart data
  const speciesCounts = features.filter(f => f.type === "incident").reduce((acc, f) => {
    acc[f.species || "Other"] = (acc[f.species || "Other"] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const chartData = Object.keys(speciesCounts).map(k => ({ name: k, value: speciesCounts[k] })).sort((a,b) => b.value - a.value).slice(0, 5)

  return (
    <div className="space-y-6">
      
      {/* Standard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-md shrink-0">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">Gaia GIS Intelligence</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                {analytics.total_incidents} Incidents
              </span>
            </div>
            <p className="text-xs text-emerald-800/70 font-medium mt-0.5">
              Real-time spatial view of wildlife incidents and conflict patterns across surveillance ranges.
            </p>
          </div>
        </div>

        {/* Spatial Search, Mode Switch & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-emerald-950/10 shadow-inner">
            <button 
              onClick={() => setMode("map")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === "map" ? "bg-white text-emerald-900 shadow-sm border border-emerald-950/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              GIS Mapping
            </button>
            <button 
              onClick={() => setMode("heatmap")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === "heatmap" ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md shadow-orange-200" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Conflict Heatmap
            </button>
          </div>
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID, species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-xs"
            />
          </div>
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            title="Refresh spatial telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
            <span>Refresh</span>
          </button>
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
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase">{selectedFeature.confidence ? "AI Detection" : "Primary Species"}</span>
                    <p className="text-sm font-black text-amber-950">{selectedFeature.species}</p>
                    {selectedFeature.confidence && (
                      <p className="text-[11px] font-bold text-amber-700 mt-1">Confidence: {(selectedFeature.confidence * 100).toFixed(1)}%</p>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-3 border border-gray-100 rounded-lg text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-gray-500">
                    <span className="font-bold">Latitude:</span>
                    <span className="font-bold text-gray-900">{selectedFeature.lat.toFixed(5)}° N</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="font-bold">Longitude:</span>
                    <span className="font-bold text-gray-900">{selectedFeature.lng.toFixed(5)}° E</span>
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
