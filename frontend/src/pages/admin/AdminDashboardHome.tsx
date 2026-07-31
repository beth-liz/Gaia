import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Users,
  Clock,
  ShieldAlert,
  Radio,
  Building2,
  Globe,
  ArrowRight,
  Loader2,
  TrendingUp,
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
    <div className="space-y-6">
      <PageHeader
        title="System Command Center"
        subtitle="Realtime administrative statistics across all forest sectors & villages"
        icon={Globe}
      />

      {/* 6 Cards in One Row (Desktop: 6, Laptop: 3, Tablet: 2, Mobile: 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
        {/* Card 1: Total Officers */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Total Officers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.total_officers || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">{stats?.rfos_count || 0} RFO / {stats?.guards_count || 0} Guards</p>
          </div>
        </div>

        {/* Card 2: Total Villagers */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Total Villagers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.total_villagers || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">{stats?.approved_villagers || 0} Verified</p>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-900">{stats?.pending_approvals || stats?.pending_villagers || 0}</p>
            <p className="text-[10px] text-amber-800/70 font-semibold">Awaiting Verification</p>
          </div>
        </div>

        {/* Card 4: Monitoring Stations */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Monitoring Stations</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.monitoring_stations || stats?.total_stations || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Active Sector Hubs</p>
          </div>
        </div>

        {/* Card 5: Districts */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Districts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.districts || stats?.total_districts || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">Regional Coverage</p>
          </div>
        </div>

        {/* Card 6: States */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">States</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.states || stats?.total_states || 0}</p>
            <p className="text-[10px] text-emerald-800/70 font-semibold">State Boundaries</p>
          </div>
        </div>
      </div>

      {/* Middle Overview Grids */}
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
              Manage <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Bottom Statistical Analytics Section */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-900" />
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Operational Statistical Breakdown</h3>
          </div>
          <span className="text-xs text-emerald-800/70 font-semibold">Live Database Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Villager Approval Metric Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-950">Villager Verification Rate</span>
              <span className="text-emerald-800">
                {stats?.total_villagers ? Math.round(((stats.approved_villagers || 0) / stats.total_villagers) * 100) : 100}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-emerald-900 rounded-full transition-all duration-500"
                style={{
                  width: `${stats?.total_villagers ? Math.round(((stats.approved_villagers || 0) / stats.total_villagers) * 100) : 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-emerald-800/70 font-medium">{stats?.approved_villagers || 0} out of {stats?.total_villagers || 0} villagers verified</p>
          </div>

          {/* Incident Resolution Rate Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-950">Incident Resolution Progress</span>
              <span className="text-emerald-800">
                {stats?.total_incidents ? Math.round(((stats.resolved_incidents || 0) / stats.total_incidents) * 100) : 100}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${stats?.total_incidents ? Math.round(((stats.resolved_incidents || 0) / stats.total_incidents) * 100) : 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-emerald-800/70 font-medium">{stats?.resolved_incidents || 0} out of {stats?.total_incidents || 0} reported incidents completed</p>
          </div>

          {/* Guard Readiness Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-950">Guard Readiness Availability</span>
              <span className="text-emerald-800">
                {stats?.guards_count ? Math.round(((stats.available_guards_count || 0) / stats.guards_count) * 100) : 100}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-teal-700 rounded-full transition-all duration-500"
                style={{
                  width: `${stats?.guards_count ? Math.round(((stats.available_guards_count || 0) / stats.guards_count) * 100) : 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-emerald-800/70 font-medium">{stats?.available_guards_count || 0} of {stats?.guards_count || 0} forest guards ready for dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
