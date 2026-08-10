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
  Warehouse,
  ShieldCheck,
  Send,
  PackageCheck,
  RotateCcw,
  History,
  Clock,
} from "lucide-react";

const rfoNavItems: NavItem[] = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
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

const guardNavItems: NavItem[] = [
  { label: "Dashboard", path: "/guard/dashboard", icon: LayoutDashboard },
  { label: "My Assignments", path: "/guard/assignments", icon: FileCheck, sectionHeader: "Field Operations" },
  { label: "My Equipment & Kits", path: "/guard/inventory/my-equipment", icon: ShieldCheck, sectionHeader: "Equipment Management" },
  { label: "Return Equipment", path: "/guard/inventory/return-equipment", icon: RotateCcw },
  { label: "Completed Reports", path: "/guard/completed", icon: CheckCircle2, sectionHeader: "Reporting" },
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
