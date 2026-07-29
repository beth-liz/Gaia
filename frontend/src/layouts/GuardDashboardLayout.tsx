import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, ShieldCheck, FileText, Bell, User } from "lucide-react";

const guardNavItems: NavItem[] = [
  { label: "Dashboard", path: "/guard/dashboard", icon: LayoutDashboard },
  { label: "My Incidents", path: "/guard/incidents", icon: ShieldCheck },
  { label: "Reports", path: "/guard/reports", icon: FileText },
  { label: "Notifications", path: "/guard/notifications", icon: Bell },
  { label: "Profile", path: "/guard/profile", icon: User },
];

const GuardDashboardLayout: React.FC = () => {
  return <BaseDashboardLayout roleTitle="Forest Guard Operations" navItems={guardNavItems} />;
};

export default GuardDashboardLayout;
