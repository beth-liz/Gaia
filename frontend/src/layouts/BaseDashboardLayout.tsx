import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Trees,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  sectionHeader?: string;
  children?: NavItem[];
}

interface BaseDashboardLayoutProps {
  roleTitle: string;
  navItems: NavItem[];
  profilePath: string;
  bgTransparent?: boolean;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  roleTitle,
  navItems,
  profilePath,
  bgTransparent = false,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [globalSearch, setGlobalSearch] = useState("");

  const isVillager = (user?.role || "").toLowerCase() === "villager" || bgTransparent;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const isActive = item.children.some((child) => location.pathname.startsWith(child.path));
        initialState[item.label] = isActive;
      }
    });
    return initialState;
  });

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const getPageTitle = () => {
    const activeChild = navItems
      .flatMap((item) => item.children || [])
      .find((child) => child && location.pathname.startsWith(child.path));
    if (activeChild) return activeChild.label;

    const activeItem = navItems.find(
      (item) => location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))
    );
    if (activeItem) return activeItem.label;

    if (location.pathname.includes("/profile")) return "Profile & Settings";
    if (location.pathname.includes("/notifications")) return "Notifications";
    if (location.pathname.includes("/report-incident")) return "Report Incident";
    if (location.pathname.includes("/my-reports")) return "My Incident Reports";
    return "Dashboard";
  };

  const pageTitle = getPageTitle();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const term = globalSearch.trim().toLowerCase();
    if (user?.role === "Admin") {
      navigate(`/admin/incidents?search=${encodeURIComponent(term)}`);
    } else if (user?.role === "Villager") {
      navigate(`/villager/my-reports?search=${encodeURIComponent(term)}`);
    } else if (user?.role === "Forest Guard") {
      navigate(`/guard/assignments?search=${encodeURIComponent(term)}`);
    } else {
      navigate(`/officer/incidents?search=${encodeURIComponent(term)}`);
    }
  };

  const getDashboardHomePath = () => {
    if (user?.role === "Admin") return "/admin/dashboard";
    if (user?.role === "Villager") return "/villager/dashboard";
    if (user?.role === "Forest Guard") return "/guard/dashboard";
    return "/officer/dashboard";
  };

  const getProfileImage = () => {
    const rawPath = user?.profile_image || user?.avatar_url;
    if (!rawPath) return null;
    return getImageUrl(rawPath);
  };

  const profileImg = getProfileImage();

  return (
    <div className={`h-screen w-full ${bgTransparent ? "bg-transparent" : "bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef]"} flex flex-col overflow-hidden`}>
      {/* Fixed Top Navigation Bar */}
      <header className={`fixed top-0 inset-x-0 z-40 h-16 backdrop-blur-md border-b flex items-center shadow-xs transition-colors ${
        isVillager 
          ? "bg-[#061c14]/90 border-emerald-900/40 text-white" 
          : "bg-white/95 border-emerald-950/10 text-emerald-950"
      }`}>
        {/* Left Section: Logo Container */}
        <div className={`w-auto md:w-64 h-full flex items-center justify-between px-4 border-r shrink-0 ${
          isVillager ? "border-emerald-900/40" : "border-emerald-950/10"
        }`}>
          <Link to={getDashboardHomePath()} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 border border-emerald-500/30 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform">
              <Trees className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className={`text-base font-extrabold tracking-tight block leading-none ${
                isVillager ? "text-white" : "text-emerald-950"
              }`}>GAIA</span>
              <span className={`text-[9px] uppercase font-bold tracking-wider block mt-0.5 ${
                isVillager ? "text-emerald-300" : "text-emerald-700"
              }`}>
                {roleTitle}
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-xl border ${
              isVillager 
                ? "bg-emerald-900/50 text-white border-emerald-500/30" 
                : "bg-emerald-50 text-emerald-900 border-emerald-900/10"
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Header Right Content */}
        <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
          {/* Breadcrumb Title */}
          <div className="hidden md:flex items-center gap-2 font-bold text-sm">
            <span className={isVillager ? "text-emerald-300/70 font-medium" : "text-emerald-800/50 font-medium"}>Platform</span>
            <ChevronRight className={`w-4 h-4 ${isVillager ? "text-emerald-400/50" : "text-emerald-800/40"}`} />
            <span className={`font-extrabold ${isVillager ? "text-white drop-shadow-xs" : "text-emerald-950"}`}>{pageTitle}</span>
          </div>

          {/* Right Aligned Controls */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search Bar */}
            <form onSubmit={handleGlobalSearch} className="hidden sm:flex items-center w-64 md:w-72 relative" autoComplete="off">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isVillager ? "text-emerald-300" : "text-emerald-700/60"
              }`} />
              <input
                type="text"
                placeholder="Search Gaia platform..."
                autoComplete="off"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-xs rounded-2xl border font-medium focus:outline-none transition-all ${
                  isVillager 
                    ? "bg-emerald-950/60 border-emerald-500/30 text-white placeholder:text-emerald-300/60 focus:bg-emerald-950/90 focus:border-emerald-400" 
                    : "border-emerald-950/10 bg-emerald-50/40 text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-900/20"
                }`}
              />
            </form>

            {/* Notifications Button */}
            <Link
              to={
                user?.role === "Admin"
                  ? "/admin/notifications"
                  : user?.role === "Villager"
                  ? "/villager/notifications"
                  : user?.role === "Forest Guard"
                  ? "/guard/notifications"
                  : "/officer/notifications"
              }
              className={`relative p-2 rounded-2xl transition-colors border ${
                isVillager 
                  ? "bg-emerald-950/60 hover:bg-emerald-900/70 text-white border-emerald-500/30" 
                  : "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-950/10"
              }`}
              title="Notifications"
            >
              <Bell className={`w-5 h-5 ${isVillager ? "text-amber-400 fill-amber-400/20" : "text-emerald-700"}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Button */}
            <Link
              to={profilePath}
              className={`flex items-center gap-2.5 p-1 pr-3 rounded-2xl border transition-all ${
                isVillager
                  ? "bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-500/30 text-white"
                  : "bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-950/10"
              }`}
              title="Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-900 text-amber-300 font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden border border-amber-300/40 shrink-0">
                {profileImg ? (
                  <img src={profileImg} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"
                )}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className={`font-extrabold leading-tight truncate max-w-[120px] ${
                  isVillager ? "text-white" : "text-emerald-950"
                }`}>{user?.full_name || "User"}</p>
                <p className={`text-[10px] truncate max-w-[120px] ${
                  isVillager ? "text-emerald-300/80" : "text-emerald-800/70"
                }`}>{user?.designation_name || user?.role}</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container below Fixed Top Bar */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:relative top-16 md:top-0 inset-y-0 left-0 z-30 w-64 backdrop-blur-md border-r flex flex-col justify-between transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${
            isVillager
              ? "bg-[#061c14]/85 border-emerald-900/40 text-white"
              : "bg-white/90 border-emerald-950/10"
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            {/* Nav Items List */}
            <nav className="p-4 space-y-1 overflow-y-auto flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isChildActive = hasChildren && Boolean(item.children?.some((c) => location.pathname.startsWith(c.path)));
                const isActive = (location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))) || isChildActive;
                const isExpanded = expandedMenus[item.label] !== undefined ? expandedMenus[item.label] : isChildActive;

                return (
                  <React.Fragment key={item.path}>
                    {item.sectionHeader && (
                      <div className={`px-3 pt-4 pb-1.5 text-[10px] font-black tracking-wider uppercase border-t mt-2 ${
                        isVillager
                          ? "text-emerald-300/80 border-emerald-900/40"
                          : "text-emerald-800/60 border-emerald-950/5"
                      }`}>
                        {item.sectionHeader}
                      </div>
                    )}

                    {hasChildren ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.label)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-emerald-800 text-white shadow-md border border-emerald-500/30"
                              : isVillager
                              ? "text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white"
                              : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-300" : isVillager ? "text-emerald-300" : "text-emerald-700"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>

                        {isExpanded && item.children && (
                          <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-emerald-700/50 ml-4">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isSubActive = location.pathname === child.path || location.pathname.startsWith(child.path);
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  onClick={() => setMobileOpen(false)}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                    isSubActive
                                      ? "bg-emerald-800 text-white shadow-xs"
                                      : isVillager
                                      ? "text-emerald-100/80 hover:bg-emerald-900/40 hover:text-white"
                                      : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                                  }`}
                                >
                                  <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-amber-300" : isVillager ? "text-emerald-300" : "text-emerald-700"}`} />
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-emerald-800 text-white shadow-md border border-emerald-500/30"
                            : isVillager
                            ? "text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white"
                            : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-300" : isVillager ? "text-emerald-300" : "text-emerald-700"}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isActive ? "bg-amber-400 text-emerald-950" : "bg-emerald-500/30 text-white border border-emerald-400/30"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Bottom Sidebar: Profile & Settings and Sign Out */}
            <div className={`p-4 border-t space-y-2 ${
              isVillager 
                ? "border-emerald-900/40 bg-emerald-950/40" 
                : "border-emerald-950/10 bg-white/60"
            }`}>
              <Link
                to={profilePath}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  location.pathname === profilePath
                    ? "bg-emerald-800 text-white shadow-md border border-emerald-500/30"
                    : isVillager
                    ? "text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white"
                    : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                }`}
              >
                <UserIcon className={`w-5 h-5 shrink-0 ${
                  location.pathname === profilePath ? "text-amber-300" : isVillager ? "text-emerald-300" : "text-emerald-700"
                }`} />
                <span>Profile & Settings</span>
              </Link>

              {/* Strong Red Sign Out button */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold transition-all duration-200 border border-rose-500 shadow-md shadow-rose-950/30"
              >
                <LogOut className="w-4 h-4 text-white" />
                Sign Out Account
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
