import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { CheckCircle2, Loader2, X } from "lucide-react";

const GuardIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("Completed");
  const [reportNotes, setReportNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMyIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidents({ assigned_to_me: true });
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load guard incidents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyIncidents();
  }, []);

  const openUpdateModal = (inc: any) => {
    setSelectedIncident(inc);
    setNewStatus("Completed");
    setReportNotes(inc.assignment_notes || "Field investigation complete. Sector secured.");
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setIsSubmitting(true);
    try {
      await api.updateIncidentStatus(selectedIncident.id, {
        status: newStatus,
        notes: reportNotes,
      });
      setIsModalOpen(false);
      loadMyIncidents();
    } catch (err: any) {
      alert(err.message || "Failed to update incident status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Forest Guard Field Operations</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Manage incidents assigned to you and update field investigation progress</p>
        </div>
      </div>

      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Assigned Incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium">
            No active incidents currently assigned to you.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">Incident ID</th>
                  <th className="py-3.5 px-6">Animal / Severity</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Reporter Contact</th>
                  <th className="py-3.5 px-6">Current Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-800">#{inc.id}</td>
                    <td className="py-4 px-6 font-bold text-emerald-950">{inc.animal} ({inc.severity})</td>
                    <td className="py-4 px-6">{inc.location}</td>
                    <td className="py-4 px-6">{inc.reporter_name} ({inc.contact_number})</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inc.status === "Completed" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {inc.status !== "Completed" ? (
                        <button
                          onClick={() => openUpdateModal(inc)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-bold shadow-xs"
                        >
                          Update Status / Complete
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Mission Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
              <h3 className="text-lg font-bold text-emerald-950">Update Incident #{selectedIncident.id}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-emerald-950/60 hover:bg-emerald-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Set Incident Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 font-semibold"
                >
                  <option value="In Progress">In Progress (Patrol / Field Operation Active)</option>
                  <option value="Completed">Completed (Incident Resolved & Sector Secured)</option>
                  <option value="Rejected">False Alarm / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Field Patrol Notes & Findings</label>
                <textarea
                  rows={4}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter details of animal movement, perimeter checks..."
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-950/10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-emerald-50 text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md">
                  {isSubmitting ? "Saving..." : "Save Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardIncidentsPage;
