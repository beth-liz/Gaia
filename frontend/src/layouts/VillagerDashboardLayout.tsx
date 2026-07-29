import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, AlertTriangle, FileText, Bell, User } from "lucide-react";

const villagerNavItems: NavItem[] = [
  { label: "Dashboard", path: "/villager/dashboard", icon: LayoutDashboard },
  { label: "Report Incident", path: "/villager/report-incident", icon: AlertTriangle },
  { label: "My Reports", path: "/villager/my-reports", icon: FileText },
  { label: "Notifications", path: "/villager/notifications", icon: Bell },
  { label: "Profile", path: "/villager/profile", icon: User },
];

const VillagerDashboardLayout: React.FC = () => {
  return <BaseDashboardLayout roleTitle="Villager Portal" navItems={villagerNavItems} />;
};

export default VillagerDashboardLayout;
