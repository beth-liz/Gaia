import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import GISMapComponent, { type GISFeature } from "@/components/gis/GISMapComponent"
import { 
  Flame, 
  Map, 
  RefreshCw, 
  ChevronRight
} from "lucide-react"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"

export default function ConflictHeatmapPage() {
  const { user } = useAuth()
  const [features, setFeatures] = useState<GISFeature[]>([])
  const [analytics, setAnalytics] = useState<any>({
    total_incidents: 0,
    valid_incidents: 0,
    incidents_missing_coords: 0,
    total_cameras: 0,
    valid_cameras: 0,
    total_detections: 0,
    valid_detections: 0
  })

  const isVillager = user?.role === "Villager"
  // Map link according to user role
  const gisMappingPath = user?.role === "Admin"
    ? "/admin/gis/mapping"
    : user?.role === "Range Forest Officer"
    ? "/officer/gis"
    : user?.role === "Forest Guard"
    ? "/guard/gis"
    : null

  // Heatmap source data mode
  const [heatmapMode, setHeatmapMode] = useState<"incidents" | "detections" | "combined">("combined")
  const [speciesFilter, setSpeciesFilter] = useState<string>("")
  const [daysFilter, setDaysFilter] = useState<number | "">("")
  const [isLoading, setIsLoading] = useState(true)

  // Force incidents mode for villagers since cameras/detections are private
  useEffect(() => {
    if (isVillager) {
      setHeatmapMode("incidents")
    }
  }, [isVillager])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await api.getGISData({
        days: daysFilter,
        species: speciesFilter || undefined
      })
      setFeatures(data.features || [])
      setAnalytics(data.analytics || {})
    } catch (err: any) {
      console.error("Conflict Heatmap fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [speciesFilter, daysFilter])

  // Count active points feeding the current heatmap mode
  const activeHeatPointsCount = features.filter(f => {
    if (heatmapMode === "incidents") return f.type === "incident"
    if (heatmapMode === "detections") return f.type === "detection"
    return f.type === "incident" || f.type === "detection"
  }).length

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-950/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md shadow-orange-100 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-emerald-950 tracking-tight">Conflict Heatmap</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[11px] font-bold">
                {activeHeatPointsCount} Active Geotagged Records
              </span>
            </div>
            <p className="text-xs text-emerald-800/70 font-medium mt-0.5">
              Density gradient visualization depicting human-wildlife conflict clusters, high-risk encounter corridors, and camera wildlife hotspots.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Link to GIS Mapping */}
        <div className="flex flex-wrap items-center gap-2.5">
          {gisMappingPath && (
            <Link
              to={gisMappingPath}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition shadow-xs"
            >
              <Map className="w-4 h-4 text-emerald-700" />
              <span>Open GIS Mapping</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
            </Link>
          )}

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20 text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar: Heatmap Data Mode Selector & Time Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        
        {/* Heatmap Data Mode */}
        {!isVillager ? (
          <div className="sm:col-span-2 flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setHeatmapMode("combined")}
              className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-lg transition-all text-center ${
                heatmapMode === "combined"
                  ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Combined Hotspots ({analytics.valid_incidents + analytics.valid_detections})
            </button>

            <button
              onClick={() => setHeatmapMode("incidents")}
              className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-lg transition-all text-center ${
                heatmapMode === "incidents"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Conflict Incidents ({analytics.valid_incidents || 0})
            </button>

            <button
              onClick={() => setHeatmapMode("detections")}
              className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-lg transition-all text-center ${
                heatmapMode === "detections"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Camera Detections ({analytics.valid_detections || 0})
            </button>
          </div>
        ) : (
          <div className="sm:col-span-2 flex items-center bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-950/10 text-xs font-bold text-emerald-900">
            <span>Community Wildlife Conflict Heatmap ({analytics.valid_incidents || 0} Incidents)</span>
          </div>
        )}

        {/* Species Filter */}
        <div>
          <input
            type="text"
            placeholder="Filter by species (e.g. Tiger, Elephant)..."
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Time Window Filter */}
        <div>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition cursor-pointer"
          >
            <option value="">Historical & Real-Time (All)</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>

      </div>

      {/* Main Heatmap Container */}
      <div className="relative">
        <GISMapComponent
          features={features}
          showHeatmap={true}
          heatmapDataMode={heatmapMode}
          onRefresh={fetchData}
          height="h-[640px]"
        />

        {/* Floating Dynamic Intensity Legend */}
        <div className="absolute bottom-10 left-4 z-[500] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-xs font-sans max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Conflict Density Scale</span>
            <span className="text-[10px] text-slate-400 font-bold">Relative Intensity</span>
          </div>

          {/* Color Gradient Bar */}
          <div className="h-3.5 w-full rounded-lg bg-gradient-to-r from-[#0284c7] via-[#10b981] via-[#eab308] via-[#f97316] to-[#ef4444] shadow-inner mb-1.5"></div>

          <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono">
            <span>Low (Dispersed)</span>
            <span>Moderate</span>
            <span className="text-rose-600 font-extrabold">High (Critical Hotspot)</span>
          </div>

          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            Derived from <strong>{activeHeatPointsCount}</strong> verified coordinate points weighted by incident severity and wildlife count frequency.
          </p>
        </div>
      </div>

      {/* Heatmap Metrics & Diagnostics Panel */}
      <div className={`grid grid-cols-1 ${isVillager ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-4`}>
        
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Official Incidents in Heatmap</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics.valid_incidents || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {analytics.incidents_missing_coords || 0} excluded due to absent GPS coordinates
          </p>
        </div>

        {!isVillager && (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">Camera Wildlife Hotspots</span>
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            </div>
            <div className="text-2xl font-black text-slate-900">{analytics.valid_detections || 0}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Derived from {analytics.valid_cameras || 0} active camera traps
            </p>
          </div>
        )}

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Spatial Telemetry Scope</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="text-lg font-black text-emerald-950 uppercase tracking-tight">
            {isVillager ? "Community Alerts" : heatmapMode}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Default Map: Esri Satellite/Terrain • OpenStreetMap (OSM) available
          </p>
        </div>

      </div>

    </div>
  )
}
