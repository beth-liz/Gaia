import { useEffect, useRef, useState } from "react"
import L from "leaflet"

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
}

interface GISMapComponentProps {
  onSelectFeature?: (feature: GISFeature) => void
  selectedFeatureId?: string | null
  height?: string
}

// Initial mock dataset representing telemetry coordinates around Muthanga / Bandipur Sanctuary
export const INITIAL_GIS_FEATURES: GISFeature[] = [
  {
    id: "INC-9941",
    type: "incident",
    name: "Wild Elephant Herd Intrusion",
    lat: 11.6154,
    lng: 76.2831,
    status: "critical",
    species: "Asian Elephant (Elephas maximus)",
    confidence: 96.4,
    timestamp: "12 mins ago",
    image: "/images/elephant1.jpg",
    sector: "Sector 4 - Muthanga North",
    assignedUnit: "Patrol Unit Bravo-2",
    details: "Herd of 6 elephants moving south-east towards Chundale settlement perimeter. Early warning siren activated."
  },
  {
    id: "INC-9938",
    type: "incident",
    name: "Bengal Tiger Sighting",
    lat: 11.5912,
    lng: 76.2514,
    status: "warning",
    species: "Bengal Tiger (Panthera tigris)",
    confidence: 91.8,
    timestamp: "38 mins ago",
    image: "/images/tiger1.jpg",
    sector: "Sector 2 - Pulpally West",
    assignedUnit: "Ranger Team Alpha",
    details: "Adult male tiger recorded crossing primary arterial road. Traffic warning advisory deployed."
  },
  {
    id: "CAM-NORTH-04",
    type: "camera",
    name: "Thermal Node CAM-N04",
    lat: 11.6288,
    lng: 76.2910,
    status: "active",
    species: "Spotted Deer (Axis axis)",
    confidence: 98.1,
    timestamp: "3 mins ago",
    image: "/images/deer.jpg",
    sector: "Sector 4 - Muthanga North",
    battery: 94,
    details: "Dual-spectrum thermal vision active. High herd activity logged."
  },
  {
    id: "CAM-SOUTH-09",
    type: "camera",
    name: "Thermal Node CAM-S09",
    lat: 11.5780,
    lng: 76.2405,
    status: "active",
    battery: 88,
    image: "/images/wildboar1.jpg",
    sector: "Sector 1 - Sulthan Bathery",
    species: "Wild Boar (Sus scrofa)",
    confidence: 89.2,
    timestamp: "1 hour ago",
    details: "Infrared motion sensor triggered near agricultural border."
  },
  {
    id: "ACS-NODE-12",
    type: "acoustic",
    name: "Acoustic Bio-Node ACS-12",
    lat: 11.6020,
    lng: 76.2650,
    status: "active",
    battery: 92,
    sector: "Sector 3 - Kurichiad",
    details: "Low-frequency trumpet resonance audio spectrum recorded. Spectrogram pattern matches matriarch elephant."
  },
  {
    id: "RNG-BRAVO-1",
    type: "ranger",
    name: "Patrol Unit Bravo-1",
    lat: 11.6100,
    lng: 76.2750,
    status: "active",
    sector: "Sector 4 - Muthanga North",
    assignedUnit: "Lead Officer M. Jose",
    details: "Tactical vehicle unit equipped with acoustic determent sirens and thermal scopes."
  },
  {
    id: "RNG-ALPHA-3",
    type: "ranger",
    name: "Ranger Unit Alpha-3",
    lat: 11.5850,
    lng: 76.2480,
    status: "active",
    sector: "Sector 2 - Pulpally West",
    assignedUnit: "Ranger S. Raman",
    details: "Foot patrol unit conducting perimeter fence integrity inspection."
  },
  {
    id: "VLG-CHUNDALE",
    type: "village",
    name: "Chundale Settlement",
    lat: 11.6220,
    lng: 76.3050,
    status: "warning",
    sector: "Sector 4 Buffer Zone",
    details: "Pop: 420. Solar fence 100% operational. High-decibel warning sirens active."
  },
  {
    id: "VLG-PULPALLY",
    type: "village",
    name: "Pulpally Border Village",
    lat: 11.5720,
    lng: 76.2300,
    status: "active",
    sector: "Sector 1 Buffer Zone",
    details: "Pop: 850. Buffer clearance 250m. Bio-fence active."
  }
]

export default function GISMapComponent({
  onSelectFeature,
  selectedFeatureId,
  height = "h-[650px]"
}: GISMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const circlesRef = useRef<L.Circle[]>([])
  const polylinesRef = useRef<L.Polyline[]>([])

  const [tileProvider, setTileProvider] = useState<"carto" | "osm" | "satellite">("carto")
  const [layers, setLayers] = useState({
    incidents: true,
    cameras: true,
    acoustics: true,
    rangers: true,
    villages: true,
    corridors: true,
    buffers: true
  })

  const [features, setFeatures] = useState<GISFeature[]>(INITIAL_GIS_FEATURES)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())

  // Tile Provider Layer Definitions
  const tileUrls = {
    carto: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  }

  const tileAttributions = {
    carto: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
  }

  // Simulated API call to refresh map telemetry data
  const handleFetchLiveTelemetry = async () => {
    setIsRefreshing(true)
    try {
      await new Promise(res => setTimeout(res, 800))
      
      setFeatures(prev => prev.map(feat => {
        if (feat.type === "ranger") {
          return {
            ...feat,
            lat: feat.lat + (Math.random() * 0.002 - 0.001),
            lng: feat.lng + (Math.random() * 0.002 - 0.001),
            timestamp: "Just now"
          }
        }
        return feat
      }))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error("Telemetry fetch error", e)
    } finally {
      setIsRefreshing(false)
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

      L.tileLayer(tileUrls[tileProvider], {
        attribution: tileAttributions[tileProvider],
        maxZoom: 19
      }).addTo(map)

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

    L.tileLayer(tileUrls[tileProvider], {
      attribution: tileAttributions[tileProvider],
      maxZoom: 19
    }).addTo(map)
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

    // 1. Draw Wildlife Migration Corridor (Polyline overlay)
    if (layers.corridors) {
      const corridorPath: [number, number][] = [
        [11.6450, 76.3100],
        [11.6300, 76.2950],
        [11.6154, 76.2831],
        [11.5950, 76.2600],
        [11.5750, 76.2350]
      ]
      const poly = L.polyline(corridorPath, {
        color: "#2d5a3f",
        weight: 4,
        dashArray: "8, 6",
        opacity: 0.85
      }).addTo(map)
      poly.bindTooltip("Elephant Migration Corridor Alpha-1", { sticky: true })
      polylinesRef.current.push(poly)
    }

    // 2. Draw Features (Incidents, Cameras, Acoustics, Rangers, Villages)
    features.forEach(feat => {
      let isVisible = false
      if (feat.type === "incident" && layers.incidents) isVisible = true
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
          <select
            value={tileProvider}
            onChange={(e: any) => setTileProvider(e.target.value)}
            className="bg-white border border-[#dcd8cd] rounded text-[11px] font-semibold px-2 py-1 text-gray-800 focus:outline-none focus:border-[#1b4332]"
          >
            <option value="carto">Map: CARTO Voyager</option>
            <option value="osm">Map: OpenStreetMap Standard</option>
            <option value="satellite">Map: Esri Satellite</option>
          </select>

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
