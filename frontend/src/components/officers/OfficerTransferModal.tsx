import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import type { User, MonitoringStation } from "@/types";
import { ArrowRightLeft, ShieldAlert, Loader2 } from "lucide-react";

interface OfficerTransferModalProps {
  officer: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const OfficerTransferModal: React.FC<OfficerTransferModalProps> = ({
  officer,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [newStationId, setNewStationId] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const data = await api.getMonitoringStations();
        const availableStations = data.filter((s) => s.id !== officer.station_id);
        setStations(availableStations);
        if (availableStations.length > 0) {
          setNewStationId(availableStations[0].id);
        }
      } catch (err) {
        console.error("Failed to load stations for transfer modal", err);
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, [isOpen, officer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationId) {
      setError("Please select a target station for transfer.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.transferOfficer(officer.id, {
        new_station_id: Number(newStationId),
        reason: reason.trim() || "Administrative Relocation",
        effective_date: effectiveDate,
      });

      const targetSt = stations.find((s) => s.id === Number(newStationId));
      onSuccess(`Officer ${officer.full_name} successfully transferred to ${targetSt?.station_name || "new station"}.`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to execute officer transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-emerald-950">Transfer Officer Station</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-950/10 text-xs">
            <div>
              <span className="text-emerald-800/70 font-semibold block mb-0.5">Officer Name</span>
              <span className="font-extrabold text-emerald-950 block truncate">{officer.full_name}</span>
            </div>
            <div>
              <span className="text-emerald-800/70 font-semibold block mb-0.5">Current Station</span>
              <span className="font-extrabold text-amber-900 block truncate">{officer.station_name || officer.station || "Unassigned"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
              Target New Station *
            </label>
            {loadingStations ? (
              <div className="py-2 text-xs text-emerald-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-800" /> Loading stations...
              </div>
            ) : (
              <select
                required
                value={newStationId}
                onChange={(e) => setNewStationId(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-bold"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.station_name} {st.head_officer_id ? "(RFO Assigned)" : "(No RFO Assigned)"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
              Effective Transfer Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white text-emerald-950 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
              Transfer Reason / Posting Orders
            </label>
            <textarea
              rows={3}
              placeholder="Enter official transfer order number, administrative reason, or patrol rotation notes..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-950/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingStations}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-70"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Transferring..." : "Execute Transfer Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
