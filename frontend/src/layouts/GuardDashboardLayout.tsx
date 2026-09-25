import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, FileCheck, CheckCircle2, Bell, User, ShieldCheck, RotateCcw, AlertTriangle, FileText , Globe } from "lucide-react";

const guardNavItems: NavItem[] = [
  { label: "Dashboard", path: "/guard/dashboard", icon: LayoutDashboard },
  { label: "GIS Intelligence", path: "/guard/gis", icon: Globe, sectionHeader: "Spatial Operations" },
  { label: "Report Incident", path: "/guard/report-incident", icon: AlertTriangle, sectionHeader: "Field Operations" },
  { label: "My Assignments", path: "/guard/assignments", icon: FileCheck },
  { label: "My Equipment & Kits", path: "/guard/inventory/my-equipment", icon: ShieldCheck, sectionHeader: "Equipment Management" },
  { label: "Return Equipment", path: "/guard/inventory/return-equipment", icon: RotateCcw },
  { label: "My Reports", path: "/guard/my-reports", icon: FileText, sectionHeader: "Reporting" },
  { label: "Completed Reports", path: "/guard/completed", icon: CheckCircle2 },
  { label: "Notifications", path: "/guard/notifications", icon: Bell, sectionHeader: "System" },
  { label: "Profile & Settings", path: "/guard/profile", icon: User },
];

const GuardDashboardLayout: React.FC = () => {
  return (
    <BaseDashboardLayout
      roleTitle="Forest Guard Command"
      navItems={guardNavItems}
      profilePath="/guard/profile"
    />
  );
};

export default GuardDashboardLayout;
