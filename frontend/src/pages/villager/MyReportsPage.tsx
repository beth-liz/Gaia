import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await api.getIncidents({ my_reports_only: true });
        setReports(data);
      } catch (err) {
        console.error("Failed to fetch my reports", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">My Reported Incidents</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Track real-time response & guard assignment for your reported sightings</p>
        </div>
        <Link
          to="/villager/report-incident"
          className="px-5 py-2.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          + Report New Incident
        </Link>
      </div>

      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Fetching Your Reports from Database...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium space-y-3">
            <p>You have not submitted any incident reports yet.</p>
            <Link to="/villager/report-incident" className="inline-block font-bold text-emerald-800 underline">
              Submit Your First Incident Report
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">Incident ID</th>
                  <th className="py-3.5 px-6">Animal / Severity</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Reported On</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned Guard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-800">#{r.id}</td>
                    <td className="py-4 px-6 font-bold text-emerald-950">{r.animal} ({r.severity})</td>
                    <td className="py-4 px-6">{r.location}</td>
                    <td className="py-4 px-6">{r.date_reported} at {r.time_reported}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === "Completed" ? "bg-emerald-100 text-emerald-900" :
                        r.status === "Assigned" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {r.assigned_guard_name || "Awaiting Assignment"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;
