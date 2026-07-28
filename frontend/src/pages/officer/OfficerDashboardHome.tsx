import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function OfficerDashboardHome() {
  const navigate = useNavigate()

  const [assignedIncidents, setAssignedIncidents] = useState([
    { id: "INC-9941", title: "Asian Elephant Herd Sighting", village: "Chundale Settlement", threat: "critical", status: "Dispatched" },
    { id: "INC-9938", title: "Bengal Tiger Roadway Crossing", village: "Pulpally Border", threat: "warning", status: "Open" }
  ])

  const subOfficers = [
    { name: "Ramanathan K.", zone: "Chundale Perimeter", status: "active" },
    { name: "Priya Nair", zone: "Pulpally Post", status: "active" }
  ]

  const handleResolve = (id: string) => {
    setAssignedIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: "Resolved" } : inc))
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <Badge variant="emerald">Field Officer Workspace</Badge>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            Officer Marcus Jose
          </h1>
          <p className="text-xs text-slate-500 font-medium">Assigned Zone: Sector 4 - Muthanga</p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => navigate("/officer/incidents")}>
            View All Incidents
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/officer/sub-officers")}>
            Manage Sub Officers
          </Button>
        </div>
      </div>

      {/* Grid: Assigned Incidents & Pending Work */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Assigned Incidents (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Assigned Incidents</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Active field dispatches requiring your response</p>
              </div>
              <Badge variant="critical">Priority</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {assignedIncidents.map(inc => (
                  <div key={inc.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{inc.id}</span>
                      <Badge variant={inc.threat === "critical" ? "critical" : "warning"}>
                        {inc.status}
                      </Badge>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{inc.title}</h4>
                    <p className="text-slate-600 font-medium">{inc.village}</p>
                    
                    <div className="pt-2 flex justify-end gap-2">
                      {inc.status !== "Resolved" ? (
                        <Button size="sm" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => handleResolve(inc.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-700 font-bold">Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub Officers Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Sub Officers Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Sub Officers</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Field staff reporting to you</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/officer/sub-officers")}>
                Manage <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {subOfficers.map((sub, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-900">{sub.name}</h4>
                      <p className="text-slate-500 font-medium">{sub.zone}</p>
                    </div>
                    <Badge variant="emerald">{sub.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Verify Chundale perimeter fence status</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Confirm Sub Officer shift report</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
