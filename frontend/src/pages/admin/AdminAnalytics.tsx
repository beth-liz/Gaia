import { TrendingUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminAnalytics() {
  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white border border-[#dcd8cd] rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              Conflict Analytics & Wildlife Intrusion Trends
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Hourly conflict heat matrix • Species distribution • Ranger response efficiency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Export Operational PDF Report
          </Button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Hourly Heat Matrix Placeholder Card */}
        <div className="bg-white border border-[#dcd8cd] rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-[#e8e5dc] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">Hourly Conflict Probability</h3>
            <Badge variant="default">Peak: 22:00 - 04:00</Badge>
          </div>
          
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between font-mono text-gray-700">
              <span>00:00 - 04:00 (Night Patrol)</span>
              <span className="font-bold text-rose-800">High Risk (64%)</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div className="bg-rose-700 h-full w-[64%]" />
            </div>

            <div className="flex justify-between font-mono text-gray-700 pt-2">
              <span>04:00 - 08:00 (Dawn Migration)</span>
              <span className="font-bold text-amber-800">Med Risk (28%)</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div className="bg-amber-600 h-full w-[28%]" />
            </div>

            <div className="flex justify-between font-mono text-gray-700 pt-2">
              <span>08:00 - 18:00 (Daytime)</span>
              <span className="font-bold text-emerald-800">Low Risk (8%)</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div className="bg-emerald-700 h-full w-[8%]" />
            </div>
          </div>
        </div>

        {/* Species Distribution Card */}
        <div className="bg-white border border-[#dcd8cd] rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-[#e8e5dc] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">Species Sighting Breakdown</h3>
            <Badge variant="info">Monthly Log</Badge>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-[#f6f5f2] rounded border border-[#e8e5dc]">
              <span className="font-bold text-gray-900">Asian Elephant</span>
              <span className="font-bold text-[#1b4332]">48.2% (142 detections)</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#f6f5f2] rounded border border-[#e8e5dc]">
              <span className="font-bold text-gray-900">Wild Boar</span>
              <span className="font-bold text-amber-800">26.5% (78 detections)</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#f6f5f2] rounded border border-[#e8e5dc]">
              <span className="font-bold text-gray-900">Bengal Tiger</span>
              <span className="font-bold text-rose-800">14.1% (41 detections)</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#f6f5f2] rounded border border-[#e8e5dc]">
              <span className="font-bold text-gray-900">Indian Leopard / Deer</span>
              <span className="font-bold text-gray-700">11.2% (33 detections)</span>
            </div>
          </div>
        </div>

        {/* Ranger Response Performance Card */}
        <div className="bg-white border border-[#dcd8cd] rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-[#e8e5dc] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">Response Efficiency</h3>
            <Badge variant="default">SLA Target &lt; 15m</Badge>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-[#edf7ee] border border-[#b8e2be] rounded">
              <span className="text-[10px] font-bold uppercase text-[#2e6f40]">Avg Rapid Dispatch Time</span>
              <div className="text-xl font-extrabold text-[#0f291e] mt-0.5">8 min 42 sec</div>
              <span className="text-[10px] text-emerald-800">3.2m faster than sector baseline</span>
            </div>

            <div className="p-3 bg-[#f6f5f2] border border-[#e8e5dc] rounded">
              <span className="text-[10px] font-bold uppercase text-gray-500">Incident Resolution Rate</span>
              <div className="text-lg font-bold text-[#0f291e] mt-0.5">94.8% Containment</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
