import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, Shield, ShieldAlert, UserCheck, CheckCircle2, Plus, ArrowRight, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AdminDashboardHome() {
  const navigate = useNavigate()

  const [pendingVillagers, setPendingVillagers] = useState([
    { id: "VLG-103", name: "Muhammed Shafi", village: "Sulthan Bathery", phone: "+91 97452 77889", status: "pending" },
    { id: "VLG-105", name: "Ananya Krishnan", village: "Chundale Settlement", phone: "+91 98471 22334", status: "pending" }
  ])

  const [recentIncidents] = useState([
    { id: "INC-9941", title: "Asian Elephant Herd Sighting", village: "Chundale", status: "Dispatched", threat: "critical" },
    { id: "INC-9938", title: "Bengal Tiger Sighting", village: "Pulpally Border", status: "Under Investigation", threat: "warning" }
  ])

  const handleApprove = (id: string) => {
    setPendingVillagers(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner Card with Wildlife Image Background */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0b2316] text-white p-6 sm:p-8 shadow-lg border border-[#123c27]">
        <div className="absolute inset-0 z-0">
          <img src="/images/nature3.jpg" alt="Nature Banner" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b2316] via-[#0b2316]/80 to-transparent" />
        </div>

        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to Gaia Admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Operational Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Monitor village community registrations, manage field officer deployments, and review active wildlife incident reports.
          </p>

          {/* Quick Actions Bar */}
          <div className="pt-2 flex flex-wrap gap-2">
            <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white font-bold" onClick={() => navigate("/admin/officers")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Officer
            </Button>
            <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/admin/incidents")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Incident
            </Button>
            <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/admin/users")}>
              View Villagers
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="hover:border-emerald-500/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Villagers</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">1,248</div>
              <span className="text-[11px] text-emerald-600 font-bold">Registered & Active</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#10b981] flex items-center justify-center font-bold border border-emerald-100">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Active Officers</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">24</div>
              <span className="text-[11px] text-emerald-600 font-bold">Field Deployment</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#10b981] flex items-center justify-center font-bold border border-emerald-100">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Approvals</span>
              <div className="text-2xl font-extrabold text-amber-600 font-mono">{pendingVillagers.length}</div>
              <span className="text-[11px] text-amber-600 font-bold">Action Required</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Open Incidents</span>
              <div className="text-2xl font-extrabold text-rose-600 font-mono">2 Active</div>
              <span className="text-[11px] text-rose-600 font-bold">1 Priority Dispatch</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid: Pending Approvals & Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Villager Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Villager Approvals</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Approve new resident registrations to grant alert access</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {pendingVillagers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingVillagers.map(v => (
                  <div key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{v.id}</span>
                      <h4 className="font-extrabold text-slate-900">{v.name}</h4>
                      <p className="text-[11px] text-slate-500">{v.village} • {v.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-[#10b981] hover:bg-[#059669]" onClick={() => handleApprove(v.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleApprove(v.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No pending villager approvals at this time.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Incidents</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Active wildlife reports needing ranger dispatch</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/incidents")}>
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentIncidents.map(inc => (
                <div key={inc.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{inc.id}</span>
                    <h4 className="font-extrabold text-slate-900">{inc.title}</h4>
                    <p className="text-[11px] text-slate-500">{inc.village}</p>
                  </div>
                  <Badge variant={inc.threat === "critical" ? "critical" : "warning"}>
                    {inc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
