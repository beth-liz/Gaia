import { useState } from "react"
import { Shield, Plus, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Officer {
  badgeId: string
  name: string
  rank: "Section Forest Officer" | "Senior Ranger" | "Beat Officer" | "Rapid Response Lead"
  assignedSector: string
  dutyStatus: "On Duty" | "Dispatched" | "Standby" | "Off Duty"
  assignedVehicle: string
  contactPhone: string
  equipmentStatus: string
}

export default function AdminOfficers() {
  const [officers] = useState<Officer[]>([
    {
      badgeId: "RNGR-081",
      name: "Marcus Jose",
      rank: "Rapid Response Lead",
      assignedSector: "Sector 4 - Muthanga North",
      dutyStatus: "Dispatched",
      assignedVehicle: "Tactical Jeep B-2",
      contactPhone: "+91 98471 00112",
      equipmentStatus: "Thermal Scope, Siren Gun, GPS Live"
    },
    {
      badgeId: "RNGR-074",
      name: "Suresh Raman",
      rank: "Senior Ranger",
      assignedSector: "Sector 2 - Pulpally West",
      dutyStatus: "On Duty",
      assignedVehicle: "Patrol Vehicle A-1",
      contactPhone: "+91 94460 33445",
      equipmentStatus: "Comms Radio, Tranquilizer Scope"
    },
    {
      badgeId: "RNGR-092",
      name: "Anjali Menon",
      rank: "Section Forest Officer",
      assignedSector: "Sector 1 - Sulthan Bathery",
      dutyStatus: "On Duty",
      assignedVehicle: "HQ Command Vehicle",
      contactPhone: "+91 97455 66778",
      equipmentStatus: "Drone Controller, Thermal Monocular"
    },
    {
      badgeId: "RNGR-063",
      name: "Vikram Singh",
      rank: "Beat Officer",
      assignedSector: "Sector 3 - Kurichiad",
      dutyStatus: "Standby",
      assignedVehicle: "Patrol Motorbike C-4",
      contactPhone: "+91 98950 88990",
      equipmentStatus: "Standard Patrol Kit, Bodycam"
    }
  ])

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white border border-[#dcd8cd] rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              Forest Ranger & Field Tactical Roster
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Duty deployments • Equipment readiness • Rapid response dispatch matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Induct New Ranger
          </Button>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {officers.map(off => (
          <div key={off.badgeId} className="bg-white border border-[#dcd8cd] rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e8e5dc] pb-2">
              <div>
                <span className="text-[10px] font-mono text-gray-500 font-bold">{off.badgeId}</span>
                <h3 className="text-sm font-bold text-[#0f291e]">{off.name}</h3>
                <span className="text-xs text-[#2d5a3f] font-semibold">{off.rank}</span>
              </div>
              <Badge variant={off.dutyStatus === "Dispatched" ? "critical" : off.dutyStatus === "On Duty" ? "default" : "neutral"}>
                {off.dutyStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-700">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Sector Assignment</span>
                <span className="font-bold text-[#0f291e]">{off.assignedSector}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Tactical Unit Vehicle</span>
                <span>{off.assignedVehicle}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 block">Equipment Readiness</span>
              <p className="text-gray-700 font-mono text-[11px]">{off.equipmentStatus}</p>
            </div>

            <div className="pt-2 border-t border-[#e8e5dc] flex items-center justify-between text-xs font-mono">
              <span className="flex items-center text-gray-700">
                <Phone className="h-3 w-3 mr-1 text-[#1b4332]" /> {off.contactPhone}
              </span>
              <Button size="sm" variant="outline">Reassign Sector</Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
