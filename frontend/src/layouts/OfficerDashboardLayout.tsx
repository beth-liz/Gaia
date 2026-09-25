import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import {
  LayoutDashboard,
  Radio,
  Users,
  Building2,
  Bell,
  CheckCircle2,
  User,
  FileCheck,
  Warehouse,
  ShieldCheck,
  Send,
  PackageCheck,
  RotateCcw,
  History,
  Clock,
  Globe
} from "lucide-react";

const rfoNavItems: NavItem[] = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
  { label: "GIS Intelligence", path: "/officer/gis", icon: Globe, sectionHeader: "Spatial Operations" },
  { label: "Report Incident", path: "/officer/report-incident", icon: FileCheck },
  { label: "My Reports", path: "/officer/my-reports", icon: FileCheck },
  { label: "Incidents", path: "/officer/incidents", icon: Radio, sectionHeader: "Field Operations" },
  { label: "Forest Guards", path: "/officer/guards", icon: Users },
  { label: "Station Overview", path: "/officer/station", icon: Building2 },

  { label: "Inventory Dashboard", path: "/officer/inventory/dashboard", icon: LayoutDashboard, sectionHeader: "Inventory Management" },
  { label: "Add / Update Station Stock", path: "/officer/inventory/stock", icon: Warehouse },
  { label: "Equipment Requests", path: "/officer/inventory/requests", icon: Clock },
  { label: "Issue Equipment", path: "/officer/inventory/issue", icon: Send },
  {
    label: "Assigned Equipment",
    path: "/officer/inventory/assigned",
    icon: PackageCheck,
    children: [
      { label: "Issued Equipment", path: "/officer/inventory/assigned/issued", icon: ShieldCheck },
      { label: "Pending Returns", path: "/officer/inventory/assigned/pending-returns", icon: Clock },
      { label: "Verify Returns", path: "/officer/inventory/assigned/verify-returns", icon: RotateCcw },
      { label: "Returned Equipment", path: "/officer/inventory/assigned/returned", icon: CheckCircle2 },
      { label: "Damaged Equipment", path: "/officer/inventory/assigned/damaged", icon: ShieldCheck },
    ],
  },

  { label: "Audit History", path: "/officer/inventory/audit", icon: History },

  { label: "Notifications", path: "/officer/notifications", icon: Bell, sectionHeader: "System" },
  { label: "Profile & Settings", path: "/officer/profile", icon: User },
];

const OfficerDashboardLayout: React.FC = () => {
  return (
    <BaseDashboardLayout
      roleTitle="Range Officer Command Center"
      navItems={rfoNavItems}
      profilePath="/officer/profile"
    />
  );
};

export default OfficerDashboardLayout;
