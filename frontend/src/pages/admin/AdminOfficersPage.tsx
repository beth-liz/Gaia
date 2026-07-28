import { useState } from "react"
import { Shield, Plus, Phone, Mail, MapPin, Edit, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Officer {
  id: string
  name: string
  rank: string
  zone: string
  phone: string
  email: string
  status: "active" | "inactive"
}

export default function AdminOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([
    {
      id: "OFF-081",
      name: "Marcus Jose",
      rank: "Senior Ranger",
      zone: "Sector 4 - Muthanga",
      phone: "+91 98471 00112",
      email: "marcus.j@gaia.io",
      status: "active"
    },
    {
      id: "OFF-074",
      name: "Suresh Raman",
      rank: "Field Ranger Lead",
      zone: "Sector 2 - Pulpally",
      phone: "+91 94460 33445",
      email: "suresh.r@gaia.io",
      status: "active"
    },
    {
      id: "OFF-092",
      name: "Anjali Menon",
      rank: "Sanctuary Officer",
      zone: "Sector 1 - Sulthan Bathery",
      phone: "+91 97455 66778",
      email: "anjali.m@gaia.io",
      status: "active"
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newOfficer, setNewOfficer] = useState({
    name: "",
    rank: "Field Ranger",
    zone: "Sector 4 - Muthanga",
    phone: "",
    email: ""
  })

  const handleCreateOfficer = (e: React.FormEvent) => {
    e.preventDefault()
    const created: Officer = {
      id: `OFF-0${officers.length + 85}`,
      name: newOfficer.name,
      rank: newOfficer.rank,
      zone: newOfficer.zone,
      phone: newOfficer.phone,
      email: newOfficer.email,
      status: "active"
    }
    setOfficers(prev => [created, ...prev])
    setIsModalOpen(false)
    setNewOfficer({ name: "", rank: "Field Ranger", zone: "Sector 4 - Muthanga", phone: "", email: "" })
  }

  const toggleStatus = (id: string) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status: o.status === "active" ? "inactive" : "active" } : o))
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#e8f4ec] text-[#10b981] flex items-center justify-center font-bold border border-[#c3e3ca]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Officers Roster & Deployment
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage field ranger leads, edit assignments, or induct new officers.
            </p>
          </div>
        </div>

        <Button size="lg" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Officer
        </Button>
      </div>

      {/* Officers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {officers.map(off => (
          <Card key={off.id} className="hover:border-slate-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">{off.id}</span>
                <CardTitle className="text-base mt-0.5">{off.name}</CardTitle>
                <p className="text-xs font-semibold text-[#10b981] mt-0.5">{off.rank}</p>
              </div>
              <Badge variant={off.status === "active" ? "emerald" : "neutral"}>
                {off.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span>{off.zone}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span className="font-mono">{off.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span className="font-mono">{off.email}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <Button size="sm" variant="outline" className="w-full" onClick={() => alert(`Edit officer ${off.name}`)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button 
                  size="sm" 
                  variant={off.status === "active" ? "destructive" : "outline"} 
                  className="w-full"
                  onClick={() => toggleStatus(off.id)}
                >
                  <Power className="h-3.5 w-3.5 mr-1" /> {off.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Officer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Create New Officer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input 
                  type="text"
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  placeholder="Officer name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rank / Title</label>
                <input 
                  type="text"
                  value={newOfficer.rank}
                  onChange={(e) => setNewOfficer({ ...newOfficer, rank: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Zone</label>
                <select 
                  value={newOfficer.zone}
                  onChange={(e) => setNewOfficer({ ...newOfficer, zone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                >
                  <option>Sector 4 - Muthanga</option>
                  <option>Sector 2 - Pulpally</option>
                  <option>Sector 1 - Sulthan Bathery</option>
                  <option>Sector 3 - Kurichiad</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone</label>
                  <input 
                    type="tel"
                    value={newOfficer.phone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email</label>
                  <input 
                    type="email"
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                    placeholder="email@gaia.io"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#10b981]">Create Officer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
