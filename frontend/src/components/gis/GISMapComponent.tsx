import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet.heat"

export interface GISFeature {
  id: string
  type: "camera" | "acoustic" | "ranger" | "incident" | "village"
  name: string
  lat: number
  lng: number
  status: "active" | "critical" | "warning" | "offline"
  species?: string
  confidence?: number
  timestamp?: string
  image?: string
  sector?: string
  battery?: number
  assignedUnit?: string
  details?: string
  severity?: string
}

interface GISMapComponentProps {
  onSelectFeature?: (feature: GISFeature) => void
  selectedFeatureId?: string | null
  height?: string
  features?: GISFeature[]
  showHeatmap?: boolean
  onRefresh?: () => Promise<void> | void
}

// Removed INITIAL_GIS_FEATURES as fake data is prohibited

export default function GISMapComponent({ 
  onSelectFeature, 
  selectedFeatureId,
  height = "h-[650px]",
  features: propFeatures,
  showHeatmap = false,
  onRefresh
}: GISMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const heatLayerRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const circlesRef = useRef<L.Circle[]>([])
  const polylinesRef = useRef<L.Polyline[]>([])

  const [tileProvider, setTileProvider] = useState<"carto" | "osm" | "satellite">("osm")
  const [layers, setLayers] = useState({
    incidents: true,
    cameras: true,
    acoustics: true,
    rangers: true,
    villages: true,
    corridors: true,
    buffers: true
  })

  const [features, setFeatures] = useState<GISFeature[]>(propFeatures || [])

  useEffect(() => {
    if (propFeatures) setFeatures(propFeatures)
  }, [propFeatures])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  // Tile Provider Layer Definitions
  const tileUrls = {
    carto: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  }

  const tileAttributions = {
    carto: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
  }

  const getTileOptions = (provider: string) => ({
    attribution: tileAttributions[provider as keyof typeof tileAttributions],
    maxZoom: provider === "satellite" ? 17 : 19
  })

  // Simulated API call to refresh map telemetry data
  const handleFetchLiveTelemetry = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (e) {
        console.error("Telemetry fetch error", e)
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [11.6054, 76.2731],
        zoom: 13,
        zoomControl: false
      })

      L.control.zoom({ position: "bottomright" }).addTo(map)

      L.tileLayer(tileUrls[tileProvider], getTileOptions(tileProvider)).addTo(map)

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })

    L.tileLayer(tileUrls[tileProvider], getTileOptions(tileProvider)).addTo(map)
  }, [tileProvider])

  // Render Features & Custom SVG Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear existing markers & shapes
    Object.values(markersRef.current).forEach(m => map.removeLayer(m))
    markersRef.current = {}
    circlesRef.current.forEach(c => map.removeLayer(c))
    circlesRef.current = []
    polylinesRef.current.forEach(p => map.removeLayer(p))
    polylinesRef.current = []
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    // 1. Draw Wildlife Migration Corridor (Polyline overlay)
    // No real backend data for corridors yet.
    if (layers.corridors) {
      // Future implementation: Fetch corridors from API
    }

    // 2. Draw Features (Incidents, Cameras, Acoustics, Rangers, Villages)
    features.forEach(feat => {
      let isVisible = false
      if (feat.type === "incident" && layers.incidents && !showHeatmap) isVisible = true
      if (feat.type === "camera" && layers.cameras) isVisible = true
      if (feat.type === "acoustic" && layers.acoustics) isVisible = true
      if (feat.type === "ranger" && layers.rangers) isVisible = true
      if (feat.type === "village" && layers.villages) isVisible = true

      if (!isVisible) return

      let iconHtml = ""
      let bgClass = "bg-[#1b4332]"
      let size = 32

      if (feat.type === "incident") {
        bgClass = feat.status === "critical" ? "bg-rose-700 pulse-red-ring" : "bg-amber-600"
        size = 36
        iconHtml = `<div class="${bgClass} text-white w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-md text-xs font-black">
          ⚠
        </div>`
      } else if (feat.type === "camera") {
        iconHtml = `<div class="bg-[#1b4332] text-white w-8 h-8 rounded-md flex items-center justify-center border-2 border-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </div>`
      } else if (feat.type === "acoustic") {
        iconHtml = `<div class="bg-[#2d5a3f] text-white w-8 h-8 rounded-md flex items-center justify-center border-2 border-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
        </div>`
      } else if (feat.type === "ranger") {
        iconHtml = `<div class="bg-blue-800 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>`
      } else if (feat.type === "village") {
        iconHtml = `<div class="bg-amber-800 text-white w-8 h-8 rounded-md flex items-center justify-center border-2 border-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </div>`
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-div-icon",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })

      const marker = L.marker([feat.lat, feat.lng], { icon: customIcon }).addTo(map)

      const popupHtml = `
        <div class="w-64 bg-white text-gray-900 rounded overflow-hidden">
          ${feat.image ? `<img src="${feat.image}" class="w-full h-28 object-cover border-b border-gray-200" />` : ""}
          <div class="p-3">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                feat.status === "critical" ? "bg-rose-100 text-rose-800" :
                feat.status === "warning" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }">
                ${feat.status}
              </span>
              <span class="text-[10px] text-gray-500 font-mono">${feat.id}</span>
            </div>
            <h4 class="text-xs font-bold text-gray-900 leading-snug">${feat.name}</h4>
            <p class="text-[11px] text-gray-600 mt-1">${feat.sector || "Sanctuary Perimeter"}</p>
            ${feat.species ? `<p class="text-[11px] font-semibold text-emerald-900 mt-1 font-sans">Detect: ${feat.species}</p>` : ""}
            <div class="mt-2.5 pt-2 border-t border-gray-150 flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Lat: ${feat.lat.toFixed(4)}</span>
              <span>Lng: ${feat.lng.toFixed(4)}</span>
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

      if (feat.type === "village" && layers.buffers) {
        const circle1 = L.circle([feat.lat, feat.lng], {
          radius: 1000,
          color: "#92400e",
          weight: 1,
          fillColor: "#fffbe6",
          fillOpacity: 0.15
        }).addTo(map)

        const circle2 = L.circle([feat.lat, feat.lng], {
          radius: 3000,
          color: "#6b705c",
          weight: 1,
          dashArray: "4, 4",
          fillColor: "transparent"
        }).addTo(map)

        circlesRef.current.push(circle1, circle2)
      }
    })
  }, [features, layers])

  // Center on selected feature
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
  }, [selectedFeatureId])

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    // Draw Heatmap if enabled
    if (showHeatmap && typeof (L as any).heatLayer === "function") {
      const heatPoints = features
        .filter(f => f.type === "incident")
        .map(f => [f.lat, f.lng, f.severity === "Critical" ? 1.0 : f.severity === "High" ? 0.8 : f.severity === "Medium" ? 0.5 : 0.3])
      if (heatPoints.length > 0) {
        heatLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map)
      }
    }
    
    return () => {
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }
    }
  }, [features, showHeatmap]);


  return (
    <div className="relative w-full border border-[#dcd8cd] rounded bg-white overflow-hidden shadow-xs">
      
      {/* Map Control Bar Top */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#f0eee8] border-b border-[#dcd8cd] text-xs font-semibold text-[#1b2e25]">
        
        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b705c] mr-1">GIS Layers:</span>
          
          <button
            onClick={() => setLayers(l => ({ ...l, incidents: !l.incidents }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.incidents ? "bg-rose-800 text-white border-rose-900" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            ⚠ Incidents
          </button>

          <button
            onClick={() => setLayers(l => ({ ...l, cameras: !l.cameras }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.cameras ? "bg-[#1b4332] text-white border-[#0f291e]" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            📷 Camera Traps
          </button>

          <button
            onClick={() => setLayers(l => ({ ...l, acoustics: !l.acoustics }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.acoustics ? "bg-[#2d5a3f] text-white border-[#1b4332]" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            🎙 Acoustics
          </button>

          <button
            onClick={() => setLayers(l => ({ ...l, rangers: !l.rangers }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.rangers ? "bg-blue-800 text-white border-blue-900" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            🛡 Rangers
          </button>

          <button
            onClick={() => setLayers(l => ({ ...l, villages: !l.villages }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.villages ? "bg-amber-800 text-white border-amber-900" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            🏠 Villages
          </button>

          <button
            onClick={() => setLayers(l => ({ ...l, corridors: !l.corridors }))}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition ${
              layers.corridors ? "bg-emerald-800 text-white border-emerald-900" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            ⚡ Corridors
          </button>
        </div>

        {/* Tile Provider Select & Telemetry Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={tileProvider}
              onChange={(e: any) => setTileProvider(e.target.value)}
              className="appearance-none bg-white border border-emerald-200 rounded-md text-[11px] font-bold px-3 py-1.5 pr-8 text-emerald-950 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all shadow-sm cursor-pointer"
            >
              <option value="osm">🗺️ OpenStreetMap (Default)</option>
              <option value="carto">🗺️ Carto Light (Clean)</option>
              <option value="satellite">🛰️ Esri Satellite (Terrain)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-700">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          <button
            onClick={handleFetchLiveTelemetry}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-[#1b4332] hover:bg-[#143326] text-white px-2.5 py-1 rounded text-[11px] font-bold transition disabled:opacity-50"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
            <span>{isRefreshing ? "Syncing API..." : "Sync Telemetry"}</span>
          </button>
        </div>

      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className={`w-full ${height}`} />

      {/* Map Footer Bar: Coordinates & Status */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white border-t border-[#dcd8cd] text-[11px] font-mono text-gray-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>API Telemetry Stream: Live</span>
          </span>
          <span className="text-gray-300">|</span>
          <span>Center: 11.6054° N, 76.2731° E</span>
          <span className="text-gray-300">|</span>
          <span>Grid Ref: WYN-SECTOR-4</span>
        </div>
        <div>
          <span>Last Sync: {lastUpdated}</span>
        </div>
      </div>

    </div>
  )
}
