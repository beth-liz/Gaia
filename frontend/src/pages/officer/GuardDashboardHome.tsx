import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

const GuardDashboardHome: React.FC = () => {
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
          api.getIncidents({ assigned_to_me: true }),
        ]);
        setStats(sData);
        setMyIncidents(incData);
      } catch (err) {
        console.error("Failed to load guard home data", err);
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
        <img src="/images/nature4.jpg" alt="Guard Patrol" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Forest Guard Duty Station
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Guard Duty: {user?.full_name || "Forest Guard"}</h1>
          <p className="text-xs text-emerald-200/90 max-w-xl leading-relaxed">
            Station Sector: <strong className="text-amber-300">{user?.station || "Patrol Sector 1"}</strong> &bull; Work Status:{" "}
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${user?.work_status === "Busy" ? "bg-amber-400 text-emerald-950" : "bg-emerald-300 text-emerald-950"}`}>
              {user?.work_status || "Available"}
            </span>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/guard/incidents"
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-950" />
              View Assigned Missions ({stats?.guard_assigned || 0})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="gaia-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
            <span>Missions In Progress</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-900">{stats?.guard_assigned || 0}</p>
        </div>

        <div className="gaia-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Completed Missions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-950">{stats?.guard_completed || 0}</p>
        </div>
      </div>

      {/* Assigned Incidents List */}
      <div className="gaia-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
          <h3 className="text-base font-bold text-emerald-950">Active Missions Assigned to Me</h3>
          <Link to="/guard/incidents" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
            Open List <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-emerald-800 animate-spin mx-auto mb-2" />
          </div>
        ) : myIncidents.length === 0 ? (
          <p className="text-xs text-emerald-900/50 py-6 text-center">No active missions currently assigned to you.</p>
        ) : (
          <div className="space-y-3">
            {myIncidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-2xl bg-white border border-emerald-950/10 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">{inc.animal}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">{inc.severity}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/70">{inc.location} &bull; Contact: {inc.contact_number}</p>
                </div>
                <Link
                  to="/guard/incidents"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-bold shadow-xs"
                >
                  Manage Status
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardDashboardHome;
