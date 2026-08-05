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
  Trees,
  Package,
  Warehouse,
  ShieldCheck,
} from "lucide-react";

const adminNavItems: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  
  // Master Data & Administrative Hierarchy section
  { label: "States", path: "/admin/states", icon: Globe, sectionHeader: "Master Data & Hierarchy" },
  { label: "Districts", path: "/admin/districts", icon: Building2 },
  { label: "Monitoring Stations", path: "/admin/monitoring-stations", icon: Radio },
  { label: "Animal Species", path: "/admin/animal-species", icon: Trees },

  // Inventory Management section
  { label: "Inventory Master", path: "/admin/inventory/master", icon: Package, sectionHeader: "Inventory Management" },
  { label: "Station Inventory Overview", path: "/admin/inventory/stations", icon: Warehouse },
  { label: "System Audit Logs", path: "/admin/inventory/audit-logs", icon: ShieldCheck },

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
