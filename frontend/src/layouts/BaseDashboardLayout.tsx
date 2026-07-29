import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Trees, LogOut, Menu, X } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

interface BaseDashboardLayoutProps {
  roleTitle: string;
  roleBadgeColor?: string;
  navItems: NavItem[];
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  roleTitle,
  navItems,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-emerald-950/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-300">
            <Trees className="w-5 h-5" />
          </div>
          <span className="font-bold text-emerald-950 tracking-tight">GAIA</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-900/10"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-md border-r border-emerald-950/10 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-6 border-b border-emerald-950/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Trees className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <span className="text-lg font-bold tracking-tight text-emerald-950 block">GAIA</span>
              <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider block truncate">
                {roleTitle}
              </span>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-4 mt-4 rounded-2xl bg-emerald-50/70 border border-emerald-900/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900 text-amber-300 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-emerald-950 truncate">{user?.full_name || "Operational User"}</p>
              <p className="text-[11px] text-emerald-800/80 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-900 text-white shadow-md shadow-emerald-950/15"
                      : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-amber-400 text-emerald-950" : "bg-emerald-100 text-emerald-900"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Fixed Bottom Logout Button */}
          <div className="p-4 border-t border-emerald-950/10 bg-white/50">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all duration-200 border border-red-200/60"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Account
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-7xl w-full mx-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
