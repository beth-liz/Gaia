import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ShieldAlert,
  Wrench,
  RefreshCw,
  Trash2,
  Loader2,
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  Recycle,
} from "lucide-react";

// Damaged Equipment record as returned by GET /inventory/repairs
interface DamagedRecord {
  id: number;
  assignment_id?: number;
  station_inventory_id?: number;
  item_name?: string;
  station_name?: string;
  reported_by?: number;
  reporter_name?: string;
  damage_type?: string;
  damage_severity?: string;
  damage_description?: string;
  photo?: string;
  repairable?: boolean;
  repair_cost?: number;
  repair_status?: string;
  remarks?: string;
  reported_at?: string;
  repaired_at?: string;
}

// Consumable categories to exclude
const CONSUMABLE_CATEGORIES = [
  "MEDICAL SUPPLIES",
  "MEDICAL",
  "FUEL",
  "BATTERIES",
  "FOOD",
  "STATIONERY",
  "CLEANING MATERIALS",
  "CONSUMABLE",
  "CONSUMABLES",
];

export const RFODamagedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [damagedRecords, setDamagedRecords] = useState<DamagedRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<DamagedRecord | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"Waiting" | "Repairing" | "Completed" | "Scrapped">("Completed");
  const [actionRemarks, setActionRemarks] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary source: DamagedEquipment table via GET /inventory/repairs
      const records: DamagedRecord[] = await inventoryService.getDamagedRepairs();

      // Filter out consumable equipment and already-scrapped/completed items from
      // active view (optionally show all, un-comment filter to restrict to active only)
      const filtered = (records || []).filter((r) => {
        const nameLower = (r.item_name || "").toLowerCase();
        const isConsumable = CONSUMABLE_CATEGORIES.some((c) =>
          nameLower.includes(c.toLowerCase())
        );
        // Include all damage statuses (Waiting, Repairing, Completed, Scrapped) so admin sees full picture
        return !isConsumable;
      });

      setDamagedRecords(filtered);
    } catch (err: any) {
      setError(err.message || "Failed to load damaged equipment records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmittingAction(true);
    try {
      await inventoryService.updateRepairStatus(selectedRecord.id, {
        status: actionType,
        remarks: actionRemarks,
      });

      const messages: Record<string, string> = {
        Completed: "Equipment marked as repaired and returned to available stock.",
        Scrapped: "Equipment transferred to scrap. Stock write-off processed.",
        Repairing: "Equipment status updated to: Currently Repairing.",
        Waiting: "Equipment status updated to: Waiting for Repair.",
      };

      showToast(messages[actionType] || "Damage action processed.", "success");
      setShowActionModal(false);
      setSelectedRecord(null);
      setActionRemarks("");
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to process damaged equipment action.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return damagedRecords;
    return damagedRecords.filter((r) => {
      const eq = (r.item_name || "").toLowerCase();
      const type = (r.damage_type || "").toLowerCase();
      const reporter = (r.reporter_name || "").toLowerCase();
      return eq.includes(term) || type.includes(term) || reporter.includes(term);
    });
  }, [damagedRecords, searchTerm]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "Waiting").toLowerCase();
    if (s === "completed") return { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300", dot: "bg-emerald-600", label: "Repaired" };
    if (s === "repairing") return { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-300", dot: "bg-blue-600", label: "Repairing" };
    if (s === "scrapped") return { bg: "bg-gray-200", text: "text-gray-700", border: "border-gray-400", dot: "bg-gray-500", label: "Scrapped" };
    return { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-300", dot: "bg-rose-600", label: "Waiting" };
  };

  // Metric Counts
  const totalDamaged = damagedRecords.length;
  const waiting = damagedRecords.filter((r) => (r.repair_status || "Waiting").toLowerCase() === "waiting").length;
  const repairing = damagedRecords.filter((r) => (r.repair_status || "").toLowerCase() === "repairing").length;
  const completed = damagedRecords.filter((r) => (r.repair_status || "").toLowerCase() === "completed").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-rose-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-rose-950">Loading Damaged Equipment Register...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Damaged Reusable Equipment Register"
        subtitle="Track damaged reusable assets, perform repairs, scrap unusable gear, and synchronize stock write-offs automatically."
        icon={ShieldAlert}
        badge={`${totalDamaged} Damaged Records`}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg cursor-pointer">×</button>
        </div>
      )}

      {/* Global Toast */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg transition-all ${
            toastMsg.type === "success"
              ? "bg-emerald-900 text-white border-emerald-950"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white font-black text-base cursor-pointer">×</button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-800 block tracking-wider">Total Damaged</span>
            <span className="text-2xl font-black text-rose-950 mt-1 block">{totalDamaged} <span className="text-xs font-normal text-gray-500">Records</span></span>
            <span className="text-[10px] font-bold text-rose-700 mt-1 block">All Damage Reports</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-900 text-white shadow-xs"><ShieldAlert className="w-6 h-6" /></div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 block tracking-wider">Awaiting Repair</span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">{waiting} <span className="text-xs font-normal text-gray-500">Items</span></span>
            <span className="text-[10px] font-bold text-amber-700 mt-1 block">Queued for Repair</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-900 text-white shadow-xs"><AlertTriangle className="w-6 h-6" /></div>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-800 block tracking-wider">Currently Repairing</span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">{repairing} <span className="text-xs font-normal text-gray-500">Items</span></span>
            <span className="text-[10px] font-bold text-blue-700 mt-1 block">Active Repair Work</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-xs"><Wrench className="w-6 h-6" /></div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block tracking-wider">Repaired</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">{completed} <span className="text-xs font-normal text-gray-500">Items</span></span>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 block">Returned to Stock</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-900 text-amber-300 shadow-xs"><CheckCircle className="w-6 h-6" /></div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment name, damage type, reported by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* DAMAGED EQUIPMENT TABLE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-3.5 text-left align-middle w-[22%]">Equipment</th>
                <th className="px-4 py-3.5 text-center align-middle w-[16%]">Station</th>
                <th className="px-3 py-3.5 text-center align-middle w-[13%]">Damage Type</th>
                <th className="px-3 py-3.5 text-center align-middle w-[9%]">Severity</th>
                <th className="px-4 py-3.5 text-center align-middle w-[14%]">Reported By</th>
                <th className="px-3 py-3.5 text-center align-middle w-[11%]">Reported Date</th>
                <th className="px-3 py-3.5 text-center align-middle w-[9%]">Repairable</th>
                <th className="px-3 py-3.5 text-center align-middle w-[12%]">Status</th>
                <th className="px-4 py-3.5 text-center align-middle w-[18%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredRecords.map((record) => {
                const badge = getStatusBadge(record.repair_status);
                return (
                  <tr key={record.id} className="hover:bg-emerald-50/30 transition-all whitespace-nowrap">
                    {/* Left Aligned Equipment Name */}
                    <td className="px-5 py-3.5 text-left align-middle font-black text-emerald-950">
                      <div className="truncate max-w-[180px]" title={record.item_name}>{record.item_name || "—"}</div>
                      {record.damage_description && (
                        <div className="text-[10px] font-normal text-gray-400 truncate max-w-[180px]" title={record.damage_description}>
                          {record.damage_description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle text-gray-700 truncate max-w-[140px]" title={record.station_name}>
                      {record.station_name || "—"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-bold text-rose-900">
                      {record.damage_type || "General Damage"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      {record.damage_severity ? (
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black inline-block ${
                          (record.damage_severity || "").toLowerCase() === "major"
                            ? "bg-red-100 text-red-900"
                            : "bg-amber-100 text-amber-900"
                        }`}>
                          {record.damage_severity}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px] font-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-bold text-emerald-900 truncate max-w-[130px]" title={record.reporter_name}>
                      {record.reporter_name || "Range Forest Officer"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                      {formatDate(record.reported_at)}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black inline-block ${
                        record.repairable !== false
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {record.repairable !== false ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span className={`px-3 py-1 ${badge.bg} ${badge.text} border ${badge.border} rounded-xl text-[10px] font-black inline-flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedRecord(record); setShowViewModal(true); }}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setActionType("Completed");
                            setActionRemarks("");
                            setShowActionModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          title="Mark Repaired"
                        >
                          <Wrench className="w-3 h-3 text-amber-300" /> Repaired
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setActionType("Scrapped");
                            setActionRemarks("");
                            setShowActionModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-[10px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          title="Transfer to Scrap"
                        >
                          <Recycle className="w-3 h-3" /> Scrap
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setActionType("Repairing");
                            setActionRemarks("");
                            setShowActionModal(true);
                          }}
                          className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all cursor-pointer"
                          title="Mark Repairing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    {damagedRecords.length === 0
                      ? "No damaged equipment records found. All reusable equipment is in good condition."
                      : "No records match your search filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-700" /> Damaged Equipment Profile
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                ["Equipment Item", selectedRecord.item_name || "—"],
                ["Station", selectedRecord.station_name || "—"],
                ["Damage Type", selectedRecord.damage_type || "—"],
                ["Damage Severity", selectedRecord.damage_severity || "—"],
                ["Reported By", selectedRecord.reporter_name || "Range Forest Officer"],
                ["Reported Date", formatDate(selectedRecord.reported_at)],
                ["Repaired Date", formatDate(selectedRecord.repaired_at)],
                ["Repairable", selectedRecord.repairable !== false ? "Yes" : "No"],
                ["Repair Status", selectedRecord.repair_status || "Waiting"],
                ["Repair Cost", selectedRecord.repair_cost ? `₹${selectedRecord.repair_cost}` : "Not Assessed"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-1">
                  <span className="text-gray-500 font-bold">{label}:</span>
                  <span className="font-extrabold text-emerald-950 text-right max-w-[55%]">{value}</span>
                </div>
              ))}
              {selectedRecord.damage_description && (
                <div>
                  <span className="text-gray-500 font-bold block mb-1">Damage Description:</span>
                  <p className="p-3 rounded-xl bg-rose-50 text-rose-950 font-semibold border border-rose-100">
                    {selectedRecord.damage_description}
                  </p>
                </div>
              )}
              {selectedRecord.remarks && (
                <div>
                  <span className="text-gray-500 font-bold block mb-1">Remarks:</span>
                  <p className="p-3 rounded-xl bg-emerald-50 text-emerald-950 font-semibold border border-emerald-100">
                    {selectedRecord.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIFECYCLE ACTION MODAL */}
      {showActionModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-700" /> Update Repair Status
              </h3>
              <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-900 font-semibold">
              <strong>{selectedRecord.item_name}</strong> — {selectedRecord.station_name || "Station"}
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Repair Outcome</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full p-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value="Waiting">Waiting — Queued for Repair</option>
                  <option value="Repairing">Repairing — Currently Being Repaired</option>
                  <option value="Completed">Completed — Repaired & Returned to Stock</option>
                  <option value="Scrapped">Scrapped — Write Off, Transfer to Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter repair notes or decision reason..."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full p-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingAction && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
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
