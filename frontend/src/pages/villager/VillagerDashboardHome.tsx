import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { AlertTriangle, FileText, CheckCircle2, Shield, ArrowRight, Loader2 } from "lucide-react";

const VillagerDashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [sData, incData] = await Promise.all([
          api.getDashboardStats(),
          api.getIncidents({ my_reports_only: true }),
        ]);
        setStats(sData);
        setMyIncidents(incData.slice(0, 4));
      } catch (err) {
        console.error("Failed to load villager dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-800/80 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-emerald-700/30 backdrop-blur-md">
        <img src="/images/nature1.jpg" alt="Gaia Nature" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
            <Shield className="w-3.5 h-3.5" /> Verified Villager Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Welcome, {user?.full_name || "Villager"}!</h1>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
            Registered Village Sector: <strong className="text-amber-300">{user?.village_name || "Muthanga Sector"}</strong>. You are connected directly with Range Forest Officers & Field Guards.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/villager/report-incident"
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-950" />
              Report Wildlife Incident
            </Link>
            <Link
              to="/villager/my-reports"
              className="px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/25 transition-all backdrop-blur-sm"
            >
              View My Reports ({myIncidents.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metric Cards - Light Nature Green Frosted Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-emerald-950/45 hover:bg-emerald-950/55 backdrop-blur-md rounded-2xl border border-emerald-500/25 p-5 space-y-2 shadow-lg shadow-black/10 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-200 uppercase tracking-wider">
            <span>Total Reported</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-800/50 flex items-center justify-center border border-emerald-400/20">
              <FileText className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white drop-shadow-sm">{stats?.my_reports_count || 0}</p>
        </div>

        <div className="bg-emerald-950/45 hover:bg-emerald-950/55 backdrop-blur-md rounded-2xl border border-emerald-500/25 p-5 space-y-2 shadow-lg shadow-black/10 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-amber-200 uppercase tracking-wider">
            <span>Open Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-amber-900/40 flex items-center justify-center border border-amber-400/30">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-300 drop-shadow-sm">{stats?.my_open_reports || 0}</p>
        </div>

        <div className="bg-emerald-950/45 hover:bg-emerald-950/55 backdrop-blur-md rounded-2xl border border-emerald-500/25 p-5 space-y-2 shadow-lg shadow-black/10 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-200 uppercase tracking-wider">
            <span>Resolved Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-800/50 flex items-center justify-center border border-emerald-400/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white drop-shadow-sm">{stats?.resolved_incidents || 0}</p>
        </div>
      </div>

      {/* Recent Activity List - Nature Green Frosted Card */}
      <div className="bg-emerald-950/45 backdrop-blur-md rounded-2xl border border-emerald-500/25 p-6 space-y-4 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800/30">
          <h3 className="text-base font-bold text-white tracking-tight">My Recent Reported Incidents</h3>
          <Link to="/villager/my-reports" className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-emerald-300 animate-spin mx-auto mb-2" />
          </div>
        ) : myIncidents.length === 0 ? (
          <p className="text-xs text-emerald-200/70 py-6 text-center">No reports logged yet.</p>
        ) : (
          <div className="space-y-3">
            {myIncidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/20 flex items-center justify-between gap-3 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{inc.animal}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">{inc.severity}</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 mt-1">{inc.location} &bull; Date: {inc.date_reported}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inc.status === "Completed" ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30" : "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                }`}>
                  {inc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VillagerDashboardHome;
