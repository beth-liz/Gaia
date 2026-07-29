import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import {
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2
} from "lucide-react";

const AdminDashboardHome: React.FC = () => {
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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">System Command Center</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Realtime PostgreSQL metrics across all forest sectors & villages</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold border border-emerald-900/10 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-emerald-700" />
          Refresh Metrics
        </button>
      </div>

      {/* Dynamic Counter Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="gaia-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Villagers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.total_villagers || 0}</p>
          <div className="flex items-center gap-4 text-xs font-medium text-emerald-800/80 pt-1">
            <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-emerald-700" /> {stats?.approved_villagers || 0} Approved</span>
            <span className="flex items-center gap-1 text-amber-700 font-bold"><Clock className="w-3.5 h-3.5" /> {stats?.pending_villagers || 0} Pending</span>
          </div>
        </div>

        <div className="gaia-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Officers</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.total_officers || 0}</p>
          <div className="flex items-center gap-4 text-xs font-medium text-emerald-800/80 pt-1">
            <span><strong className="text-emerald-950">{stats?.rfos_count || 0}</strong> Range Officers</span>
            <span><strong className="text-emerald-950">{stats?.guards_count || 0}</strong> Guards</span>
          </div>
        </div>

        <div className="gaia-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Incidents Overview</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-900 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.total_incidents || 0}</p>
          <div className="flex items-center gap-4 text-xs font-medium text-emerald-800/80 pt-1">
            <span className="text-amber-700 font-bold">{stats?.open_incidents || 0} Active / Open</span>
            <span className="text-emerald-700 font-bold">{stats?.resolved_incidents || 0} Resolved</span>
          </div>
        </div>

        <div className="gaia-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Guard Readiness</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.available_guards_count || 0}</p>
          <p className="text-xs text-emerald-800/80 font-medium">Available for Instant Sector Dispatch</p>
        </div>
      </div>

      {/* Bottom Data Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approval Villagers */}
        <div className="gaia-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
            <div>
              <h3 className="text-base font-bold text-emerald-950">Pending Villager Registrations</h3>
              <p className="text-xs text-emerald-900/60">Awaiting Admin / RFO Approval</p>
            </div>
            <Link to="/admin/villagers" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingVillagers.length === 0 ? (
            <p className="text-xs text-emerald-900/50 py-6 text-center">No villagers currently awaiting approval.</p>
          ) : (
            <div className="space-y-3">
              {pendingVillagers.map((v) => (
                <div key={v.id} className="p-3.5 rounded-2xl bg-white border border-emerald-900/10 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{v.full_name}</p>
                    <p className="text-[11px] text-emerald-800/70">{v.email} &bull; {v.village_name || "Unknown Village"}</p>
                  </div>
                  <Link
                    to="/admin/villagers"
                    className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-semibold transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reported Incidents */}
        <div className="gaia-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
            <div>
              <h3 className="text-base font-bold text-emerald-950">Recent Wildlife Incidents</h3>
              <p className="text-xs text-emerald-900/60">Logged from Villages</p>
            </div>
            <Link to="/admin/incidents" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <p className="text-xs text-emerald-900/50 py-6 text-center">No wildlife incidents reported yet.</p>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="p-3.5 rounded-2xl bg-white border border-emerald-900/10 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
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
                  <span className="text-[11px] text-emerald-800/60">{inc.date_reported}</span>
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
