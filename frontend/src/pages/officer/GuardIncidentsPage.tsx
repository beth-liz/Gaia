import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import type { Incident } from "@/types";
import { ShieldCheck, MapPin, Calendar, Loader2, ArrowRight, CheckCircle2, Radio } from "lucide-react";

export const GuardIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMyIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidents({ assigned_to_me: true });
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load guard assigned incidents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Field Assignments"
        subtitle="Active wildlife missions assigned to you by Range Forest Command"
        icon={ShieldCheck}
        badge={`${incidents.length} Assigned`}
      />

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-emerald-950">Loading Assigned Field Missions...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-extrabold text-emerald-950">No Active Field Missions</h3>
          <p className="text-xs text-emerald-800/70">You currently have no pending incident assignments. Stand by for station dispatch.</p>
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      inc.status === "Dispatched" || inc.status === "Assigned"
                        ? "bg-amber-400 text-emerald-950 border border-amber-500 shadow-xs"
                        : inc.status === "In Progress" || inc.status === "Action In Progress"
                        ? "bg-purple-100 text-purple-950 border border-purple-300"
                        : inc.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {inc.status === "Dispatched" ? "Pending Acceptance" : inc.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal Species</span>
                    <span className="font-extrabold text-emerald-950">{inc.animal_species_name || inc.animal}</span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity Level</span>
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
                    <span>Reported: {inc.date_reported} @ {inc.time_reported}</span>
                  </div>
                </div>

                {inc.assignment_notes && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                    <span className="font-extrabold uppercase text-[10px] block text-amber-800">Dispatch Orders:</span>
                    <p className="font-medium">{inc.assignment_notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-end gap-2">
                <Link
                  to={`/guard/mission/${inc.id}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-300" /> Execute Field Mission <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardIncidentsPage;
