import { useState } from "react"
import { UserCheck, Plus, Phone, Mail, MapPin, Edit, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SubOfficer {
  id: string
  name: string
  reportsTo: string
  assignedZone: string
  phone: string
  email: string
  status: "active" | "inactive"
}

export default function SubOfficersPage() {
  const [subOfficers, setSubOfficers] = useState<SubOfficer[]>([
    {
      id: "SUB-012",
      name: "Ramanathan K.",
      reportsTo: "Senior Ranger Marcus Jose",
      assignedZone: "Chundale North Perimeter",
      phone: "+91 98950 11223",
      email: "ramanathan.k@gaia.io",
      status: "active"
    },
    {
      id: "SUB-014",
      name: "Priya Nair",
      reportsTo: "Field Ranger Suresh Raman",
      assignedZone: "Pulpally Border Post",
      phone: "+91 97451 33445",
      email: "priya.n@gaia.io",
      status: "active"
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSubOfficer, setNewSubOfficer] = useState({
    name: "",
    reportsTo: "Senior Ranger Marcus Jose",
    assignedZone: "Chundale North Perimeter",
    phone: "",
    email: ""
  })

  const handleCreateSubOfficer = (e: React.FormEvent) => {
    e.preventDefault()
    const created: SubOfficer = {
      id: `SUB-0${subOfficers.length + 15}`,
      name: newSubOfficer.name,
      reportsTo: newSubOfficer.reportsTo,
      assignedZone: newSubOfficer.assignedZone,
      phone: newSubOfficer.phone,
      email: newSubOfficer.email,
      status: "active"
    }
    setSubOfficers(prev => [created, ...prev])
    setIsModalOpen(false)
    setNewSubOfficer({ name: "", reportsTo: "Senior Ranger Marcus Jose", assignedZone: "Chundale North Perimeter", phone: "", email: "" })
  }

  const toggleStatus = (id: string) => {
    setSubOfficers(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s))
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#e8f4ec] text-[#10b981] flex items-center justify-center font-bold border border-[#c3e3ca]">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Sub Officers Directory
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Create and manage subordinate field officers reporting to Senior Officers.
            </p>
          </div>
        </div>

        <Button size="lg" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Sub Officer
        </Button>
      </div>

      {/* Sub Officers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subOfficers.map(sub => (
          <Card key={sub.id} className="hover:border-slate-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">{sub.id}</span>
                <CardTitle className="text-base mt-0.5">{sub.name}</CardTitle>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Reports to: {sub.reportsTo}</p>
              </div>
              <Badge variant={sub.status === "active" ? "emerald" : "neutral"}>
                {sub.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span>{sub.assignedZone}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span className="font-mono">{sub.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span className="font-mono">{sub.email}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <Button size="sm" variant="outline" className="w-full" onClick={() => alert(`Edit ${sub.name}`)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button 
                  size="sm" 
                  variant={sub.status === "active" ? "destructive" : "outline"} 
                  className="w-full"
                  onClick={() => toggleStatus(sub.id)}
                >
                  <Power className="h-3.5 w-3.5 mr-1" /> {sub.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Create Sub Officer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateSubOfficer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sub Officer Name</label>
                <input 
                  type="text"
                  value={newSubOfficer.name}
                  onChange={(e) => setNewSubOfficer({ ...newSubOfficer, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reporting Officer</label>
                <select 
                  value={newSubOfficer.reportsTo}
                  onChange={(e) => setNewSubOfficer({ ...newSubOfficer, reportsTo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Senior Ranger Marcus Jose">Senior Ranger Marcus Jose</option>
                  <option value="Field Ranger Suresh Raman">Field Ranger Suresh Raman</option>
                  <option value="Sanctuary Officer Anjali Menon">Sanctuary Officer Anjali Menon</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Perimeter / Zone Assignment</label>
                <input 
                  type="text"
                  value={newSubOfficer.assignedZone}
                  onChange={(e) => setNewSubOfficer({ ...newSubOfficer, assignedZone: e.target.value })}
                  placeholder="Zone details"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone</label>
                  <input 
                    type="tel"
                    value={newSubOfficer.phone}
                    onChange={(e) => setNewSubOfficer({ ...newSubOfficer, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email</label>
                  <input 
                    type="email"
                    value={newSubOfficer.email}
                    onChange={(e) => setNewSubOfficer({ ...newSubOfficer, email: e.target.value })}
                    placeholder="sub@gaia.io"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#10b981]">Create Sub Officer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
