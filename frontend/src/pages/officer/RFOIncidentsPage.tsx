import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Radio, ShieldCheck, UserCheck, X, Loader2 } from "lucide-react";

const RFOIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [selectedGuardId, setSelectedGuardId] = useState<number | "">("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [incData, guardData] = await Promise.all([
        api.getIncidents(),
        api.getAvailableGuards(),
      ]);
      setIncidents(incData);
      setAvailableGuards(guardData);
      if (guardData.length > 0) {
        setSelectedGuardId(guardData[0].id);
      }
    } catch (err) {
      console.error("Failed to load RFO incidents data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (inc: any) => {
    setSelectedIncident(inc);
    setAssignmentNotes(`Priority dispatch for sector: ${inc.location}`);
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !selectedGuardId) {
      alert("Please select a valid available Forest Guard.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.assignIncident(selectedIncident.id, {
        assigned_to_id: Number(selectedGuardId),
        notes: assignmentNotes,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to assign incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Range Incident Control & Guard Assignment</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Assign reported incidents directly to available Forest Guards in PostgreSQL</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-900/10 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Available Guards: <span className="text-amber-700 font-extrabold text-sm">{availableGuards.length}</span>
        </div>
      </div>

      {/* Incidents List Table */}
      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Incident Command Stream...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium">
            No incidents reported in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">Incident ID</th>
                  <th className="py-3.5 px-6">Animal / Severity</th>
                  <th className="py-3.5 px-6">Location & Sector</th>
                  <th className="py-3.5 px-6">Reported By</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned Guard</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-800">#{inc.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-emerald-950">{inc.animal}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.severity === "Critical" ? "bg-red-100 text-red-800 border border-red-200" :
                        inc.severity === "High" ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {inc.severity} Severity
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold">{inc.location}</div>
                      <div className="text-[11px] text-emerald-800/70">{inc.village_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div>{inc.reporter_name}</div>
                      <div className="text-[11px] text-emerald-800/70">{inc.contact_number}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inc.status === "Pending" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                        inc.status === "Assigned" ? "bg-blue-100 text-blue-900 border border-blue-300" :
                        inc.status === "Completed" ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-gray-100 text-gray-800"
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {inc.assigned_guard_name ? (
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          {inc.assigned_guard_name}
                        </div>
                      ) : (
                        <span className="text-amber-800 text-[11px] font-bold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {inc.status === "Pending" ? (
                        <button
                          onClick={() => openAssignModal(inc)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Radio className="w-3.5 h-3.5 text-amber-300" />
                          Assign Guard
                        </button>
                      ) : (
                        <span className="text-emerald-900/40 text-[11px] font-semibold">Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Guard Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Assign Guard to Incident #{selectedIncident.id}</h3>
                <p className="text-xs text-emerald-900/60">{selectedIncident.animal} reported at {selectedIncident.location}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-emerald-950/60 hover:bg-emerald-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  Select Available Guard (Only Available Guards Listed)
                </label>
                {availableGuards.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                    No Forest Guards are currently Available. All active guards are busy on other incident missions.
                  </div>
                ) : (
                  <select
                    value={selectedGuardId}
                    onChange={(e) => setSelectedGuardId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800 font-semibold"
                  >
                    {availableGuards.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_name} &bull; Station: {g.station || "HQ"} (Status: {g.work_status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  Dispatch Orders / Assignment Notes
                </label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-950 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableGuards.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Assigning..." : "Dispatch Guard Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFOIncidentsPage;
