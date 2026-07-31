import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Award,
  AlertCircle,
  Bell,
  Globe,
  Building2,
  Radio,
} from "lucide-react";

const adminNavItems: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  
  // Administrative Hierarchy section
  { label: "States", path: "/admin/states", icon: Globe, sectionHeader: "Administrative Hierarchy" },
  { label: "Districts", path: "/admin/districts", icon: Building2 },
  { label: "Monitoring Stations", path: "/admin/monitoring-stations", icon: Radio },

  // Operations & Governance section
  { label: "Villagers", path: "/admin/villagers", icon: Users, sectionHeader: "Operations & Governance" },
  { label: "Officers", path: "/admin/officers", icon: ShieldAlert },
  { label: "Designations", path: "/admin/designations", icon: Award },
  { label: "Incidents", path: "/admin/incidents", icon: AlertCircle },

  // System section
  { label: "Notifications", path: "/admin/notifications", icon: Bell, sectionHeader: "System" },
];

const AdminDashboardLayout: React.FC = () => {
  return (
    <BaseDashboardLayout
      roleTitle="System Admin Control"
      navItems={adminNavItems}
      profilePath="/admin/profile"
    />
  );
};

export default AdminDashboardLayout;
