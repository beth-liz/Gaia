import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Radio,
  Users,
  Building2,
  Bell,
  CheckCircle2,
  User,
  FileCheck,
} from "lucide-react";

const rfoNavItems: NavItem[] = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
  { label: "Incidents", path: "/officer/incidents", icon: Radio, sectionHeader: "Field Operations" },
  { label: "Forest Guards", path: "/officer/guards", icon: Users },
  { label: "Station Overview", path: "/officer/station", icon: Building2 },
  { label: "Notifications", path: "/officer/notifications", icon: Bell, sectionHeader: "System" },
  { label: "Profile & Settings", path: "/officer/profile", icon: User },
];

const guardNavItems: NavItem[] = [
  { label: "Dashboard", path: "/guard/dashboard", icon: LayoutDashboard },
  { label: "My Assignments", path: "/guard/assignments", icon: FileCheck, sectionHeader: "Field Operations" },
  { label: "Completed Reports", path: "/guard/completed", icon: CheckCircle2 },
  { label: "Notifications", path: "/guard/notifications", icon: Bell, sectionHeader: "System" },
  { label: "Profile & Settings", path: "/guard/profile", icon: User },
];

const OfficerDashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const isGuard = user?.role === "Forest Guard";

  return (
    <BaseDashboardLayout
      roleTitle={isGuard ? "Forest Guard Command" : "Range Officer Command Center"}
      navItems={isGuard ? guardNavItems : rfoNavItems}
      profilePath={isGuard ? "/guard/profile" : "/officer/profile"}
    />
  );
};

export default OfficerDashboardLayout;
