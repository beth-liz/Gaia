import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet.heat"
import { MAP_TILE_PROVIDERS, DEFAULT_TILE_PROVIDER, type TileProviderKey } from "./mapLayers"

export interface GISFeature {
  id: string
  db_id?: number
  type: "incident" | "camera" | "detection" | "station" | "village"
  name: string
  lat: number
  lng: number
  status: "active" | "critical" | "warning" | "offline"
  species?: string
  animal_count?: number
  confidence?: number
  timestamp?: string
  image?: string
  sector?: string
  details?: string
  severity?: string
  description?: string
  village?: string
  station?: string
  camera_code?: string
  camera_name?: string
  review_status?: string
  linked_incident_ref?: string
  location_name?: string
  address?: string
}

interface GISMapComponentProps {
  onSelectFeature?: (feature: GISFeature | null) => void
  selectedFeatureId?: string | null
  height?: string
  features?: GISFeature[]
  showHeatmap?: boolean
  heatmapIntensityWeights?: { [key: string]: number }
  heatmapDataMode?: "incidents" | "detections" | "combined"
  onRefresh?: () => Promise<void> | void
  initialTileProvider?: TileProviderKey
}

export default function GISMapComponent({ 
  onSelectFeature, 
  selectedFeatureId,
  height = "h-[650px]",
  features = [],
  showHeatmap = false,
  heatmapDataMode = "incidents",
  onRefresh,
  initialTileProvider = DEFAULT_TILE_PROVIDER
}: GISMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const currentTileLayerRef = useRef<L.TileLayer | null>(null)
  const heatLayerRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  const [tileProvider, setTileProvider] = useState<TileProviderKey>(initialTileProvider)
  
  // Visibility layer toggles (for GIS Mapping mode)
  const [layers, setLayers] = useState({
    incidents: true,
    cameras: true,
    detections: true,
    stations: true
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [11.6054, 76.2731],
        zoom: 12,
        zoomControl: false
      })

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Add Initial Tile Layer
      const cfg = MAP_TILE_PROVIDERS[tileProvider]
      const tileLayer = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains || ["a", "b", "c"]
      }).addTo(map)
      currentTileLayerRef.current = tileLayer

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 2. Tile Provider Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current)
      currentTileLayerRef.current = null
    }

    const cfg = MAP_TILE_PROVIDERS[tileProvider]
    const tileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || ["a", "b", "c"]
    }).addTo(map)
    currentTileLayerRef.current = tileLayer
  }, [tileProvider])

  // 3. Render Features & Markers (When not in pure heatmap mode or when toggles are enabled)
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear previous markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m))
    markersRef.current = {}

    // In heatmap mode, we typically only show markers if explicitly wanted, but in mapping mode we render markers
    if (showHeatmap) {
      // In heatmap mode, render lightweight reference markers for stations if enabled
      return
    }

    const validFeatures = features.filter(feat => {
      const lat = typeof feat.lat === "number" ? feat.lat : parseFloat(String(feat.lat))
      const lng = typeof feat.lng === "number" ? feat.lng : parseFloat(String(feat.lng))
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    })

    validFeatures.forEach(feat => {
      let isVisible = false
      if (feat.type === "incident" && layers.incidents) isVisible = true
      if (feat.type === "camera" && layers.cameras) isVisible = true
      if (feat.type === "detection" && layers.detections) isVisible = true
      if (feat.type === "station" && layers.stations) isVisible = true

      if (!isVisible) return

      let iconHtml = ""
      let size = 32

      if (feat.type === "incident") {
        const bg = feat.status === "critical" ? "bg-rose-600 ring-4 ring-rose-400/40" : (feat.status === "warning" ? "bg-amber-500 ring-2 ring-amber-300" : "bg-emerald-700")
        size = 36
        iconHtml = `<div class="${bg} text-white w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-sm font-black transition-transform hover:scale-110">
          ⚠️
        </div>`
      } else if (feat.type === "camera") {
        size = 32
        const bg = feat.status === "active" ? "bg-emerald-800" : "bg-slate-600"
        iconHtml = `<div class="${bg} text-white w-8 h-8 rounded-lg flex items-center justify-center border-2 border-white shadow-md transition-transform hover:scale-110">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </div>`
      } else if (feat.type === "detection") {
        size = 32
        const bg = feat.status === "critical" ? "bg-purple-700 ring-2 ring-purple-400" : "bg-indigo-600"
        iconHtml = `<div class="${bg} text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md text-xs font-bold transition-transform hover:scale-110">
          🐾
        </div>`
      } else if (feat.type === "station") {
        size = 32
        iconHtml = `<div class="bg-blue-900 text-white w-8 h-8 rounded-md flex items-center justify-center border-2 border-white shadow-md transition-transform hover:scale-110">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>`
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "gaia-gis-marker-icon",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })

      const marker = L.marker([feat.lat, feat.lng], { icon: customIcon }).addTo(map)

      // Bind detailed popup
      const popupHtml = `
        <div class="w-68 bg-white text-slate-900 rounded-lg overflow-hidden font-sans text-xs shadow-md">
          ${feat.image ? `<img src="${feat.image}" class="w-full h-28 object-cover border-b border-slate-200" onerror="this.style.display='none'"/>` : ""}
          <div class="p-3 space-y-1.5">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                feat.type === 'incident' ? 'bg-rose-100 text-rose-800' :
                feat.type === 'camera' ? 'bg-emerald-100 text-emerald-800' :
                feat.type === 'detection' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }">
                ${feat.type.toUpperCase()}
              </span>
              <span class="text-[10px] text-slate-500 font-mono">${feat.id}</span>
            </div>

            <h4 class="text-sm font-bold text-slate-900 leading-snug">${feat.name}</h4>

            ${feat.species ? `<div class="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px] font-semibold">
              <strong>Wildlife Species:</strong> ${feat.species} ${feat.animal_count ? `(${feat.animal_count} detected)` : ''}
              ${feat.confidence ? `<br/><span class="text-[10px] text-emerald-700">AI Confidence: ${(feat.confidence * 100).toFixed(0)}%</span>` : ''}
            </div>` : ''}

            ${feat.details ? `<p class="text-[11px] text-slate-600">${feat.details}</p>` : ''}
            ${feat.description ? `<p class="text-[11px] text-slate-500 italic line-clamp-2">"${feat.description}"</p>` : ''}

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Lat: ${feat.lat.toFixed(4)}°</span>
              <span>Lng: ${feat.lng.toFixed(4)}°</span>
            </div>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)

      marker.on("click", () => {
        if (onSelectFeature) {
          onSelectFeature(feat)
        }
      })

      markersRef.current[feat.id] = marker
    })

    // If there are valid markers and this is first mount/load, fit bounds
    if (validFeatures.length > 0 && !selectedFeatureId) {
      const group = L.featureGroup(Object.values(markersRef.current))
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 })
      }
    }
  }, [features, layers, showHeatmap])

  // 4. Center & highlight on selectedFeatureId
  useEffect(() => {
    if (!selectedFeatureId || !mapInstanceRef.current) return
    const feat = features.find(f => f.id === selectedFeatureId)
    if (feat) {
      mapInstanceRef.current.flyTo([feat.lat, feat.lng], 15, { duration: 1.2 })
      const marker = markersRef.current[feat.id]
      if (marker) {
        marker.openPopup()
      }
    }
  }, [selectedFeatureId, features])

  // 5. Render Heatmap Overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (showHeatmap && typeof (L as any).heatLayer === "function") {
      const heatPoints: [number, number, number][] = []

      // Collect linked detection IDs from incidents to avoid double-counting in combined mode
      const linkedDetectionDbIds = new Set<number>()
      if (heatmapDataMode === "combined") {
        features.forEach(f => {
          if (f.type === "incident" && (f as any).camera_detection_event_id) {
            linkedDetectionDbIds.add((f as any).camera_detection_event_id)
          }
        })
      }

      // Filter features based on active heatmapDataMode
      const eligibleFeatures = features.filter(f => {
        if (heatmapDataMode === "incidents") return f.type === "incident"
        if (heatmapDataMode === "detections") return f.type === "detection"
        // In combined mode, skip detection if it is already represented as an official incident
        if (f.type === "detection" && f.db_id && linkedDetectionDbIds.has(f.db_id)) {
          return false
        }
        return f.type === "incident" || f.type === "detection"
      })

      eligibleFeatures.forEach(f => {
        const lat = typeof f.lat === "number" ? f.lat : parseFloat(String(f.lat))
        const lng = typeof f.lng === "number" ? f.lng : parseFloat(String(f.lng))
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          // Weight calculation based on real record intensity
          let weight = 0.5
          if (f.type === "incident") {
            weight = f.severity === "Critical" ? 1.0 : (f.severity === "High" ? 0.8 : (f.severity === "Medium" ? 0.5 : 0.3))
          } else if (f.type === "detection") {
            const count = f.animal_count || 1
            const baseConf = f.confidence || 0.8
            weight = Math.min(1.0, 0.4 + (count * 0.15) * baseConf)
          }
          heatPoints.push([lat, lng, weight])
        }
      })

      if (heatPoints.length > 0) {
        heatLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 28,
          blur: 18,
          maxZoom: 16,
          gradient: {
            0.2: "#0284c7", // Sky blue
            0.4: "#10b981", // Emerald
            0.6: "#eab308", // Yellow
            0.8: "#f97316", // Orange
            1.0: "#ef4444"  // Rose Red
          }
        }).addTo(map)

        // Fit bounds to heatpoints
        const lats = heatPoints.map(p => p[0])
        const lngs = heatPoints.map(p => p[1])
        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40], maxZoom: 14 })
      }
    }

    return () => {
      if (heatLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [features, showHeatmap, heatmapDataMode])

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (err) {
        console.error("Refresh telemetry failed", err)
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  return (
    <div className="relative w-full border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs">
        
        {/* Layer Visibility Toggles (only in Mapping mode) */}
        {!showHeatmap ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">Layers:</span>
            
            <button
              onClick={() => setLayers(l => ({ ...l, incidents: !l.incidents }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                layers.incidents 
                  ? "bg-rose-50 text-rose-800 border-rose-300 shadow-xs" 
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Official Incidents</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, cameras: !l.cameras }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                layers.cameras 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs" 
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Cameras</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, detections: !l.detections }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                layers.detections 
                  ? "bg-purple-50 text-purple-800 border-purple-300 shadow-xs" 
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Wildlife Detections</span>
            </button>

            <button
              onClick={() => setLayers(l => ({ ...l, stations: !l.stations }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                layers.stations 
                  ? "bg-blue-50 text-blue-800 border-blue-300 shadow-xs" 
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Stations</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 animate-pulse"></span>
            <span>Spatial Density Gradient Rendering Active</span>
          </div>
        )}

        {/* Base Map Style Selector & Telemetry Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">Base Map:</span>
            <select
              value={tileProvider}
              onChange={(e) => setTileProvider(e.target.value as TileProviderKey)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {Object.values(MAP_TILE_PROVIDERS).map(provider => (
                <option key={provider.key} value={provider.key}>
                  {provider.icon} {provider.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            title="Refresh GIS spatial data"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>

      </div>

      {/* Map Canvas Element */}
      <div ref={mapContainerRef} className={`w-full ${height}`} />

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Telemetry: Connected</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>Default: Esri Satellite/Terrain</span>
          <span className="text-slate-300">|</span>
          <span>Coverage: Wayanad Wildlife Sanctuary</span>
        </div>
        <div>
          <span>Last Synchronized: {lastUpdated}</span>
        </div>
      </div>

    </div>
  )
}
