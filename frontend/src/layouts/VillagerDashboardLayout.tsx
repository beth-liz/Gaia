import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, AlertTriangle, FileText, Bell } from "lucide-react";

const villagerNavItems: NavItem[] = [
  { label: "Dashboard", path: "/villager/dashboard", icon: LayoutDashboard },
  { label: "Report Incident", path: "/villager/report-incident", icon: AlertTriangle, sectionHeader: "Village Alerts" },
  { label: "My Incident Reports", path: "/villager/my-reports", icon: FileText },
  { label: "Notifications", path: "/villager/notifications", icon: Bell },
];

const VillagerDashboardLayout: React.FC = () => {
  return (
    <BaseDashboardLayout
      roleTitle="Villager Portal"
      navItems={villagerNavItems}
      profilePath="/villager/profile"
    />
  );
};

export default VillagerDashboardLayout;
