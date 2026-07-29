import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, Users, ShieldAlert, Award, AlertCircle, Bell, User, Settings } from "lucide-react";

const adminNavItems: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Villagers", path: "/admin/villagers", icon: Users },
  { label: "Officers", path: "/admin/officers", icon: ShieldAlert },
  { label: "Designations", path: "/admin/designations", icon: Award },
  { label: "Incidents", path: "/admin/incidents", icon: AlertCircle },
  { label: "Notifications", path: "/admin/notifications", icon: Bell },
  { label: "Profile", path: "/admin/profile", icon: User },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminDashboardLayout: React.FC = () => {
  return <BaseDashboardLayout roleTitle="System Admin Control" navItems={adminNavItems} />;
};

export default AdminDashboardLayout;
