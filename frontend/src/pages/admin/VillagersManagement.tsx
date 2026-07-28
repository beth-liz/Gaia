import { useState } from "react"
import { Users, Search, CheckCircle2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface Villager {
  id: string
  name: string
  village: string
  phone: string
  role: string
  status: "approved" | "pending" | "rejected"
  registeredDate: string
}

export default function VillagersManagement() {
  const [villagers, setVillagers] = useState<Villager[]>([
    {
      id: "VLG-101",
      name: "Raman Nair",
      village: "Chundale Settlement",
      phone: "+91 98470 11223",
      role: "Village Head",
      status: "approved",
      registeredDate: "2025-11-12"
    },
    {
      id: "VLG-102",
      name: "Kavitha Joseph",
      village: "Pulpally Border",
      phone: "+91 94461 44556",
      role: "Resident Lead",
      status: "approved",
      registeredDate: "2026-01-05"
    },
    {
      id: "VLG-103",
      name: "Muhammed Shafi",
      village: "Sulthan Bathery",
      phone: "+91 97452 77889",
      role: "Farmer",
      status: "pending",
      registeredDate: "2026-07-20"
    },
    {
      id: "VLG-104",
      name: "Devaki Amma",
      village: "Kurichiad Village",
      phone: "+91 98953 99001",
      role: "Community Guard",
      status: "approved",
      registeredDate: "2025-09-18"
    },
    {
      id: "VLG-105",
      name: "Ananya Krishnan",
      village: "Chundale Settlement",
      phone: "+91 98471 22334",
      role: "Resident Lead",
      status: "pending",
      registeredDate: "2026-07-25"
    }
  ])

  const [search, setSearch] = useState("")
  const [selectedVillager, setSelectedVillager] = useState<Villager | null>(null)

  const handleUpdateStatus = (id: string, status: "approved" | "rejected") => {
    setVillagers(prev => prev.map(v => v.id === id ? { ...v, status } : v))
  }

  const filtered = villagers.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.village.toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#e8f4ec] text-[#10b981] flex items-center justify-center font-bold border border-[#c3e3ca]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Villagers Directory & Approvals
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Review, approve, or reject resident access to the Gaia alerting network.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search villager name, ID, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span>Total: <strong className="text-slate-900">{villagers.length}</strong></span>
          <span>Approved: <strong className="text-emerald-700">{villagers.filter(v => v.status === "approved").length}</strong></span>
          <span>Pending: <strong className="text-amber-700">{villagers.filter(v => v.status === "pending").length}</strong></span>
        </div>
      </div>

      {/* Villagers Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Resident ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Village Sector</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">{v.id}</td>
                    <td className="p-4 font-extrabold text-slate-900">{v.name}</td>
                    <td className="p-4 text-slate-700">{v.village}</td>
                    <td className="p-4 font-mono text-slate-600">{v.phone}</td>
                    <td className="p-4 text-slate-800 font-semibold">{v.role}</td>
                    <td className="p-4">
                      <Badge variant={v.status === "approved" ? "emerald" : v.status === "pending" ? "warning" : "critical"}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{v.registeredDate}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSelectedVillager(v)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {v.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => handleUpdateStatus(v.id, "approved")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(v.id, "rejected")}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedVillager && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Resident Details</h3>
              <button onClick={() => setSelectedVillager(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Resident ID:</span>
                <span className="font-bold font-mono">{selectedVillager.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-bold text-slate-900">{selectedVillager.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Village Sector:</span>
                <span>{selectedVillager.village}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono">{selectedVillager.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Role:</span>
                <span className="font-bold">{selectedVillager.role}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedVillager(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
