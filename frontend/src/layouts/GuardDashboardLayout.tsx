import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, FileCheck, CheckCircle2, Bell, User } from "lucide-react";

const guardNavItems: NavItem[] = [
  { label: "Dashboard", path: "/guard/dashboard", icon: LayoutDashboard },
  { label: "My Assignments", path: "/guard/assignments", icon: FileCheck, sectionHeader: "Field Operations" },
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
