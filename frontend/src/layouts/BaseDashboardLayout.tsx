import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
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
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  roleTitle,
  navItems,
  profilePath,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await api.getNotifications();
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {
        // silent catch
      }
    };
    if (user) fetchNotifications();
  }, [user, location.pathname]);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Determine page title from active route
  const activeItem = navItems.find((item) =>
    location.pathname === item.path ||
    (item.children && item.children.some((c) => location.pathname.startsWith(c.path))) ||
    (item.path !== "/" && location.pathname.startsWith(item.path))
  );
  const pageTitle = activeItem ? activeItem.label : "Dashboard";

  const getDashboardHomePath = () => {
    const roleLower = (user?.role || "").toLowerCase();
    if (user?.role === "Admin" || roleLower === "admin") return "/admin/dashboard";
    if (user?.role === "Villager" || roleLower === "villager") return "/villager/dashboard";
    return "/officer/dashboard";
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    if (user?.role === "Admin") {
      navigate(`/admin/incidents`);
    } else if (user?.role === "Villager") {
      navigate(`/villager/my-reports`);
    } else {
      navigate(`/officer/incidents`);
    }
  };

  const getProfileImage = () => {
    if (user?.profile_image) {
      if (user.profile_image.startsWith("http") || user.profile_image.startsWith("/static")) {
        return user.profile_image.startsWith("/static") ? `http://127.0.0.1:8000${user.profile_image}` : user.profile_image;
      }
      return user.profile_image;
    }
    if (user?.avatar_url) {
      return user.avatar_url.startsWith("/static") ? `http://127.0.0.1:8000${user.avatar_url}` : user.avatar_url;
    }
    return null;
  };

  const profileImg = getProfileImage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f7f4eb] to-[#eef5ef] flex flex-col overflow-hidden">
      {/* Fixed Top Navigation Bar with Visual 1px Sidebar Separator */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 flex items-center shadow-xs">
        {/* Left Section: Logo Container with 1px Right Separator Line matching Sidebar Width (w-64) */}
        <div className="w-auto md:w-64 h-full flex items-center justify-between px-4 border-r border-emerald-950/10 shrink-0">
          <Link to={getDashboardHomePath()} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform">
              <Trees className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold tracking-tight text-emerald-950 block leading-none">GAIA</span>
              <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider block mt-0.5">
                {roleTitle}
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-900/10"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Header Right Content: Breadcrumb Title, Search, Notifications, Profile */}
        <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
          {/* Breadcrumb Title */}
          <div className="hidden md:flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <span className="text-emerald-800/50 font-medium">Platform</span>
            <ChevronRight className="w-4 h-4 text-emerald-800/40" />
            <span className="text-emerald-950 font-extrabold">{pageTitle}</span>
          </div>

          {/* Right Aligned Controls: Search Bar -> Notifications -> Profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search Bar aligned closer to right side */}
            <form onSubmit={handleGlobalSearch} className="hidden sm:flex items-center w-64 md:w-72 relative" autoComplete="off">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700/60" />
              <input
                type="text"
                placeholder="Search Gaia platform..."
                autoComplete="off"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-emerald-950/10 bg-emerald-50/40 text-emerald-950 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 transition-all"
              />
            </form>

            {/* Notifications Button */}
            <Link
              to={user?.role === "Admin" ? "/admin/notifications" : user?.role === "Villager" ? "/villager/notifications" : "/officer/notifications"}
              className="relative p-2 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 transition-colors border border-emerald-950/10"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Button - Navigates to Role Profile Page */}
            <Link
              to={profilePath}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-950/10 transition-all"
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
                <p className="font-extrabold text-emerald-950 leading-tight truncate max-w-[120px]">{user?.full_name || "User"}</p>
                <p className="text-[10px] text-emerald-800/70 truncate max-w-[120px]">{user?.designation_name || user?.role}</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container below Fixed Top Bar */}
      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Fixed Sidebar Navigation with 1px Right Border */}
        <aside
          className={`fixed md:sticky top-16 inset-y-0 left-0 z-30 w-64 bg-white/90 backdrop-blur-md border-r border-emerald-950/10 flex flex-col justify-between transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } h-[calc(100vh-4rem)]`}
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
                      <div className="px-3 pt-4 pb-1.5 text-[10px] font-black tracking-wider text-emerald-800/60 uppercase border-t border-emerald-950/5 mt-2">
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
                              ? "bg-emerald-950 text-white shadow-md shadow-emerald-950/15"
                              : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        {isExpanded && item.children && (
                          <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-emerald-800/30 ml-4">
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
                                      ? "bg-emerald-900 text-white shadow-xs"
                                      : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                                  }`}
                                >
                                  <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-amber-300" : "text-emerald-700"}`} />
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
                            ? "bg-emerald-900 text-white shadow-md shadow-emerald-950/15"
                            : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? "bg-amber-400 text-emerald-950" : "bg-emerald-100 text-emerald-900"}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Standardized Bottom Sidebar: Profile & Settings and Logout */}
            <div className="p-4 border-t border-emerald-950/10 bg-white/60 space-y-2">
              <Link
                to={profilePath}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  location.pathname === profilePath
                    ? "bg-emerald-900 text-white shadow-md"
                    : "text-emerald-950/80 hover:bg-emerald-50 hover:text-emerald-950"
                }`}
              >
                <UserIcon className={`w-5 h-5 shrink-0 ${location.pathname === profilePath ? "text-amber-300" : "text-emerald-700"}`} />
                <span>Profile & Settings</span>
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold transition-all duration-200 border border-red-200/60"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Account
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Only page content scrolls) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
