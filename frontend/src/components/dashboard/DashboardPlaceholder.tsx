import { useLocation, Link } from "react-router-dom"
import { 
  TrendingUp, Users, MapPin, Radio, ShieldAlert, FileText, 
  Activity, Settings, Eye, Flame, BookOpen, 
  Upload, Send, CheckCircle, Clock, Map as MapIcon
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardPlaceholder() {
  const location = useLocation()
  const path = location.pathname.toLowerCase()

  // Helper to extract breadcrumbs
  const pathParts = location.pathname.split("/").filter(Boolean)
  const portalName = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : "Dashboard"
  const pageName = pathParts[1] 
    ? pathParts[1].split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Overview"

  // Local state for interactive features (e.g. reporting wildlife or changing settings)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [sightingType, setSightingType] = useState("elephant")
  const [reportsList, setReportsList] = useState([
    { id: "REP-409", species: "Elephant", location: "Muthanga Border Sector 2", time: "2 hours ago", status: "Officer Dispatched", urgency: "High" },
    { id: "REP-408", species: "Wild Boar Group", location: "Noolpuzha Crop fields", time: "5 hours ago", status: "Resolved", urgency: "Medium" },
    { id: "REP-405", species: "Leopard", location: "Sulthan Bathery East", time: "1 day ago", status: "Resolved", urgency: "Critical" },
  ])

  // Simple handlers
  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault()
    setReportSuccess(true)
    const target = e.target as any
    const newRep = {
      id: `REP-${Math.floor(Math.random() * 900) + 100}`,
      species: sightingType.charAt(0).toUpperCase() + sightingType.slice(1),
      location: target.elements.sightingLocation.value || "Near Village Perimeter",
      time: "Just now",
      status: "Submitted",
      urgency: target.elements.sightingUrgency.value || "Medium"
    }
    setReportsList([newRep, ...reportsList])
    setTimeout(() => setReportSuccess(false), 3000)
    target.reset()
  }

  // --- RENDERING CONFIGURATIONS FOR VARIOUS PAGES ---

  // ADMIN PAGES
  if (path === "/admin" || path === "/admin/dashboard") {
    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Incidents</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12</h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">↑ 4 in last 24h</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Rangers On Duty</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">18 / 24</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">75% coverage active</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Camera Sensors Online</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">312 / 320</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">97.5% operational</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
              <Radio className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Conflict Mitigation Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">98.4%</h3>
              <p className="text-xs text-indigo-600 font-semibold mt-1">No human casualties in 90 days</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Charts & Map Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Weekly Intrusion Trends</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total detected wildlife intrusions vs. successfully dispatched ranger responses.</p>
            
            {/* Visual Mock Chart */}
            <div className="mt-6 h-52 relative flex items-end justify-between px-4 border-b border-gray-200 dark:border-zinc-700 pb-2">
              <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-xs text-gray-400">
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>
              
              {/* Daily bars */}
              {[
                { day: "Mon", count: 18, resp: 17 },
                { day: "Tue", count: 24, resp: 22 },
                { day: "Wed", count: 15, resp: 15 },
                { day: "Thu", count: 28, resp: 27 },
                { day: "Fri", count: 19, resp: 18 },
                { day: "Sat", count: 14, resp: 14 },
                { day: "Sun", count: 22, resp: 20 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2 w-1/8 z-10">
                  <div className="flex space-x-1 items-end h-36">
                    <div 
                      className="w-3 bg-emerald-500 rounded-t transition-all duration-500 hover:opacity-80" 
                      style={{ height: `${(item.count / 30) * 100}%` }}
                      title={`Intrusions: ${item.count}`}
                    />
                    <div 
                      className="w-3 bg-indigo-500 rounded-t transition-all duration-500 hover:opacity-80" 
                      style={{ height: `${(item.resp / 30) * 100}%` }}
                      title={`Dispatched: ${item.resp}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.day}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 bg-emerald-500 rounded" />
                <span>Wildlife Intrusions</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 bg-indigo-500 rounded" />
                <span>Ranger Dispatches</span>
              </div>
            </div>
          </div>

          {/* Quick Alerts */}
          <div className="bg-white dark:bg-zinc-855 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">System Alert Board</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical notifications needing supervisor sign-off.</p>
            
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg border border-red-100 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20 flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 animate-pulse shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Level 3 Alert • Muthanga</span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Elephant family spotted crossing Route 76.</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">5 mins ago • Disp. Ranger R-11</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-100 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Sensor Warning • Noolpuzha</span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Camera #42 battery critical (4%).</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">42 mins ago • Maintenance ticket open</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-blue-100 dark:border-blue-950/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-start space-x-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Dispatch Report • Chethalayam</span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Incident #844 marked RESOLVED.</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">1 hour ago • By Ranger M. Jose</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Detections List */}
        <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Real-Time Threat Detection Log</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Captured camera telemetry classified by deep-learning models.</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg">View Camera Grid</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="p-4">Station ID</th>
                  <th className="p-4">Species Classified</th>
                  <th className="p-4">Confidence</th>
                  <th className="p-4">Detection Time</th>
                  <th className="p-4">Location Zone</th>
                  <th className="p-4">Safety Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700 text-gray-700 dark:text-gray-300">
                {[
                  { station: "CAM-NORTH-04", name: "Elephant (Adult)", conf: "98.7%", time: "14:52:10 (Just Now)", zone: "Muthanga Fence C", dispatch: "Alert Sent & Dispatched", badge: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400" },
                  { station: "CAM-EAST-12", name: "Leopard", conf: "94.2%", time: "14:41:05 (15m ago)", zone: "Sulthan Bathery Forest Line", dispatch: "Monitoring Active", badge: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" },
                  { station: "CAM-WEST-02", name: "Tiger (M)", conf: "96.5%", time: "13:20:18 (1h ago)", zone: "Chethalayam Buffer Zone", dispatch: "Patrol Informed", badge: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400" },
                  { station: "CAM-SOUTH-18", name: "Wild Boar (Multiple)", conf: "89.1%", time: "12:05:44 (2h ago)", zone: "Noolpuzha Agriland", dispatch: "Local Warning Relayed", badge: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{row.station}</td>
                    <td className="p-4 flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>{row.name}</span>
                    </td>
                    <td className="p-4 font-mono font-medium">{row.conf}</td>
                    <td className="p-4 text-xs">{row.time}</td>
                    <td className="p-4 text-xs font-semibold text-gray-600 dark:text-gray-400">{row.zone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${row.badge}`}>{row.dispatch}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (path === "/admin/users") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Administration Directory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage government supervisors, patrol forest rangers, and rural village delegates.</p>
          </div>
          <Button className="bg-primary hover:bg-forest-700 text-white text-xs">Add New User</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-semibold">
                <th className="p-4">Full Name</th>
                <th className="p-4">Official Email</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Region Assigned</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {[
                { name: "Devi Prasad", email: "d.prasad@forest.gov.in", role: "Administrator", region: "Division Office HQ", status: "Active", bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" },
                { name: "Ranger Marcus Jose", email: "m.jose@forest.gov.in", role: "Field Officer", region: "Muthanga Range B", status: "On Duty", bg: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300" },
                { name: "Ranger Sarah Kurian", email: "s.kurian@forest.gov.in", role: "Field Officer", region: "Chethalayam Buffer", status: "Off Duty", bg: "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300" },
                { name: "Rajan Pillai", email: "rajan.muthanga@outlook.com", role: "Villager Lead", region: "Muthanga East Village", status: "Active", bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" },
              ].map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20">
                  <td className="p-4 font-semibold text-gray-955 dark:text-white">{user.name}</td>
                  <td className="p-4 text-xs font-mono">{user.email}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-zinc-700 font-semibold">{user.role}</span></td>
                  <td className="p-4 text-xs">{user.region}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${user.bg}`}>{user.status}</span></td>
                  <td className="p-4 flex space-x-2">
                    <button className="text-xs text-primary font-bold hover:underline">Edit</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-xs text-rose-600 font-bold hover:underline">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (path === "/admin/officers") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Forest Range Officer Dispatch & Patrol Logs</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor active field rangers, deployment coverage, and dispatch response times.</p>
          </div>
          <Button className="bg-primary hover:bg-forest-700 text-white text-xs">Dispatch Ranger Unit</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Officer Marcus Jose", badge: "R-11", status: "Dispatched", target: "Muthanga Route 76", duration: "12m in transit", battery: "92%", coords: "11.6705° N, 76.2625° E" },
            { name: "Officer Sarah Kurian", badge: "R-15", status: "Patrolling", target: "Chethalayam Buffer", duration: "Active 2h 45m", battery: "74%", coords: "11.6111° N, 76.1942° E" },
            { name: "Officer Rajesh Kumar", badge: "R-22", status: "On Standby", target: "Sulthan Bathery Post", duration: "Waiting assignment", battery: "98%", coords: "11.6622° N, 76.2558° E" }
          ].map((ranger, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-5 space-y-3 bg-gray-50/50 dark:bg-zinc-800/40">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{ranger.name}</h4>
                  <p className="text-xs text-gray-400">Badge Identifier: {ranger.badge}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  ranger.status === "Dispatched" ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400" :
                  ranger.status === "Patrolling" ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" :
                  "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                }`}>{ranger.status}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between"><span>Sector Assigned:</span> <span className="font-semibold text-gray-900 dark:text-white">{ranger.target}</span></div>
                <div className="flex justify-between"><span>Activity Span:</span> <span>{ranger.duration}</span></div>
                <div className="flex justify-between"><span>GPS Coordinate:</span> <span className="font-mono text-[10px]">{ranger.coords}</span></div>
                <div className="flex justify-between"><span>Radio Battery:</span> <span>{ranger.battery}</span></div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 flex justify-end space-x-2">
                <Button variant="outline" className="text-xs px-2.5 py-1 h-auto">Ping Location</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1 h-auto">Direct Dispatch Call</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === "/admin/villages") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Protected Rural Border Villages</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">List of agricultural communities aligned with forest boundaries and active fencing telemetry.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Muthanga Village Colony", houses: "142 Families", barrier: "Solar-Fenced (Operational)", level: "High Alert", color: "bg-red-500" },
            { name: "Noolpuzha Community Area", houses: "320 Families", barrier: "Trench Barricade (Silted)", level: "Moderate Watch", color: "bg-amber-500" },
            { name: "Chethalayam Border Settlement", houses: "88 Families", barrier: "Acoustic Alarms Deployed", level: "Low Incident Zone", color: "bg-emerald-500" },
            { name: "Pulpally Border Farms", houses: "185 Families", barrier: "Solar-Fenced (Maintenance Due)", level: "High Alert", color: "bg-red-500" },
          ].map((v, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/40">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 dark:text-white">{v.name}</h4>
                <p className="text-xs text-gray-500">{v.houses} • Barrier Setup: <span className="font-semibold text-gray-700 dark:text-gray-300">{v.barrier}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${v.color}`} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{v.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === "/admin/stations") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Acoustic & Camera Monitoring Hub</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Live health metrics from telemetry nodes deployed on the reserve perimeters.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-semibold font-mono text-xs">
                <th className="p-4">Station ID</th>
                <th className="p-4">Sensor Node Hardware</th>
                <th className="p-4">Battery</th>
                <th className="p-4">4G Signal</th>
                <th className="p-4">Lat / Lng</th>
                <th className="p-4">Telemetry Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700 font-medium">
              {[
                { id: "ST-MUTH-01", type: "Dual Camera (Solar + IR)", bat: "98% (Solar Charging)", sig: "Excellent (-72 dBm)", coords: "11.668, 76.265", health: "Online", clr: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
                { id: "ST-MUTH-02", type: "Acoustic Seismic Node", bat: "12% (Alert Level)", sig: "Moderate (-90 dBm)", coords: "11.672, 76.271", health: "Warning", clr: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
                { id: "ST-NOOL-09", type: "IR Camera Array", bat: "0% (Offline)", sig: "Offline (Timeout)", coords: "11.604, 76.185", health: "Offline", clr: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
                { id: "ST-CHETH-04", type: "Dual Camera (Solar + IR)", bat: "87% (Solar Charging)", sig: "Excellent (-70 dBm)", coords: "11.621, 76.211", health: "Online", clr: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
              ].map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20 text-gray-700 dark:text-gray-300">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">{s.id}</td>
                  <td className="p-4 text-xs">{s.type}</td>
                  <td className="p-4 text-xs font-mono">{s.bat}</td>
                  <td className="p-4 text-xs font-mono">{s.sig}</td>
                  <td className="p-4 text-xs font-mono">{s.coords}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${s.clr}`}>{s.health}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (path === "/admin/incidents") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Incident Management Command</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Centralized log of emergency wildlife intrusion reports filed by automatic camera sensors or local villagers.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-semibold">
                <th className="p-4">Incident ID</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Conflict Threat</th>
                <th className="p-4">Report Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Ranger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {[
                { id: "INC-881", source: "Acoustic Sensor", threat: "Critical (Elephants)", detail: "Heavy footfall detected near border line #9 Muthanga", status: "Ranger Dispatched", ranger: "M. Jose (R-11)", style: "text-red-700 bg-red-50 dark:bg-red-950/40" },
                { id: "INC-880", source: "Villager Call", threat: "High (Leopard Sighting)", detail: "Leopard spotted in backyard tree of Rajan Pillai", status: "Investigating", ranger: "S. Kurian (R-15)", style: "text-amber-700 bg-amber-50 dark:bg-amber-950/40" },
                { id: "INC-878", source: "Automated Camera", threat: "Low (Wild Boars)", detail: "Pack of 8 boars root crop fields", status: "Resolved", ranger: "R. Kumar (R-22)", style: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" },
              ].map((inc, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20 text-gray-700 dark:text-gray-300">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">{inc.id}</td>
                  <td className="p-4 text-xs font-semibold">{inc.source}</td>
                  <td className="p-4 text-xs text-rose-600 font-bold">{inc.threat}</td>
                  <td className="p-4 text-xs">{inc.detail}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${inc.style}`}>{inc.status}</span></td>
                  <td className="p-4 text-xs font-semibold">{inc.ranger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (path === "/admin/detections" || path === "/officer/detections") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Computer Vision Detections Directory</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Classified images processed by neural networks from infrared wildlife cameras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: "DET-9023", species: "Indian Elephant", conf: "99.4%", time: "14 mins ago", zone: "Muthanga Perimeter Sector 2", border: "Crossing Barrier Fence", size: "Adult Male" },
            { id: "DET-9021", species: "Bengal Tiger", conf: "96.1%", time: "1 hour ago", zone: "Chethalayam Buffer Reserve", border: "Deep Forest Trail", size: "Sub-adult Male" },
            { id: "DET-9018", species: "Leopard", conf: "93.8%", time: "3 hours ago", zone: "Sulthan Bathery Boundary", border: "Heading towards Farm Lands", size: "Adult Female" },
          ].map((d, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-zinc-800/40 flex flex-col">
              <div className="h-44 bg-zinc-300 dark:bg-zinc-800 flex items-center justify-center relative overflow-hidden border-b border-gray-100 dark:border-zinc-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <div className="absolute top-8 left-12 right-12 bottom-12 border-2 border-dashed border-red-500 rounded flex flex-col justify-between p-2 z-20">
                  <span className="text-[9px] bg-red-600 text-white font-mono px-1 self-start rounded font-bold uppercase">{d.species}: {d.conf}</span>
                </div>
                <div className="text-center font-bold text-gray-400 flex flex-col items-center">
                  <Eye className="h-8 w-8 mb-2" />
                  <span className="text-xs uppercase tracking-widest font-mono">Infrared Camera Stream</span>
                </div>
              </div>
              <div className="p-4 space-y-2 flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{d.species}</h4>
                    <p className="text-xs text-gray-400">Class Ref: {d.id}</p>
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">Verified Hit</span>
                </div>
                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400 pt-1">
                  <div className="flex justify-between"><span>Location:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{d.zone}</span></div>
                  <div className="flex justify-between"><span>Observed Action:</span> <span>{d.border}</span></div>
                  <div className="flex justify-between"><span>Timestamp:</span> <span>{d.time}</span></div>
                </div>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700 flex justify-between gap-2">
                <button className="flex-grow text-center py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs">Verify & Dispatch</button>
                <button className="flex-grow text-center py-1.5 border border-gray-300 dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-250 rounded text-xs">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === "/admin/map" || path === "/officer/map") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4 flex flex-col h-[550px]">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">GIS Wildlife Telemetry Surveillance Grid</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Map layers showing locations of rangers (On Duty), active cameras, and recorded animal migration trends.</p>
        </div>
        
        <div className="flex-grow border-2 border-dashed border-gray-250 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-900/60 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] opacity-50" />
          
          <div className="absolute top-24 left-1/3 flex flex-col items-center animate-bounce" style={{ animationDuration: '4s' }}>
            <MapPin className="h-6 w-6 text-red-500 fill-red-100" />
            <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow mt-1">Elephant sighting</span>
          </div>

          <div className="absolute top-44 right-1/4 flex flex-col items-center">
            <MapPin className="h-6 w-6 text-blue-500 fill-blue-100" />
            <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded shadow mt-1">Ranger Marcus Jose</span>
          </div>

          <div className="absolute bottom-32 left-1/4 flex flex-col items-center">
            <Radio className="h-6 w-6 text-emerald-600 animate-pulse" />
            <span className="text-[9px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded shadow mt-1">Sensor ST-MUTH-01</span>
          </div>

          <div className="absolute bottom-4 right-4 bg-white dark:bg-zinc-850 p-2.5 rounded-lg shadow-md border border-gray-100 dark:border-zinc-800 space-y-2 text-xs flex flex-col z-20">
            <h5 className="font-bold text-gray-900 dark:text-white border-b pb-1 mb-1">Surveillance Filters</h5>
            <label className="flex items-center space-x-2 text-gray-650 dark:text-gray-300 font-semibold cursor-pointer"><input type="checkbox" defaultChecked /> <span>Active Incidents</span></label>
            <label className="flex items-center space-x-2 text-gray-650 dark:text-gray-300 font-semibold cursor-pointer"><input type="checkbox" defaultChecked /> <span>Ranger GPS Track</span></label>
            <label className="flex items-center space-x-2 text-gray-650 dark:text-gray-300 font-semibold cursor-pointer"><input type="checkbox" defaultChecked /> <span>Solar Electric Fences</span></label>
          </div>

          <div className="z-10 text-center select-none opacity-40">
            <MapIcon className="h-20 w-20 text-gray-300 dark:text-zinc-700 mx-auto" />
            <p className="font-bold text-sm tracking-wider uppercase text-gray-500 dark:text-gray-400 mt-2">Vector GIS Cartography Sandbox</p>
          </div>
        </div>
      </div>
    )
  }

  if (path === "/admin/reports" || path === "/officer/reports") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Annual & Monthly Conflict Analytics Reports</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generate, view, and export records for local wildlife divisions and ministry review.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[
            { title: "Monthly Conflict Log - July 2026", format: "PDF Document", size: "4.2 MB", desc: "Covers all recorded elephant intrusions and response times." },
            { title: "Acoustic Sensor telemetry data", format: "CSV spreadsheet", size: "12.8 MB", desc: "Detailed micro-seismic readings near barrier lines." },
            { title: "Forest Division Compensation audit", format: "PDF Document", size: "1.9 MB", desc: "Crop compensation audit log filed for central grant budget." },
          ].map((rep, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-4 flex flex-col justify-between hover:border-primary transition bg-gray-50/50 dark:bg-zinc-800/40">
              <div className="space-y-2">
                <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 self-start w-fit">
                  <FileText className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{rep.title}</h4>
                <p className="text-xs text-gray-500">{rep.desc}</p>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 mt-4 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span>{rep.format} • {rep.size}</span>
                <button className="text-primary hover:underline font-bold">Download File</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === "/admin/analytics") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Spatial analytics and Hotspot charts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Identify regions of high human-animal encounter probability based on historic sensor logs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-100 dark:border-zinc-700 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Conflict Volume by Species</h4>
            
            <div className="space-y-3 pt-2">
              {[
                { name: "Elephant", count: 82, pct: "65%", clr: "bg-amber-500" },
                { name: "Wild Boar", count: 28, pct: "22%", clr: "bg-emerald-500" },
                { name: "Leopard", count: 12, pct: "10%", clr: "bg-red-500" },
                { name: "Other / Unclassified", count: 4, pct: "3%", clr: "bg-gray-400" },
              ].map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <span>{s.name} ({s.count})</span>
                    <span>{s.pct}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full ${s.clr}`} style={{ width: s.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-100 dark:border-zinc-700 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Peak Sighting times (24h clock)</h4>
            
            <div className="space-y-3 pt-2">
              {[
                { range: "22:00 - 02:00 (Night Patrol)", rating: "Highest Danger", volume: "62% Sightings", clr: "bg-red-500 w-full" },
                { range: "18:00 - 22:00 (Dusk Period)", rating: "Critical Alert", volume: "24% Sightings", clr: "bg-amber-500 w-[60%]" },
                { range: "02:00 - 06:00 (Pre-Dawn Period)", rating: "Moderate", volume: "10% Sightings", clr: "bg-blue-500 w-[30%]" },
                { range: "06:00 - 18:00 (Daylight hours)", rating: "Minimal Sightings", volume: "4% Sightings", clr: "bg-gray-300 w-[10%]" },
              ].map((t, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <div className="space-y-0.5">
                    <p className="text-gray-900 dark:text-white font-bold">{t.range}</p>
                    <p className="text-[10px] text-gray-400">{t.rating} • {t.volume}</p>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full ${t.clr}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // OFFICER PAGES
  if (path === "/officer" || path === "/officer/dashboard") {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-forest-500 to-emerald-600 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-white/20 uppercase font-bold px-2 py-0.5 rounded">Ranger Field Portal</span>
            <h2 className="text-2xl font-bold">Good Day, Ranger Marcus Jose</h2>
            <p className="text-xs text-emerald-100">Assigned Sector: Muthanga Border West Range 3. Status: Active duty.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 p-2.5 rounded-lg border border-white/20">
            <Activity className="h-5 w-5 text-emerald-300 shrink-0" />
            <div className="text-xs">
              <span className="block font-bold">12 Wildlife Sensors Active</span>
              <span className="text-[10px] text-emerald-200">1 Warning status</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Duty Board */}
          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">My assigned incident response</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Emergency cases needing field intervention or active search operations.</p>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">DISPATCH REQUEST</span>
                    <h4 className="font-bold text-gray-900 dark:text-white mt-1.5">Herd of 5 Elephants near Muthanga Sector 2</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Reported by solar fence seismic sensor. Animal tracks suggest movement towards village crop boundary.</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">10 mins ago</span>
                </div>
                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1"><MapPin className="h-3.5 w-3.5 text-rose-500" /> <span>Sector 2 Fence Gate</span></div>
                  <div className="flex items-center space-x-1"><Clock className="h-3.5 w-3.5 text-gray-400" /> <span>Urgency: Critical</span></div>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 flex justify-end space-x-2">
                  <Button variant="outline" className="text-xs px-3 py-1.5 h-auto">Reject / Relay</Button>
                  <Button className="bg-primary hover:bg-forest-700 text-white text-xs px-3 py-1.5 h-auto">Acknowledge & Set GPS Route</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick status report */}
          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Shift checklist</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Operational tasks for current rotation.</p>
            
            <div className="space-y-2 text-xs">
              <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer text-gray-700 dark:text-gray-300">
                <input type="checkbox" defaultChecked className="mt-0.5" />
                <span>Verify radio transponder frequency</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="mt-0.5" />
                <span>Solar fence gate battery physical test</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="mt-0.5" />
                <span>Check in with Rajan Pillai (Muthanga Delegate)</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer text-gray-700 dark:text-gray-300">
                <input type="checkbox" className="mt-0.5" />
                <span>Log evening patrol coordinate checkpoints</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (path === "/officer/assigned") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Incidents Assigned to My Patrol Unit</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Emergency cases requiring range officer physical verification and field resolution.</p>
        
        <div className="space-y-4 pt-2">
          {[
            { id: "INC-881", title: "Elephant Group Movement (Muthanga Sector 2)", level: "Critical", status: "En Route", reporter: "Automated Seismic Telemetry" },
            { id: "INC-876", title: "Wild Boar Sighting (Noolpuzha Crop fields)", level: "Medium", status: "Active Monitor", reporter: "Villager Resident Rajan" },
          ].map((inc, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-zinc-805/30">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-400">{inc.id}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">{inc.level} Urgency</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">{inc.title}</h4>
                <p className="text-xs text-gray-500">Reported via: <span className="font-semibold text-gray-700 dark:text-gray-300">{inc.reporter}</span></p>
              </div>
              <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                <span className="text-xs font-bold text-primary bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded">{inc.status}</span>
                <Button className="bg-primary hover:bg-forest-700 text-white text-xs px-3 py-1.5 h-auto">Mark Resolved</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (path === "/officer/alerts" || path === "/villager/alerts") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Emergency Alerts & Broadcasts</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Broadcast history and emergency push alerts distributed to local villager mobile networks.</p>
        
        <div className="space-y-3 pt-2">
          {[
            { id: "BC-12", title: "Elephant Intrusion Warning (Muthanga Range B)", text: "Elephant family spotted near Route 76 crop fields. Villagers are advised to avoid boundary walks and secure crop storage lines.", time: "12 minutes ago", status: "Active Broadcast" },
            { id: "BC-10", title: "Night Travel Precaution (Chethalayam Forest Zone)", text: "Leopard activity reported. Avoid non-vehicular travel after 19:00 near buffer boundary roads.", time: "Yesterday", status: "Concluded" },
          ].map((b, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-4 space-y-2 bg-gray-50/50 dark:bg-zinc-805/30">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{b.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === "Active Broadcast" ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 animate-pulse" : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"}`}>{b.status}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{b.text}</p>
              <div className="text-[10px] text-gray-400 pt-1">Broadcast ID: {b.id} • Distributed {b.time} via Gaia SMS Gate</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // VILLAGER PAGES
  if (path === "/villager" || path === "/villager/dashboard" || path === "/villager/home") {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-white/20 uppercase font-bold px-2 py-0.5 rounded">Citizens Protection Portal</span>
            <h2 className="text-2xl font-bold">Welcome, Citizen Rajan Pillai</h2>
            <p className="text-xs text-amber-100">Registered Village: Muthanga East Colony. Boundary Status: Secure.</p>
          </div>
          <Link to="/villager/report-wildlife">
            <Button className="bg-white text-orange-600 hover:bg-amber-50 font-bold text-xs py-2 px-4 shadow rounded-lg">
              <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" />
              Report Wildlife Sightings
            </Button>
          </Link>
        </div>

        {/* Local Threat Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-850 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Village Safety & Ranger status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current status of active threat monitors and dispatched officers in your vicinity.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs">Muthanga East Solar Fence</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Fully operational. Current voltage: 9.2 KV. Battery charging.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/10 flex items-start space-x-3">
                <Users className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs">Range Patrol Units</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ranger Marcus Jose assigned to sector Muthanga Range B (2.5 km away).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Alert Board */}
          <div className="bg-white dark:bg-zinc-855 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Active Alerts</h3>
            <div className="p-3 rounded-lg border border-red-100 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/20 flex items-start space-x-3 text-xs">
              <Flame className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-red-700 dark:text-red-400">12:44 Sighting Broadcast</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Elephant family crossing boundary farms Muthanga East. Keep livestock inside.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (path === "/villager/report-wildlife") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Citizen Wildlife Sighting Report</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">File a quick report to notify nearby forest officers and dispatch patrol rangers. Upload audio notes or pictures if available.</p>
        </div>

        {reportSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm p-4 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="font-bold">Report Filed Successfully! Dispatch Center has been alerted.</span>
          </div>
        )}

        <form onSubmit={handleAddReport} className="space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sightingSpecies" className="block text-gray-600 dark:text-gray-400">What animal did you see?</label>
              <select 
                id="sightingSpecies" 
                className="w-full bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded p-2 text-xs"
                value={sightingType}
                onChange={(e) => setSightingType(e.target.value)}
              >
                <option value="elephant">Elephant</option>
                <option value="leopard">Leopard</option>
                <option value="tiger">Tiger</option>
                <option value="wild boar">Wild Boar</option>
                <option value="snake">Snake / Cobra</option>
                <option value="other">Other / Unknown</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="sightingUrgency" className="block text-gray-600 dark:text-gray-400">Threat Level / Urgency</label>
              <select id="sightingUrgency" name="sightingUrgency" className="w-full bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded p-2 text-xs">
                <option value="Critical">Critical (Near village center / aggressive)</option>
                <option value="High">High (Headed towards farm / border)</option>
                <option value="Medium">Medium (Near forest fence buffer)</option>
                <option value="Low">Low (Fled back into deep forest)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sightingLocation" className="block text-gray-600 dark:text-gray-400">Location description</label>
            <input 
              type="text" 
              id="sightingLocation" 
              name="sightingLocation"
              placeholder="e.g. Muthanga East boundary road near primary school" 
              className="w-full bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded p-2 text-xs" 
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-600 dark:text-gray-400">Sighting Description & Details</label>
            <textarea 
              rows={3} 
              placeholder="e.g., A lone elephant, looking agitated. Tearing banana trees. Villagers are shouting."
              className="w-full bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded p-2 text-xs"
            />
          </div>

          <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 bg-gray-50/50 dark:bg-zinc-900/40 cursor-pointer">
            <Upload className="h-6 w-6 text-gray-400" />
            <p className="text-gray-500 text-center">Tap to attach Photo or Record Voice Note</p>
            <p className="text-[10px] text-gray-400">Supports PNG, JPG, MP3 up to 10MB</p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" className="text-xs">Clear Form</Button>
            <Button type="submit" className="bg-primary hover:bg-forest-700 text-white font-bold text-xs px-5 py-2">
              <Send className="mr-2 h-4 w-4" />
              File Emergency Report
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (path === "/villager/my-reports") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">My Filed Conflict Reports</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">History of emergency alerts you have posted to local forest division dispatch operators.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-700/50 border-b border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 font-semibold">
                <th className="p-4">Report ID</th>
                <th className="p-4">Species</th>
                <th className="p-4">Location</th>
                <th className="p-4">Time Filed</th>
                <th className="p-4">Urgency</th>
                <th className="p-4">Ranger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {reportsList.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20 text-gray-700 dark:text-gray-300">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">{row.id}</td>
                  <td className="p-4">{row.species}</td>
                  <td className="p-4 text-xs font-semibold">{row.location}</td>
                  <td className="p-4 text-xs">{row.time}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      row.urgency === "Critical" ? "text-red-700 bg-red-50 dark:bg-red-950/40" :
                      row.urgency === "High" ? "text-orange-700 bg-orange-50 dark:bg-orange-950/40" :
                      "text-gray-700 bg-gray-55 dark:bg-zinc-800"
                    }`}>{row.urgency}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      row.status === "Officer Dispatched" ? "text-amber-700 bg-amber-50 dark:bg-amber-950/40" :
                      row.status === "Submitted" ? "text-blue-700 bg-blue-50 dark:bg-blue-950/40" :
                      "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (path === "/villager/tips") {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Wildlife Encounter Safety Guidelines</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Coexistence protocol handbook compiled by State Forest Rangers and Wildlife Biologists.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Elephant Encounter Rules", icon: BookOpen, tips: ["Do not shine bright torch lights or throw firecrackers directly at elephants.", "Maintain at least 100 meters distance; never block their calves or migration pathway.", "Report solar electric fence breakdown to patrol range office immediately."] },
            { title: "Leopard Sighting Safety", icon: ShieldAlert, tips: ["Keep children and small farm stock livestock indoors after dusk hours.", "Ensure pathway lights are active near crop gates to minimize ambush areas.", "Never corner a leopard in a farm outhouse or attempt physical capture."] },
          ].map((group, idx) => {
            const Icon = group.icon
            return (
              <div key={idx} className="border border-gray-100 dark:border-zinc-700 rounded-xl p-5 space-y-3 bg-gray-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center space-x-2 text-primary">
                  <Icon className="h-5 w-5" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">{group.title}</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                  {group.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="leading-relaxed"><span className="pl-1 text-gray-700 dark:text-gray-300 font-semibold">{tip}</span></li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // GLOBAL FALLBACK / SETTINGS / PROFILE
  if (path.endsWith("/settings")) {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6 max-w-2xl">
        <div className="flex items-center space-x-3 border-b border-gray-100 dark:border-zinc-700 pb-4">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Portal Config & Alert Controls</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure layout preferences and official telemetry relay paths.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white border-b pb-1">Preferences</h4>
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer">
              <span>Enable Push Emergency Warnings</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer">
              <span>Low Bandwidth Graphic Mode (Hides IR feed frames)</span>
              <input type="checkbox" />
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white border-b pb-1">Emergency Relays</h4>
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer">
              <span>Automatic WhatsApp SMS Relay for Critical Threats</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/30 cursor-pointer">
              <span>Relay coordinate data directly to nearest Ranger Radio terminal</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" className="text-xs">Cancel Changes</Button>
            <Button className="bg-primary hover:bg-forest-700 text-white text-xs">Save Settings</Button>
          </div>
        </div>
      </div>
    )
  }

  if (path.endsWith("/profile")) {
    return (
      <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-6 max-w-2xl">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20">
            {portalName === "Villager" ? "RP" : "MJ"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {portalName === "Villager" ? "Rajan Pillai" : "Ranger Marcus Jose"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Role: {portalName === "Villager" ? "Village Representative Delegate" : "Forest Ranger (Grade II)"}</p>
            <p className="text-xs text-gray-400">Muthanga Ranger Sub-division HQ</p>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-zinc-700 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-gray-400 font-semibold block">Official ID / Citizen Card</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">UID-2026-90432</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 font-semibold block">Contact phone</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">+91 94471 28912</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 font-semibold block">Assigned Station / Village</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">Muthanga Boundary Reserve Colony</span>
          </div>
          <div className="space-y-1">
            <span className="text-gray-400 font-semibold block">Registry Email</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">
              {portalName === "Villager" ? "rajan.muthanga@outlook.com" : "m.jose@forest.gov.in"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // GENERAL FALLBACK PAGE
  return (
    <div className="bg-white dark:bg-zinc-850 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto text-gray-400 dark:text-gray-300">
        <Activity className="h-8 w-8 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pageName} Portal Module</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is a placeholder page for the <span className="font-semibold text-gray-800 dark:text-gray-200">{portalName} / {pageName}</span> module.
        </p>
      </div>
      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
        The user interface routes are mapped, state contexts are initialized, and the sub-navigation breadcrumbs are operational.
      </p>
    </div>
  )
}
