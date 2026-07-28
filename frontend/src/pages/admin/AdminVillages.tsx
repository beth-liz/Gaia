import { useState } from "react"
import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Village {
  id: string
  name: string
  sector: string
  population: number
  distanceToForest: string
  sirenStatus: "Operational" | "Warning" | "Maintenance"
  fenceIntegrity: number
  assignedOfficer: string
  riskLevel: "High" | "Medium" | "Low"
}

export default function AdminVillages() {
  const [villages] = useState<Village[]>([
    {
      id: "VLG-01",
      name: "Chundale Settlement",
      sector: "Sector 4 Buffer",
      population: 420,
      distanceToForest: "250 meters",
      sirenStatus: "Operational",
      fenceIntegrity: 98,
      assignedOfficer: "Patrol Unit Bravo-2",
      riskLevel: "High"
    },
    {
      id: "VLG-02",
      name: "Pulpally Border Village",
      sector: "Sector 2 Buffer",
      population: 850,
      distanceToForest: "400 meters",
      sirenStatus: "Operational",
      fenceIntegrity: 100,
      assignedOfficer: "Ranger Team Alpha",
      riskLevel: "Medium"
    },
    {
      id: "VLG-03",
      name: "Sulthan Bathery East",
      sector: "Sector 1 Buffer",
      population: 1200,
      distanceToForest: "1.2 km",
      sirenStatus: "Warning",
      fenceIntegrity: 84,
      assignedOfficer: "Perimeter Unit C",
      riskLevel: "Medium"
    },
    {
      id: "VLG-04",
      name: "Kurichiad Tribal Settlement",
      sector: "Sector 3 Core Buffer",
      population: 310,
      distanceToForest: "50 meters",
      sirenStatus: "Operational",
      fenceIntegrity: 92,
      assignedOfficer: "Rapid Response Team 1",
      riskLevel: "High"
    }
  ])

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white border border-[#dcd8cd] rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              Perimeter Villages & Solar Bio-Fence Control
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Early warning acoustic sirens • Solar fence voltage integrity • Community safety index
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Border Village
          </Button>
        </div>
      </div>

      {/* Villages Table */}
      <div className="bg-white border border-[#dcd8cd] rounded overflow-hidden">
        <table className="gaia-table">
          <thead>
            <tr>
              <th>Village ID</th>
              <th>Settlement Name</th>
              <th>Sector Zone</th>
              <th>Population</th>
              <th>Forest Distance</th>
              <th>Siren Hardware Status</th>
              <th>Fence Integrity</th>
              <th>Conflict Risk Level</th>
              <th>Assigned Unit</th>
            </tr>
          </thead>
          <tbody>
            {villages.map(v => (
              <tr key={v.id}>
                <td className="font-mono text-xs font-bold text-gray-900">{v.id}</td>
                <td className="font-bold text-[#0f291e]">{v.name}</td>
                <td className="font-semibold text-gray-800">{v.sector}</td>
                <td className="font-mono text-gray-700">{v.population} residents</td>
                <td className="font-mono text-gray-700">{v.distanceToForest}</td>
                <td>
                  <Badge variant={v.sirenStatus === "Operational" ? "default" : "warning"}>
                    {v.sirenStatus}
                  </Badge>
                </td>
                <td className="font-mono font-bold text-emerald-800">{v.fenceIntegrity}% Voltage</td>
                <td>
                  <Badge variant={v.riskLevel === "High" ? "critical" : "warning"}>
                    {v.riskLevel} Risk
                  </Badge>
                </td>
                <td className="font-semibold text-gray-800">{v.assignedOfficer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
