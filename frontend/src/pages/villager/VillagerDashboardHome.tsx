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
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <img src="/images/nature1.jpg" alt="Gaia Nature" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
            <Shield className="w-3.5 h-3.5" /> Verified Villager Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.full_name || "Villager"}!</h1>
          <p className="text-xs text-emerald-200/90 max-w-xl leading-relaxed">
            Registered Village Sector: <strong className="text-amber-300">{user?.village_name || "Muthanga Sector"}</strong>. You are connected directly with Range Forest Officers & Field Guards.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/villager/report-incident"
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-950" />
              Report Wildlife Incident
            </Link>
            <Link
              to="/villager/my-reports"
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              View My Reports ({myIncidents.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="gaia-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Total Reported</span>
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.my_reports_count || 0}</p>
        </div>

        <div className="gaia-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
            <span>Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-900">{stats?.my_open_reports || 0}</p>
        </div>

        <div className="gaia-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Resolved Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.resolved_incidents || 0}</p>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="gaia-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
          <h3 className="text-base font-bold text-emerald-950">My Recent Reported Incidents</h3>
          <Link to="/villager/my-reports" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-emerald-800 animate-spin mx-auto mb-2" />
          </div>
        ) : myIncidents.length === 0 ? (
          <p className="text-xs text-emerald-900/50 py-6 text-center">No reports logged yet.</p>
        ) : (
          <div className="space-y-3">
            {myIncidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-2xl bg-white border border-emerald-950/10 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">{inc.animal}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">{inc.severity}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/70">{inc.location} &bull; Date: {inc.date_reported}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inc.status === "Completed" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
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
