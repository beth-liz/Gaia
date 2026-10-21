import React from "react";
import { BaseDashboardLayout } from "./BaseDashboardLayout";
import type { NavItem } from "./BaseDashboardLayout";
import { LayoutDashboard, AlertTriangle, FileText, Bell, Flame, Map } from "lucide-react";

const villagerNavItems: NavItem[] = [
  { label: "Dashboard", path: "/villager/dashboard", icon: LayoutDashboard },
  { label: "GIS Mapping", path: "/villager/gis/mapping", icon: Map, sectionHeader: "Spatial Intelligence" },
  { label: "Conflict Heatmap", path: "/villager/gis/heatmap", icon: Flame },
  { label: "Report Incident", path: "/villager/report-incident", icon: AlertTriangle, sectionHeader: "Village Alerts" },
  { label: "My Incident Reports", path: "/villager/my-reports", icon: FileText },
  { label: "Notifications", path: "/villager/notifications", icon: Bell },
];

const VillagerDashboardLayout: React.FC = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 
        BACKGROUND LAYER FOR ALL VILLAGER MODULE PAGES:
        - Exact same full-cover nature5.jpg background image and subtle transparent forest gradient
      */}
      <div
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(6, 28, 20, 0.35) 0%, rgba(13, 40, 24, 0.25) 50%, rgba(6, 28, 20, 0.40) 100%),
            url('/images/nature5.jpg')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 h-full w-full">
        <BaseDashboardLayout
          roleTitle="Villager Portal"
          navItems={villagerNavItems}
          profilePath="/villager/profile"
          bgTransparent={true}
        />
      </div>
    </div>
  );
};

export default VillagerDashboardLayout;
