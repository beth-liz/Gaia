import { useState } from "react"
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, Users, Shield, ShieldAlert, UserCheck, 
  Search, Bell, LogOut, Menu, Leaf, ChevronDown
} from "lucide-react"

export default function AdminDashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()

  // Streamlined Admin Sidebar Links
  const sidebarItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Villagers", path: "/admin/users", icon: Users },
    { name: "Officers", path: "/admin/officers", icon: Shield },
    { name: "Sub Officers", path: "/admin/sub-officers", icon: UserCheck },
    { name: "Incidents", path: "/admin/incidents", icon: ShieldAlert },
  ]

  const liveAlerts = [
    { id: 1, text: "New Sighting Report: Asian Elephant herd near Chundale", time: "5m ago" },
    { id: 2, text: "Officer Marcus Jose accepted incident INC-9941", time: "18m ago" },
    { id: 3, text: "Pending villager registration: Muhammed Shafi", time: "30m ago" }
  ]

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userRole")
    navigate("/login")
  }

  const getActiveTitle = () => {
    const p = location.pathname
    if (p.includes("/admin/dashboard")) return "Dashboard Overview"
    if (p.includes("/admin/users")) return "Villagers Directory"
    if (p.includes("/admin/officers")) return "Officers Management"
    if (p.includes("/admin/sub-officers")) return "Sub Officers Directory"
    if (p.includes("/admin/incidents")) return "Incidents Control"
    return "Gaia Platform"
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 font-sans antialiased flex">
      
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#0b2316]/60 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Modern Collapsible Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b2316] text-white transition-all duration-300 shadow-xl 
          ${isSidebarCollapsed ? "w-20" : "w-64"} 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#123c27]/80 shrink-0">
          <div 
            onClick={() => navigate("/")}
            className="flex items-center space-x-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold shrink-0 shadow-md group-hover:scale-105 transition-all duration-200">
              <Leaf className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-extrabold tracking-wide text-white font-sans leading-none">gaia</span>
                <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase mt-1">
                  Wildlife Platform
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:block text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#123c27] transition"
            title="Toggle Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Items */}
        <nav className="flex-grow py-5 px-3 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group relative
                  ${isActive 
                    ? "bg-[#10b981] text-white shadow-md shadow-emerald-900/30" 
                    : "text-slate-300 hover:bg-[#123c27]/80 hover:text-white"
                  }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-emerald-400"}`} />
                {!isSidebarCollapsed && <span className="ml-3.5 truncate">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0b2316] border border-[#123c27] text-white text-xs font-bold rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#123c27]/80 shrink-0 space-y-3">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3 p-2.5 bg-[#123c27]/60 border border-[#10b981]/20 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AD
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-extrabold text-white truncate leading-tight">Admin User</p>
                <p className="text-[10px] text-emerald-300 font-semibold truncate">admin@gaia.io</p>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center py-2 px-3 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 w-full transition duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="ml-2.5">Logout</span>}
          </button>
        </div>

      </aside>

      {/* Main Workspace */}
      <div 
        className={`flex-grow flex flex-col min-h-screen transition-all duration-300 
          ${isSidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}
      >
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 shadow-2xs shrink-0">
          
          {/* Active Title */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden hover:bg-slate-100 rounded-xl transition"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {getActiveTitle()}
              </h1>
            </div>
          </div>

          {/* Search, Notifications & Profile Utilities */}
          <div className="flex items-center space-x-3">
            
            {/* Search Bar */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search villagers, officers..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition"
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl relative transition"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-extrabold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">3 New</span>
                  </div>
                  <div className="space-y-2">
                    {liveAlerts.map(a => (
                      <div key={a.id} className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition cursor-pointer text-xs space-y-0.5">
                        <p className="text-slate-800 font-semibold leading-snug">{a.text}</p>
                        <span className="text-[10px] text-slate-400 font-medium block">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2.5 border border-slate-200 rounded-xl px-3 py-1.5 bg-white hover:bg-slate-50 transition shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#10b981] to-[#059669] text-white flex items-center justify-center font-bold text-xs">
                  AD
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">Admin</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 space-y-0.5">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900">Administrator</p>
                    <p className="text-[10px] text-slate-500 font-medium">admin@gaia.io</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Content Body Container */}
        <main className="flex-grow p-6 lg:p-8 bg-[#f8faf7]">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
