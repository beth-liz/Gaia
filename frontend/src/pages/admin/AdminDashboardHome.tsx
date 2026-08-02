import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Clock,
  Radio,
  Globe,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Activity,
  FileCheck,
} from "lucide-react";

export const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [pendingVillagers, setPendingVillagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sData, incData, vilData] = await Promise.all([
        api.getDashboardStats(),
        api.getIncidents(),
        api.getVillagers("pending"),
      ]);
      setStats(sData);
      setRecentIncidents(incData.slice(0, 5));
      setPendingVillagers(vilData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Admin Realtime Intelligence...</p>
      </div>
    );
  }

  const missingRFOs = stats?.stations_missing_head_officer || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Command Center"
        subtitle="Realtime operational intelligence across monitoring stations, field guards, and incident streams"
        icon={Globe}
      />

      {/* HIGH PRIORITY WARNING ALERT CARD (If stations missing head RFO) */}
      {missingRFOs > 0 && (
        <Link
          to="/admin/monitoring-stations"
          className="block p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all border border-red-500/40 group animate-pulse"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  High Priority System Constraint Warning
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  ⚠ {missingRFOs} Station{missingRFOs > 1 ? "s" : ""} Requiring Head Officer Assignment
                </h3>
                <p className="text-xs text-red-100/90 font-medium leading-tight">
                  Monitoring stations must have an assigned Range Forest Officer before Forest Guards can be deployed. Click to assign Head Officers.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-white text-red-700 px-4 py-2 rounded-2xl font-extrabold text-xs shrink-0 group-hover:bg-amber-300 group-hover:text-red-950 transition-all">
              Manage Stations <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      )}

      {/* 8 Metric Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Missing Head Officers */}
        <Link
          to="/admin/monitoring-stations"
          className={`p-4 rounded-2xl border shadow-xs transition-all flex flex-col justify-between space-y-2 ${
            missingRFOs > 0 ? "bg-red-50/80 border-red-200 hover:bg-red-100" : "bg-white/90 border-emerald-950/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">Missing Head RFOs</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-red-950">{missingRFOs}</p>
            <p className="text-[10px] text-red-800/70 font-semibold">Stations Require Head Officer</p>
          </div>
        </Link>

        {/* Card 2: Available Guards */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Available Guards</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.available_guards_count || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Ready for Dispatch</p>
          </div>
        </div>

        {/* Card 3: Busy Guards */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Busy Guards</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-950">{stats?.busy_guards_count || 0}</p>
            <p className="text-[10px] text-amber-800/70 font-semibold">Deployed on Field Duty</p>
          </div>
        </div>

        {/* Card 4: Open Incidents */}
        <Link
          to="/admin/incidents"
          className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2 hover:bg-emerald-50/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Open Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.open_incidents || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Active Field Incidents</p>
          </div>
        </Link>

        {/* Card 5: Awaiting Review */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Awaiting Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-950">{stats?.incidents_awaiting_review || 0}</p>
            <p className="text-[10px] text-amber-800/70 font-semibold">Pending RFO Action</p>
          </div>
        </div>

        {/* Card 6: In Progress */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-950">{stats?.incidents_in_progress || 0}</p>
            <p className="text-[10px] text-purple-800/70 font-semibold">Guards Operating in Field</p>
          </div>
        </div>

        {/* Card 7: Resolved Today */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Resolved Today</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-teal-950">{stats?.resolved_today || 0}</p>
            <p className="text-[10px] text-teal-800/70 font-semibold">Field Reports Completed Today</p>
          </div>
        </div>

        {/* Card 8: Closed This Month */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Closed This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.closed_this_month || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Operations Closed</p>
          </div>
        </div>
      </div>

      {/* Overview Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Villager Registrations */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950">Pending Villager Registrations</h3>
              <p className="text-[11px] text-emerald-800/60 font-medium">Awaiting Admin Verification</p>
            </div>
            <Link to="/admin/villagers" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingVillagers.length === 0 ? (
            <p className="text-xs text-emerald-900/50 py-6 text-center">No villagers currently awaiting approval.</p>
          ) : (
            <div className="space-y-2.5">
              {pendingVillagers.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-950/5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{v.full_name}</p>
                    <p className="text-[11px] text-emerald-800/70">{v.email} &bull; {v.village_name || "Unknown Village"}</p>
                  </div>
                  <Link
                    to="/admin/villagers"
                    className="px-3 py-1 rounded-xl bg-emerald-900 text-white text-[11px] font-bold hover:bg-emerald-950 transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incidents Overview */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950">Recent Wildlife Incidents</h3>
              <p className="text-[11px] text-emerald-800/60 font-medium">Logged from Sector Ranges</p>
            </div>
            <Link to="/admin/incidents" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              Manage Stream <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <p className="text-xs text-emerald-900/50 py-6 text-center">No wildlife incidents reported yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-950/5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800">{inc.reference_id}</span>
                      <span className="text-xs font-bold text-emerald-950">{inc.animal}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.severity === "Critical" ? "bg-red-100 text-red-800" :
                        inc.severity === "High" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/70">{inc.location} &bull; Status: <strong className="text-emerald-950">{inc.status}</strong></p>
                  </div>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-[11px] font-bold hover:bg-emerald-200 transition-all"
                  >
                    Inspect
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
