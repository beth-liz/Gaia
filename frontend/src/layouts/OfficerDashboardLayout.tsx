import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, Radio, Bell, User } from "lucide-react";

const rfoNavItems: NavItem[] = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
  { label: "Assigned Incidents", path: "/officer/incidents", icon: Radio },
  { label: "Notifications", path: "/officer/notifications", icon: Bell },
  { label: "Profile", path: "/officer/profile", icon: User },
];

const OfficerDashboardLayout: React.FC = () => {
  return <BaseDashboardLayout roleTitle="Range Officer Command" navItems={rfoNavItems} />;
};

export default OfficerDashboardLayout;
