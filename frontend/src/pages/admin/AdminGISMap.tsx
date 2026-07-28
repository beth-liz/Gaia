import { useState } from "react"
import GISMapComponent, { type GISFeature, INITIAL_GIS_FEATURES } from "@/components/gis/GISMapComponent"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Map, Crosshair } from "lucide-react"

export default function AdminGISMap() {
  const [selectedFeature, setSelectedFeature] = useState<GISFeature | null>(INITIAL_GIS_FEATURES[0])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFeatures = INITIAL_GIS_FEATURES.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.species && f.species.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-3">
      
      {/* ArcGIS Style Operational Header */}
      <div className="bg-white border border-[#dcd8cd] rounded p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              GIS Spatial Command & Telemetry Center
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Interactive Spatial Grid • Muthanga & Silent Valley Wildlife Corridors • Real-Time GPS Vectors
            </p>
          </div>
        </div>

        {/* Spatial Search & Filter Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search station, node ID, species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f5f2] border border-[#dcd8cd] rounded pl-8 pr-3 py-1.5 text-xs text-[#0f291e] focus:outline-none focus:border-[#1b4332]"
            />
          </div>
          <Button size="sm" variant="outline">
            <Crosshair className="h-3.5 w-3.5 mr-1" /> Center HQ Grid
          </Button>
        </div>
      </div>

      {/* Main Spatial Viewport Layout: Left Layer Drawer + Center Map + Right Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Feature Roster List (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#dcd8cd] rounded overflow-hidden flex flex-col h-[650px]">
          <div className="bg-[#f0eee8] px-3.5 py-2.5 border-b border-[#dcd8cd] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">Active GIS Nodes ({filteredFeatures.length})</span>
            <span className="text-[10px] text-[#6b705c] font-mono">LIVE API</span>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-[#e8e5dc] p-1">
            {filteredFeatures.map(feat => (
              <div 
                key={feat.id}
                onClick={() => setSelectedFeature(feat)}
                className={`p-2.5 rounded cursor-pointer transition text-xs space-y-1 ${
                  selectedFeature?.id === feat.id ? "bg-[#eaf2ed] border-l-4 border-[#1b4332]" : "hover:bg-[#f4f3ef]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gray-500 font-bold">{feat.id}</span>
                  <Badge variant={feat.status === "critical" ? "critical" : feat.status === "warning" ? "warning" : "default"}>
                    {feat.type}
                  </Badge>
                </div>
                <p className="font-bold text-[#0f291e] leading-snug">{feat.name}</p>
                {feat.species && (
                  <p className="text-[11px] text-[#1b4332] font-semibold">{feat.species}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                  <span>Lat: {feat.lat.toFixed(3)}</span>
                  <span>Lng: {feat.lng.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Spatial Map Viewport (6 Cols) */}
        <div className="lg:col-span-6 space-y-2">
          <GISMapComponent 
            height="h-[650px]" 
            onSelectFeature={(feat) => setSelectedFeature(feat)}
            selectedFeatureId={selectedFeature?.id}
          />
        </div>

        {/* Right Spatial Inspection Panel (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#dcd8cd] rounded overflow-hidden flex flex-col h-[650px] space-y-0">
          <div className="bg-[#f0eee8] px-3.5 py-2.5 border-b border-[#dcd8cd] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">Telemetry Detail Drawer</span>
            <Badge variant={selectedFeature?.status === "critical" ? "critical" : "default"}>
              {selectedFeature?.status || "SELECT NODE"}
            </Badge>
          </div>

          {selectedFeature ? (
            <div className="p-4 space-y-3 flex-grow overflow-y-auto">
              
              {/* Feature Thumbnail */}
              {selectedFeature.image ? (
                <div className="relative rounded overflow-hidden border border-[#dcd8cd] h-44">
                  <img src={selectedFeature.image} alt={selectedFeature.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-[#0f291e]/90 text-white text-[9px] px-2 py-0.5 font-mono rounded">
                    THERMAL FRAME LOG
                  </div>
                </div>
              ) : (
                <div className="h-28 bg-[#f6f5f2] border border-[#dcd8cd] rounded flex items-center justify-center text-xs text-gray-500 font-mono">
                  [ NO OPTICAL FEED - SENSOR ONLINE ]
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-[#0f291e]">{selectedFeature.name}</h3>
                <p className="text-xs text-[#6b705c] font-medium">{selectedFeature.sector}</p>
              </div>

              {selectedFeature.species && (
                <div className="p-2.5 bg-[#edf7ee] border border-[#b8e2be] rounded space-y-1">
                  <span className="text-[10px] font-bold text-[#2e6f40] uppercase">AI Classification:</span>
                  <p className="text-xs font-bold text-[#0f291e]">{selectedFeature.species}</p>
                  <p className="text-[11px] text-emerald-800 font-mono">Confidence: {selectedFeature.confidence}%</p>
                </div>
              )}

              <div className="bg-[#f6f5f2] p-2.5 border border-[#e8e5dc] rounded text-xs space-y-1 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Node ID:</span>
                  <span className="font-bold text-gray-900">{selectedFeature.id}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Latitude:</span>
                  <span className="font-bold text-gray-900">{selectedFeature.lat.toFixed(5)}° N</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Longitude:</span>
                  <span className="font-bold text-gray-900">{selectedFeature.lng.toFixed(5)}° E</span>
                </div>
                {selectedFeature.battery && (
                  <div className="flex justify-between text-gray-600">
                    <span>Power Cell:</span>
                    <span className="font-bold text-emerald-700">{selectedFeature.battery}%</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Operational Notes:</span>
                <p className="text-xs text-gray-700 leading-snug">{selectedFeature.details}</p>
              </div>

              <div className="pt-3 border-t border-[#e8e5dc] space-y-2">
                <Button className="w-full">
                  Trigger Tactical Dispatch
                </Button>
                <Button variant="outline" className="w-full">
                  Download GeoJSON Log
                </Button>
              </div>

            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">
              Select a node marker on the GIS viewport to inspect telemetry details.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
