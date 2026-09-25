import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2, FileCheck, Radio } from "lucide-react";

const OfficerDashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [sData, incData] = await Promise.all([
          api.getDashboardStats(),
          api.getIncidents(),
        ]);
        setStats(sData);
        setRecentIncidents(incData.slice(0, 5));
      } catch (err) {
        console.error("Failed to load officer dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Range Officer Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/nature3.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Range Forest Officer Command
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Command Center: {user?.full_name || "Range Officer"}</h1>
          <p className="text-sm text-emerald-200/90 max-w-xl leading-relaxed">
            Station Sector: <strong className="text-amber-300">{user?.station || "Central Station"}</strong>
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/officer/incidents"
              className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-emerald-950" />
              Manage All Incidents
            </Link>
            <Link
              to="/officer/report-incident"
              className="px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 border border-emerald-600"
            >
              <FileCheck className="w-4 h-4 text-amber-300" />
              Report Incident
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.incidents_pending || 0}</p>
            <p className="text-xs font-bold text-gray-500 uppercase">Pending Actions</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.incidents_active || 0}</p>
            <p className="text-xs font-bold text-gray-500 uppercase">Active Dispatch</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.total_incidents || 0}</p>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Incidents</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-950">{stats?.incidents_resolved || 0}</p>
            <p className="text-xs font-bold text-gray-500 uppercase">Resolved</p>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-2xl border border-emerald-950/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-emerald-950/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-600" /> Recent Incidents
          </h2>
          <Link to="/officer/incidents" className="text-sm font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50">
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase">ID</th>
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase">Date</th>
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase">Location</th>
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase">Type / Animal</th>
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase">Status</th>
                  <th className="p-3 text-xs font-bold text-emerald-900 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5">
                {recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3 text-sm font-bold text-emerald-950">{inc.incident_number}</td>
                    <td className="p-3 text-sm font-medium text-gray-600">{new Date(inc.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-sm font-medium text-gray-700">{inc.village_name || "Unknown"}</td>
                    <td className="p-3 text-sm font-medium text-emerald-900">
                      {inc.category}
                      <span className="block text-xs text-gray-500">{inc.animal_species_name || inc.custom_animal_type || "N/A"}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          inc.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : inc.status === "Active" || inc.status === "Dispatched"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        to={`/officer/incidents/${inc.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors border border-emerald-900/10"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500 text-sm font-medium">
            No recent incidents found for your station sector.
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboardHome;
