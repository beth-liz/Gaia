import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, ShieldAlert, FileText, User, Menu, Leaf
} from "lucide-react"

export default function VillagerDashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { name: "Dashboard", path: "/villager/dashboard", icon: LayoutDashboard },
    { name: "Report Incident", path: "/villager/report-wildlife", icon: ShieldAlert },
    { name: "My Reports", path: "/villager/my-reports", icon: FileText },
    { name: "Profile", path: "/villager/profile", icon: User }
  ]

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userRole")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 font-sans antialiased flex flex-col">
      
      {/* Villager Topbar */}
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shadow-2xs sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold shadow-xs">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold uppercase tracking-wide font-sans text-slate-900">gaia</span>
              <span className="text-[10px] font-semibold text-emerald-600 block -mt-0.5">Resident Portal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate("/villager/report-wildlife")}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Report Incident</span>
          </button>

          <button 
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-grow">
        
        {/* Navigation Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 p-4 space-y-1.5 transition-transform duration-200 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
          <h4 className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Resident Menu
          </h4>
          {navItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl text-xs font-bold transition ${
                  isActive ? "bg-[#10b981] text-white shadow-md shadow-emerald-500/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 mr-3 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </aside>

        {/* Main Body */}
        <main className="flex-grow p-6 lg:p-8 bg-[#f8faf7]">
          <div className="mx-auto max-w-[1100px]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
