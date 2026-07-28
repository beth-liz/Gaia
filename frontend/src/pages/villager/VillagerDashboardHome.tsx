import { useNavigate } from "react-router-dom"
import { ShieldAlert, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function VillagerDashboardHome() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Welcome & Primary Sighting Action */}
      <div className="bg-white border-2 border-[#10b981] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-[#10b981] rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Spotted Wild Animals Near Your Village?
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Report wild animal sightings immediately to notify local patrol officers.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Button 
            size="lg" 
            className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs px-8 py-3 rounded-2xl shadow-md"
            onClick={() => navigate("/villager/report-wildlife")}
          >
            <ShieldAlert className="h-4 w-4 mr-2" /> Report Wildlife Incident
          </Button>
        </div>
      </div>

      {/* Grid: Submitted Reports & Profile Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Submitted Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Submitted Reports</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Track status of your incident reports</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/villager/my-reports")}>
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Elephant Herd near Stream</span>
                <Badge variant="info">Dispatched</Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">REP-8812 • Today 09:30 AM</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Resident Profile</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Your village account details</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/villager/profile")}>
              Edit <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-medium text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-900">Raman Nair</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Village:</span>
              <span>Chundale Settlement</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status:</span>
              <Badge variant="emerald">Verified Lead</Badge>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
