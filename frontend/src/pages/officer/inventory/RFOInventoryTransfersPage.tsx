import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowRightLeft, Send, AlertCircle, Loader2 } from "lucide-react";

export const RFOInventoryTransfersPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [transfers, setTransfers] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [masters, setMasters] = useState<any[]>([]);

  // Create Transfer Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [destStationId, setDestStationId] = useState<number>(0);
  const [selectedMasterId, setSelectedMasterId] = useState<number>(0);
  const [transferQty, setTransferQty] = useState<number>(1);
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trfs, stList, mList] = await Promise.all([
        inventoryService.getTransfers(),
        api.getMonitoringStations ? api.getMonitoringStations() : Promise.resolve([]),
        inventoryService.getMasterItems({ active_only: true }),
      ]);
      setTransfers(trfs);
      setStations(stList);
      setMasters(mList);

      if (stList.length > 0) setDestStationId(stList[0].id);
      if (mList.length > 0) setSelectedMasterId(mList[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to load transfers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destStationId || !selectedMasterId) return;

    setSubmitting(true);
    try {
      await inventoryService.createTransfer({
        destination_station_id: destStationId,
        items: [{ inventory_master_id: selectedMasterId, quantity: transferQty }],
        remarks,
      });

      alert("Inter-station transfer initiated successfully!");
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to initiate transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessTransfer = async (transferId: number, action: string) => {
    try {
      await inventoryService.processTransfer(transferId, { action });
      alert(`Transfer action '${action}' processed!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to process transfer.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Inter-Station Transfers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Inter-Station Equipment Transfers"
        subtitle="Transfer equipment between monitoring stations with multi-stage approval (Request → Approve → Dispatch → Receive)."
        icon={ArrowRightLeft}
        badge="Station Transfer"
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
        >
          <Send className="w-4 h-4 text-amber-300" /> Initiate Station Transfer
        </button>
      </div>

      {/* TRANSFERS TABLE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/5 text-emerald-950 font-black uppercase text-[10px] tracking-wider border-b border-emerald-950/10">
              <tr>
                <th className="px-5 py-3.5">Transfer #</th>
                <th className="px-5 py-3.5">Source Station</th>
                <th className="px-5 py-3.5">Destination Station</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 font-semibold text-emerald-950">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-black">{t.transfer_number}</td>
                  <td className="px-5 py-3.5">{t.source_station_name || `Station #${t.source_station_id}`}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-900">{t.destination_station_name || `Station #${t.destination_station_id}`}</td>
                  <td className="px-5 py-3.5">
                    {t.items.map((i: any) => `${i.item_name} (x${i.quantity})`).join(", ")}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-900" :
                      t.status === "DISPATCHED" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {t.status === "PENDING_APPROVAL" && (
                      <button
                        onClick={() => handleProcessTransfer(t.id, "DISPATCH")}
                        className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[10px] font-black uppercase shadow-xs"
                      >
                        Dispatch
                      </button>
                    )}
                    {t.status === "DISPATCHED" && (
                      <button
                        onClick={() => handleProcessTransfer(t.id, "RECEIVE")}
                        className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-[10px] font-black uppercase shadow-xs"
                      >
                        Receive
                      </button>
                    )}
                    {t.status === "COMPLETED" && (
                      <span className="text-gray-400 font-bold text-[10px]">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 font-medium">
                    No equipment transfers recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TRANSFER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-emerald-950 uppercase tracking-wider">Initiate Inter-Station Transfer</h3>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Destination Station *</label>
                <select
                  value={destStationId}
                  onChange={(e) => setDestStationId(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-extrabold outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>{st.station_name}</option>
                  ))}
                  {stations.length === 0 && <option value={0}>No destination stations available</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Select Equipment *</label>
                <select
                  value={selectedMasterId}
                  onChange={(e) => setSelectedMasterId(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-extrabold outline-none"
                >
                  {masters.map((m) => (
                    <option key={m.id} value={m.id}>{m.item_name} ({m.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Specify transfer purpose or courier details..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />}
                  Submit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
