import { useState } from "react"
import { Eye, CheckCircle2, Download, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DetectionItem {
  id: string
  nodeId: string
  sector: string
  species: string
  confidence: number
  timestamp: string
  image: string
  verificationStatus: "verified" | "unverified" | "false_positive"
  threatLevel: "critical" | "warning" | "advisory"
}

export default function AdminDetections() {
  const [selectedSpecies, setSelectedSpecies] = useState<string>("All")
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [previewImage, setPreviewImage] = useState<DetectionItem | null>(null)

  const initialDetections: DetectionItem[] = [
    {
      id: "DET-9901",
      nodeId: "CAM-NORTH-04",
      sector: "Sector 4 - Muthanga North",
      species: "Asian Elephant",
      confidence: 96.4,
      timestamp: "2026-07-28 09:42:15",
      image: "/images/elephant1.jpg",
      verificationStatus: "unverified",
      threatLevel: "critical"
    },
    {
      id: "DET-9902",
      nodeId: "CAM-WEST-02",
      sector: "Sector 2 - Pulpally West",
      species: "Bengal Tiger",
      confidence: 91.8,
      timestamp: "2026-07-28 09:15:30",
      image: "/images/tiger1.jpg",
      verificationStatus: "verified",
      threatLevel: "warning"
    },
    {
      id: "DET-9903",
      nodeId: "CAM-SOUTH-09",
      sector: "Sector 1 - Sulthan Bathery",
      species: "Wild Boar Herd",
      confidence: 89.2,
      timestamp: "2026-07-28 08:50:00",
      image: "/images/wildboar1.jpg",
      verificationStatus: "verified",
      threatLevel: "warning"
    },
    {
      id: "DET-9904",
      nodeId: "CAM-EAST-01",
      sector: "Sector 3 - Kurichiad",
      species: "Spotted Deer",
      confidence: 98.1,
      timestamp: "2026-07-28 07:30:12",
      image: "/images/deer.jpg",
      verificationStatus: "verified",
      threatLevel: "advisory"
    },
    {
      id: "DET-9905",
      nodeId: "CAM-NORTH-02",
      sector: "Sector 4 - Muthanga North",
      species: "Bonnet Macaque",
      confidence: 94.5,
      timestamp: "2026-07-28 06:10:45",
      image: "/images/monkey1.jpg",
      verificationStatus: "verified",
      threatLevel: "advisory"
    }
  ]

  const [detections, setDetections] = useState<DetectionItem[]>(initialDetections)

  const handleVerify = (id: string, status: "verified" | "false_positive") => {
    setDetections(prev => prev.map(d => d.id === id ? { ...d, verificationStatus: status } : d))
  }

  const filteredDetections = detections.filter(d => {
    if (selectedSpecies !== "All" && !d.species.toLowerCase().includes(selectedSpecies.toLowerCase())) return false
    if (selectedStatus !== "All" && d.verificationStatus !== selectedStatus) return false
    return true
  })

  return (
    <div className="space-y-4">
      
      {/* Header Bar */}
      <div className="bg-white border border-[#dcd8cd] rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              AI Camera Trap Telemetry & Verification Stream
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Real-time thermal image processing • Neural network confidence scoring • Species classification log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Export Telemetry Data
          </Button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-[#dcd8cd] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#6b705c] uppercase text-[10px]">Filter Species:</span>
          {["All", "Elephant", "Tiger", "Boar", "Deer"].map(sp => (
            <button
              key={sp}
              onClick={() => setSelectedSpecies(sp)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                selectedSpecies === sp ? "bg-[#1b4332] text-white border-[#0f291e]" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {sp}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[#6b705c] uppercase text-[10px]">Verification:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#f6f5f2] border border-[#dcd8cd] rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none"
          >
            <option value="All">All Verification Statuses</option>
            <option value="unverified">Unverified (Pending Review)</option>
            <option value="verified">Verified (Confirmed Sighting)</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Detections Gallery & Table View */}
      <div className="bg-white border border-[#dcd8cd] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="gaia-table">
            <thead>
              <tr>
                <th>Frame Preview</th>
                <th>Detection ID</th>
                <th>Node ID & Sector</th>
                <th>Species Classification</th>
                <th>AI Confidence Score</th>
                <th>Detection Timestamp</th>
                <th>Threat Level</th>
                <th>Verification State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetections.map(det => (
                <tr key={det.id}>
                  <td>
                    <div 
                      onClick={() => setPreviewImage(det)}
                      className="relative w-16 h-12 rounded overflow-hidden border border-gray-300 cursor-pointer group shrink-0"
                    >
                      <img src={det.image} alt={det.species} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs font-bold text-gray-900">{det.id}</td>
                  <td>
                    <p className="font-bold text-gray-900">{det.nodeId}</p>
                    <span className="text-[10px] text-gray-500">{det.sector}</span>
                  </td>
                  <td className="font-bold text-[#1b4332] text-xs">{det.species}</td>
                  <td className="font-mono font-bold text-emerald-800">{det.confidence}%</td>
                  <td className="font-mono text-gray-600 text-[11px]">{det.timestamp}</td>
                  <td>
                    <Badge variant={det.threatLevel === "critical" ? "critical" : det.threatLevel === "warning" ? "warning" : "default"}>
                      {det.threatLevel}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={det.verificationStatus === "verified" ? "default" : det.verificationStatus === "false_positive" ? "neutral" : "warning"}>
                      {det.verificationStatus.replace("_", " ")}
                    </Badge>
                  </td>
                  <td>
                    {det.verificationStatus === "unverified" ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleVerify(det.id, "verified")}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleVerify(det.id, "false_positive")}>
                          False Alarm
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-gray-500">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dcd8cd] rounded max-w-2xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e8e5dc] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">
                Frame Inspection: {previewImage.id} ({previewImage.species})
              </h3>
              <button onClick={() => setPreviewImage(null)} className="text-gray-500 hover:text-gray-900 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="h-80 w-full rounded overflow-hidden border border-gray-300">
              <img src={previewImage.image} alt={previewImage.species} className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span>Node: {previewImage.nodeId}</span>
              <span>Confidence: {previewImage.confidence}%</span>
              <span>Time: {previewImage.timestamp}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#e8e5dc]">
              <Button variant="outline" onClick={() => setPreviewImage(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
