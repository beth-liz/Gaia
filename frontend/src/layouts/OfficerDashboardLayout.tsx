import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, Radio, Bell } from "lucide-react";

const rfoNavItems: NavItem[] = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
  { label: "Incident Operations", path: "/officer/incidents", icon: Radio, sectionHeader: "Command Center" },
  { label: "Notifications", path: "/officer/notifications", icon: Bell },
];

const OfficerDashboardLayout: React.FC = () => {
  return (
    <BaseDashboardLayout
      roleTitle="Officer Command Center"
      navItems={rfoNavItems}
      profilePath="/officer/profile"
    />
  );
};

export default OfficerDashboardLayout;
