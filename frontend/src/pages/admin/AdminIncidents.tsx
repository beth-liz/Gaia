import { useState } from "react"
import { ShieldAlert, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface Incident {
  id: string
  title: string
  village: string
  species: string
  threatLevel: "critical" | "warning" | "info"
  status: "Open" | "Dispatched" | "Resolved"
  assignedOfficer: string
  reportedAt: string
}

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-9941",
      title: "Asian Elephant Herd Intrusion (6 Animals)",
      village: "Chundale Settlement",
      species: "Asian Elephant",
      threatLevel: "critical",
      status: "Dispatched",
      assignedOfficer: "Marcus Jose",
      reportedAt: "Today, 09:30 AM"
    },
    {
      id: "INC-9938",
      title: "Bengal Tiger Roadway Crossing",
      village: "Pulpally Border Village",
      species: "Bengal Tiger",
      threatLevel: "warning",
      status: "Open",
      assignedOfficer: "Unassigned",
      reportedAt: "Today, 08:50 AM"
    },
    {
      id: "INC-9935",
      title: "Wild Boar Crop Raiding",
      village: "Sulthan Bathery Sector",
      species: "Wild Boar",
      threatLevel: "warning",
      status: "Resolved",
      assignedOfficer: "Suresh Raman",
      reportedAt: "Yesterday, 10:15 PM"
    }
  ])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newVillage, setNewVillage] = useState("Chundale Settlement")
  const [newSpecies, setNewSpecies] = useState("Asian Elephant")

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault()
    const created: Incident = {
      id: `INC-9${incidents.length + 942}`,
      title: newTitle,
      village: newVillage,
      species: newSpecies,
      threatLevel: "critical",
      status: "Open",
      assignedOfficer: "Unassigned",
      reportedAt: "Just now"
    }
    setIncidents(prev => [created, ...prev])
    setIsModalOpen(false)
    setNewTitle("")
  }

  const handleAssign = (id: string, officerName: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, assignedOfficer: officerName, status: "Dispatched" } : inc))
  }

  const handleUpdateStatus = (id: string, status: Incident["status"]) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc))
  }

  const filtered = incidents.filter(inc => {
    if (statusFilter !== "All" && inc.status !== statusFilter) return false
    return inc.title.toLowerCase().includes(search.toLowerCase()) || inc.village.toLowerCase().includes(search.toLowerCase()) || inc.id.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Incidents Management
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Create, filter, assign officers, and update wildlife threat statuses.
            </p>
          </div>
        </div>

        <Button size="lg" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Incident
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs font-semibold">
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search incident, village, species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">Filter Status:</span>
          {["All", "Open", "Dispatched", "Resolved"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border transition ${
                statusFilter === st ? "bg-[#0b2316] text-white border-[#0b2316]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Incident ID</th>
                  <th className="p-4">Title & Species</th>
                  <th className="p-4">Village Sector</th>
                  <th className="p-4">Threat Level</th>
                  <th className="p-4">Assigned Officer</th>
                  <th className="p-4">Reported Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">{inc.id}</td>
                    <td className="p-4">
                      <h4 className="font-extrabold text-slate-900">{inc.title}</h4>
                      <span className="text-[11px] text-[#10b981] font-bold">{inc.species}</span>
                    </td>
                    <td className="p-4 text-slate-700">{inc.village}</td>
                    <td className="p-4">
                      <Badge variant={inc.threatLevel === "critical" ? "critical" : "warning"}>
                        {inc.threatLevel}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <select
                        value={inc.assignedOfficer}
                        onChange={(e) => handleAssign(inc.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#10b981]"
                      >
                        <option value="Unassigned">Unassigned</option>
                        <option value="Marcus Jose">Marcus Jose</option>
                        <option value="Suresh Raman">Suresh Raman</option>
                        <option value="Anjali Menon">Anjali Menon</option>
                      </select>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{inc.reportedAt}</td>
                    <td className="p-4">
                      <Badge variant={inc.status === "Resolved" ? "emerald" : inc.status === "Dispatched" ? "info" : "warning"}>
                        {inc.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {inc.status !== "Resolved" ? (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(inc.id, "Resolved")}>
                          Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Create Incident</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Incident Description Title</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Elephant Sighting near Stream"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Species Involved</label>
                <select 
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Asian Elephant">Asian Elephant</option>
                  <option value="Bengal Tiger">Bengal Tiger</option>
                  <option value="Wild Boar">Wild Boar</option>
                  <option value="Indian Leopard">Indian Leopard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Village Sector</label>
                <select 
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Chundale Settlement">Chundale Settlement</option>
                  <option value="Pulpally Border Village">Pulpally Border Village</option>
                  <option value="Sulthan Bathery Sector">Sulthan Bathery Sector</option>
                  <option value="Kurichiad Sanctuary Zone">Kurichiad Sanctuary Zone</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#10b981]">Submit Incident</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
