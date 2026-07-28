import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, ShieldAlert, UserCheck, LogOut, Menu, Leaf
} from "lucide-react"

export default function OfficerDashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { name: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
    { name: "Assigned Incidents", path: "/officer/incidents", icon: ShieldAlert },
    { name: "Sub Officers", path: "/officer/sub-officers", icon: UserCheck }
  ]

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userRole")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 font-sans antialiased flex flex-col">
      
      {/* Officer Top Navbar */}
      <header className="bg-[#0b2316] text-white px-6 h-16 flex items-center justify-between border-b border-[#123c27] shadow-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden text-slate-300 hover:text-white p-1"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold shadow-xs">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold uppercase tracking-wide font-sans text-white">gaia</span>
              <span className="text-[10px] font-semibold text-emerald-400 block -mt-0.5">Officer Hub</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#123c27] px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 border border-[#10b981]/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Status: Active Duty</span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 px-3.5 py-1.5 rounded-xl border border-rose-800/50 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-grow">
        
        {/* Navigation Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#0b2316] text-white p-4 space-y-1.5 transition-transform duration-200 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
          <h4 className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Officer Menu
          </h4>
          {navItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl text-xs font-bold transition ${
                  isActive ? "bg-[#10b981] text-white shadow-md shadow-emerald-900/30" : "text-slate-300 hover:bg-[#123c27]/80 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 mr-3 shrink-0 text-emerald-400" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </aside>

        {/* Main Body */}
        <main className="flex-grow p-6 lg:p-8 bg-[#f8faf7]">
          <div className="mx-auto max-w-[1300px]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
