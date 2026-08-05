import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { Wrench, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export const RFORepairManagementPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [repairsList, setRepairsList] = useState<any[]>([]);

  const [selectedDamagedId, setSelectedDamagedId] = useState<number | null>(null);
  const [repairStatus, setRepairStatus] = useState<string>("Repairing");
  const [repairCost, setRepairCost] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getDamagedRepairs();
      setRepairsList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load repair management records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDamagedId) return;

    setUpdating(true);
    try {
      await inventoryService.updateRepairStatus(selectedDamagedId, {
        status: repairStatus,
        repair_cost: repairCost,
        remarks,
      });

      alert(`Repair status updated to ${repairStatus}!`);
      setSelectedDamagedId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update repair status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Repair Management Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Equipment Repair Management"
        subtitle="Track damaged equipment maintenance, record repair costs, and automatically restore stock upon completion."
        icon={Wrench}
        badge="Maintenance & Repair"
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

      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/5 text-emerald-950 font-black uppercase text-[10px] tracking-wider border-b border-emerald-950/10">
              <tr>
                <th className="px-5 py-3.5">Equipment</th>
                <th className="px-5 py-3.5">Station</th>
                <th className="px-5 py-3.5">Damage Severity</th>
                <th className="px-5 py-3.5">Reported By</th>
                <th className="px-5 py-3.5">Repair Cost</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 font-semibold text-emerald-950">
              {repairsList.map((dmg) => (
                <tr key={dmg.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold">{dmg.item_name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{dmg.station_name || "Assigned Station"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                      {dmg.damage_severity || "Minor"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{dmg.reporter_name || `User #${dmg.reported_by}`}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-900">₹{dmg.repair_cost || 0}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      dmg.repair_status === "Completed" ? "bg-emerald-100 text-emerald-900" :
                      dmg.repair_status === "Repairing" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"
                    }`}>
                      {dmg.repair_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedDamagedId(dmg.id);
                        setRepairStatus(dmg.repair_status);
                        setRepairCost(dmg.repair_cost || 0);
                        setRemarks(dmg.remarks || "");
                      }}
                      className="px-3 py-1 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[10px] font-black uppercase shadow-xs"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
              {repairsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500 font-medium">
                    No damaged equipment currently recorded in repair management.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedDamagedId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-emerald-950 uppercase tracking-wider">Update Repair Status</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Status *</label>
                <select
                  value={repairStatus}
                  onChange={(e) => setRepairStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-extrabold outline-none"
                >
                  <option value="Waiting">Waiting (Pending Workshop Inspection)</option>
                  <option value="Repairing">Repairing (Under Maintenance)</option>
                  <option value="Completed">Completed (Restores Stock to Available)</option>
                  <option value="Scrapped">Scrapped (Write Off Unrepairable)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Repair Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={repairCost}
                  onChange={(e) => setRepairCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDamagedId(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
