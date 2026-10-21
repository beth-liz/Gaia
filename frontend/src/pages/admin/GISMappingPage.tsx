import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import GISMapComponent, { type GISFeature } from "@/components/gis/GISMapComponent"
import { 
  Map, 
  Search, 
  RefreshCw, 
  Flame, 
  X,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import { api } from "@/services/api"
import { useAuth } from "@/context/AuthContext"

export default function GISMappingPage() {
  const { user } = useAuth()
  const isVillager = user?.role === "Villager"
  const heatmapPath = user?.role === "Admin"
    ? "/admin/gis/heatmap"
    : user?.role === "Range Forest Officer"
    ? "/officer/gis/heatmap"
    : user?.role === "Forest Guard"
    ? "/guard/gis/heatmap"
    : "/villager/gis/heatmap"
  const [features, setFeatures] = useState<GISFeature[]>([])
  const [analytics, setAnalytics] = useState<any>({
    total_incidents: 0,
    valid_incidents: 0,
    incidents_missing_coords: 0,
    total_cameras: 0,
    valid_cameras: 0,
    cameras_missing_coords: 0,
    total_detections: 0,
    valid_detections: 0,
    stations_count: 0
  })
  
  const [selectedFeature, setSelectedFeature] = useState<GISFeature | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [speciesFilter, setSpeciesFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [daysFilter, setDaysFilter] = useState<number | "">("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await api.getGISData({
        days: daysFilter,
        species: speciesFilter || undefined,
        status: statusFilter || undefined
      })
      setFeatures(data.features || [])
      setAnalytics(data.analytics || {})

      if (data.features && data.features.length > 0 && !selectedFeature) {
        setSelectedFeature(data.features[0])
      }
    } catch (err: any) {
      console.error("GIS Mapping fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [speciesFilter, statusFilter, daysFilter])

  // Client-side text & category filtering
  const filteredFeatures = features.filter(f => {
    if (typeFilter !== "all" && f.type !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = f.name?.toLowerCase().includes(q)
      const matchId = f.id?.toLowerCase().includes(q)
      const matchSpecies = f.species?.toLowerCase().includes(q)
      const matchStation = f.station?.toLowerCase().includes(q)
      if (!matchName && !matchId && !matchSpecies && !matchStation) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        isVillager ? "border-white/20" : "border-emerald-950/10"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl shadow-sm shrink-0 ${
            isVillager
              ? "bg-emerald-950/80 border border-emerald-500/30 text-amber-300"
              : "bg-emerald-900 text-amber-300"
          }`}>
            <Map className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={`text-2xl font-black tracking-tight ${
                isVillager ? "text-white drop-shadow-sm" : "text-emerald-950"
              }`}>GIS Mapping</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isVillager
                  ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                  : "bg-emerald-100 text-emerald-900"
              }`}>
                {isVillager 
                  ? `${analytics.valid_incidents || 0} Community Incidents` 
                  : `${analytics.valid_incidents || 0} Incidents • ${analytics.valid_cameras || 0} Cameras • ${analytics.valid_detections || 0} Detections`}
              </span>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${
              isVillager ? "text-emerald-100/90 drop-shadow-xs" : "text-emerald-800/70"
            }`}>
              {isVillager
                ? "Interactive spatial map displaying verified wildlife encounters, community incident locations, and sanctuary territory."
                : "Real-time interactive spatial telemetry displaying official human-wildlife conflict incidents, deployed camera traps, and AI wildlife detections."}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Link to Heatmap */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={heatmapPath}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold transition shadow-xs"
          >
            <Flame className="w-4 h-4 text-orange-600" />
            <span>Open Conflict Heatmap</span>
            <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
          </Link>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 ${
              isVillager
                ? "bg-emerald-900/60 hover:bg-emerald-800/80 text-white border border-emerald-500/30 backdrop-blur-md"
                : "bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-950/20"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVillager ? "text-amber-300" : "text-emerald-700"} ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 rounded-2xl shadow-xs transition-all ${
        isVillager
          ? "bg-emerald-950/45 border border-emerald-500/25 backdrop-blur-md"
          : "bg-white border border-slate-200"
      }`}>
        
        {/* Search Input */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isVillager ? "text-emerald-300" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search ID, camera, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-bold transition focus:outline-none ${
              isVillager
                ? "bg-emerald-900/60 border border-emerald-500/30 text-white placeholder:text-emerald-200/60 focus:border-amber-400 focus:bg-emerald-900/80"
                : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-600 focus:bg-white"
            }`}
          />
        </div>

        {/* Species Filter Input */}
        <div>
          <input
            type="text"
            placeholder="Species (e.g. Tiger, Elephant)..."
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none ${
              isVillager
                ? "bg-emerald-900/60 border border-emerald-500/30 text-white placeholder:text-emerald-200/60 focus:border-amber-400 focus:bg-emerald-900/80"
                : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-600 focus:bg-white"
            }`}
          />
        </div>

        {/* Feature Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer focus:outline-none ${
              isVillager
                ? "bg-emerald-900/70 border border-emerald-500/30 text-white focus:border-amber-400"
                : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-600 focus:bg-white"
            }`}
          >
            <option value="all" className={isVillager ? "bg-emerald-950 text-white" : ""}>All Features</option>
            <option value="incident" className={isVillager ? "bg-emerald-950 text-white" : ""}>⚠️ Incidents Only</option>
            {!isVillager && <option value="camera">📷 Cameras Only</option>}
            {!isVillager && <option value="detection">🐾 Wildlife Detections Only</option>}
            <option value="station" className={isVillager ? "bg-emerald-950 text-white" : ""}>🏢 Stations Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer focus:outline-none ${
              isVillager
                ? "bg-emerald-900/70 border border-emerald-500/30 text-white focus:border-amber-400"
                : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-600 focus:bg-white"
            }`}
          >
            <option value="" className={isVillager ? "bg-emerald-950 text-white" : ""}>All Statuses</option>
            <option value="Pending Review" className={isVillager ? "bg-emerald-950 text-white" : ""}>Pending Review</option>
            <option value="Assigned" className={isVillager ? "bg-emerald-950 text-white" : ""}>Assigned</option>
            <option value="Action In Progress" className={isVillager ? "bg-emerald-950 text-white" : ""}>Action In Progress</option>
            <option value="Verified" className={isVillager ? "bg-emerald-950 text-white" : ""}>Verified</option>
            <option value="Closed" className={isVillager ? "bg-emerald-950 text-white" : ""}>Closed</option>
          </select>
        </div>

        {/* Time Window Filter */}
        <div>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value ? Number(e.target.value) : "")}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer focus:outline-none ${
              isVillager
                ? "bg-emerald-900/70 border border-emerald-500/30 text-white focus:border-amber-400"
                : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-600 focus:bg-white"
            }`}
          >
            <option value="" className={isVillager ? "bg-emerald-950 text-white" : ""}>All Time Records</option>
            <option value="1" className={isVillager ? "bg-emerald-950 text-white" : ""}>Last 24 Hours</option>
            <option value="7" className={isVillager ? "bg-emerald-950 text-white" : ""}>Last 7 Days</option>
            <option value="30" className={isVillager ? "bg-emerald-950 text-white" : ""}>Last 30 Days</option>
            <option value="90" className={isVillager ? "bg-emerald-950 text-white" : ""}>Last 90 Days</option>
          </select>
        </div>

      </div>

      {/* Main Map View & Selected Detail Sidepanel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Map Container */}
        <div className={selectedFeature ? "lg:col-span-3" : "lg:col-span-4"}>
          <GISMapComponent
            features={filteredFeatures}
            selectedFeatureId={selectedFeature?.id}
            onSelectFeature={(feat) => setSelectedFeature(feat)}
            onRefresh={fetchData}
            height="h-[620px]"
          />
        </div>

        {/* Selected Record Detail Sidebar */}
        {selectedFeature && (
          <div className={`lg:col-span-1 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${
            isVillager
              ? "bg-emerald-950/65 border border-emerald-500/30 text-white backdrop-blur-md"
              : "bg-white border border-slate-200 text-slate-900"
          }`}>
            <div className="space-y-4">
              
              <div className={`flex items-center justify-between pb-3 border-b ${
                isVillager ? "border-emerald-500/20" : "border-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedFeature.type === 'incident' ? 'bg-rose-500' :
                    selectedFeature.type === 'camera' ? 'bg-emerald-600' :
                    selectedFeature.type === 'detection' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}></span>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                    isVillager ? "text-emerald-300" : "text-slate-500"
                  }`}>
                    {selectedFeature.type} Details
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className={`p-1 rounded-lg transition ${
                    isVillager ? "hover:bg-emerald-900/60 text-emerald-300 hover:text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedFeature.image && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={selectedFeature.image}
                    alt={selectedFeature.name}
                    className="w-full h-36 object-cover"
                    onError={(e: any) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}

              <div>
                <h3 className={`text-base font-black ${isVillager ? "text-white" : "text-slate-900"}`}>{selectedFeature.name}</h3>
                <span className={`text-xs font-mono font-bold ${isVillager ? "text-emerald-300" : "text-slate-400"}`}>{selectedFeature.id}</span>
              </div>

              {selectedFeature.species && (
                <div className={`p-2.5 rounded-xl text-xs ${
                  isVillager
                    ? "bg-emerald-900/70 border border-emerald-500/30 text-white"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-950"
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
                    isVillager ? "text-amber-300" : "text-emerald-700"
                  }`}>Reported Wildlife:</span>
                  <span className="text-sm font-extrabold text-white">{selectedFeature.species}</span>
                  {selectedFeature.animal_count && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isVillager ? "bg-amber-400 text-emerald-950 font-black" : "bg-emerald-200 text-emerald-900"
                    }`}>
                      Count: {selectedFeature.animal_count}
                    </span>
                  )}
                  {selectedFeature.confidence && (
                    <span className={`block text-[11px] mt-1 ${
                      isVillager ? "text-emerald-200" : "text-emerald-700"
                    }`}>
                      AI Model Confidence: {(selectedFeature.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}

              <div className={`space-y-2 text-xs font-medium ${
                isVillager ? "text-white" : "text-slate-600"
              }`}>
                {selectedFeature.station && (
                  <div className={`flex justify-between py-1 border-b ${
                    isVillager ? "border-emerald-500/20" : "border-slate-100"
                  }`}>
                    <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-400"}>Monitoring Station:</span>
                    <span className={`font-bold ${isVillager ? "text-white" : "text-slate-800"}`}>{selectedFeature.station}</span>
                  </div>
                )}
                {selectedFeature.village && (
                  <div className={`flex justify-between py-1 border-b ${
                    isVillager ? "border-emerald-500/20" : "border-slate-100"
                  }`}>
                    <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-400"}>Village / Sector:</span>
                    <span className={`font-bold ${isVillager ? "text-white" : "text-slate-800"}`}>{selectedFeature.village}</span>
                  </div>
                )}
                {selectedFeature.timestamp && (
                  <div className={`flex justify-between py-1 border-b ${
                    isVillager ? "border-emerald-500/20" : "border-slate-100"
                  }`}>
                    <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-400"}>Logged At:</span>
                    <span className={`font-bold font-mono text-[11px] ${isVillager ? "text-white" : "text-slate-800"}`}>
                      {new Date(selectedFeature.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedFeature.severity && (
                  <div className={`flex justify-between py-1 border-b ${
                    isVillager ? "border-emerald-500/20" : "border-slate-100"
                  }`}>
                    <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-400"}>Conflict Severity:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      selectedFeature.severity === 'Critical' ? 'bg-rose-500 text-white font-bold' :
                      selectedFeature.severity === 'High' ? 'bg-amber-400 text-emerald-950 font-bold' : 'bg-emerald-500 text-white font-bold'
                    }`}>
                      {selectedFeature.severity}
                    </span>
                  </div>
                )}
                <div className={`flex justify-between py-1 border-b font-mono text-[11px] ${
                  isVillager ? "border-emerald-500/20" : "border-slate-100"
                }`}>
                  <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-400"}>Coordinates:</span>
                  <span className={isVillager ? "text-white font-bold" : "text-slate-700"}>{selectedFeature.lat.toFixed(4)}°, {selectedFeature.lng.toFixed(4)}°</span>
                </div>
              </div>

              {selectedFeature.description && (
                <div className={`p-2.5 rounded-xl text-xs italic ${
                  isVillager ? "bg-emerald-900/60 border border-emerald-500/20 text-white" : "bg-slate-50 text-slate-600"
                }`}>
                  "{selectedFeature.description}"
                </div>
              )}

            </div>

            {/* Quick Action Link */}
            {selectedFeature.type === "incident" && selectedFeature.db_id && (
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={
                    user?.role === "Admin"
                      ? `/admin/incidents/${selectedFeature.db_id}`
                      : user?.role === "Range Forest Officer"
                      ? `/officer/incidents/${selectedFeature.db_id}`
                      : user?.role === "Forest Guard"
                      ? `/guard/incidents/${selectedFeature.db_id}`
                      : `/villager/my-reports`
                  }
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                    isVillager
                      ? "bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black shadow-amber-950/20"
                      : "bg-emerald-900 hover:bg-emerald-950 text-white"
                  }`}
                >
                  <span>{isVillager ? "View Incident Details" : "Review Incident Report"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Telemetry Summary & Missing Coordinates Diagnostic Bar */}
      <div className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs transition-all ${
        isVillager
          ? "bg-emerald-950/45 border border-emerald-500/25 text-white backdrop-blur-md"
          : "bg-emerald-950/[0.03] border border-emerald-950/10"
      }`}>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className={isVillager ? "text-emerald-200/80 font-medium" : "text-slate-500 font-medium"}>Mapped Incidents: </span>
            <strong className={isVillager ? "text-amber-300 font-black" : "text-emerald-950"}>{analytics.valid_incidents || 0} / {analytics.total_incidents || 0}</strong>
            {analytics.incidents_missing_coords > 0 && (
              <span className="ml-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                ({analytics.incidents_missing_coords} without GPS coordinates)
              </span>
            )}
          </div>

          {!isVillager && (
            <>
              <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

              <div>
                <span className="text-slate-500 font-medium">Camera Traps: </span>
                <strong className="text-emerald-950">{analytics.valid_cameras || 0} Deployed</strong>
              </div>

              <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

              <div>
                <span className="text-slate-500 font-medium">AI Wildlife Detections: </span>
                <strong className="text-emerald-950">{analytics.valid_detections || 0} Logged</strong>
              </div>
            </>
          )}
        </div>

        <div className={`text-[11px] font-medium ${isVillager ? "text-emerald-200/80" : "text-slate-500"}`}>
          Default Layer: <strong className={isVillager ? "text-white" : "text-emerald-900"}>Esri Satellite/Terrain</strong>
        </div>
      </div>

    </div>
  )
}
