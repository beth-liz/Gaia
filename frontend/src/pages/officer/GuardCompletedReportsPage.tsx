import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import type { Incident } from "@/types";
import { CheckCircle2, Calendar, FileText, Loader2, ArrowRight, MapPin } from "lucide-react";

export const GuardCompletedReportsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompleted = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidents({ assigned_to_me: true, status: "Closed" });
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load completed guard reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Field Reports"
        subtitle="Archived history of completed field incident resolutions approved by Range Forest Command"
        icon={CheckCircle2}
        badge={`${incidents.length} Resolved & Closed`}
      />

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-emerald-950">Loading Field Resolution History...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-extrabold text-emerald-950">No Closed Field Reports</h3>
          <p className="text-xs text-emerald-800/70">Resolved missions approved by Range Forest Officer will appear in this archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 block">{inc.reference_id}</span>
                    <h3 className="text-base font-black text-emerald-950">{inc.incident_title || `${inc.animal} Sighting`}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                    {inc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal Confirmed</span>
                    <span className="font-extrabold text-emerald-950">{inc.animal_species_name || inc.animal}</span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity</span>
                    <span className="font-extrabold text-amber-900">{inc.severity}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-emerald-950">{inc.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-emerald-800/80">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Logged Date: {inc.date_reported}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-end gap-2">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  View Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardCompletedReportsPage;
