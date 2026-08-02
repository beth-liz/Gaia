import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { FileCheck, UserCheck, Clock, MapPin, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export const RFOAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRFOAssignments();
      setAssignments(data);
    } catch (err) {
      console.error("Failed to load RFO assignments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Assignments Command"
        subtitle="Monitor active guard dispatches, field progress steps, and final resolution reports"
        icon={FileCheck}
        badge={`${assignments.length} Total Dispatches`}
      />

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-emerald-950">Loading Field Dispatches Stream...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-extrabold text-emerald-950">No Active Dispatches</h3>
          <p className="text-xs text-emerald-800/70">Dispatch Forest Guards from the Incident Queue to initiate field operations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 block">{a.incident_reference_id}</span>
                    <h3 className="text-base font-black text-emerald-950">{a.incident_title}</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      a.incident_status === "Closed"
                        ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                        : a.incident_status === "Awaiting Officer Approval" || a.incident_status === "Resolved"
                        ? "bg-amber-400 text-emerald-950 font-black shadow-xs"
                        : "bg-blue-100 text-blue-950 border border-blue-300"
                    }`}
                  >
                    {a.incident_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Dispatched Guard</span>
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      {a.assigned_to_name}
                    </span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Priority / Est. Time</span>
                    <span className="font-extrabold text-amber-900">{a.priority} ({a.estimated_response_time})</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-emerald-950">{a.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-emerald-800/80">
                    <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Latest Update: <strong className="text-emerald-950">{a.latest_stage}</strong> ({a.latest_update_time})</span>
                  </div>
                </div>

                {a.latest_update && (
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-950/5 text-xs text-emerald-950 font-medium">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">Current Status Log:</span>
                    <p>{a.latest_update}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-end gap-2">
                <Link
                  to={`/incidents/${a.incident_id}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  View Progress & Approve <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RFOAssignmentsPage;
