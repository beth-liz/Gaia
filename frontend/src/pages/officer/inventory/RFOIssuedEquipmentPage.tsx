import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  RotateCcw,
  History,
  CheckCircle,
  ShieldAlert,
  Clock,
  UserCheck,
  Package,
  Layers,
} from "lucide-react";

export const RFOIssuedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showRequestReturnModal, setShowRequestReturnModal] = useState<boolean>(false);
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStationAssignments();
      // Filter out consumable items (Medical, Fuel, Food, etc.)
      const reusableData = (data || []).filter((a: any) => {
        const cat = (a.category || "").toUpperCase();
        const isConsumableCat = [
          "MEDICAL SUPPLIES",
          "MEDICAL",
          "FUEL",
          "BATTERIES",
          "FOOD",
          "STATIONERY",
          "CLEANING MATERIALS",
          "CONSUMABLE",
          "CONSUMABLES",
        ].includes(cat);
        const isConsumableFlag = a.station_inventory?.consumable === true;
        const isIssuedStatus = ["ISSUED", "ACTIVE", "ASSIGNED"].includes((a.status || "").toUpperCase());

        return !isConsumableCat && !isConsumableFlag && isIssuedStatus;
      });

      setAssignments(reusableData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search filtering
  const filteredAssignments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return assignments.filter((a) => {
      if (!term) return true;
      const eq = (a.item_name || "").toLowerCase();
      const guard = (a.guard_name || "").toLowerCase();
      const badge = (a.guard_badge || "").toLowerCase();
      return eq.includes(term) || guard.includes(term) || badge.includes(term);
    });
  }, [assignments, searchTerm]);

  // Metrics
  const totalIssued = assignments.length;
  const inUseCount = assignments.filter((a) => (a.status || "").toUpperCase() === "ISSUED").length;
  const overdueCount = useMemo(() => {
    const today = new Date();
    return assignments.filter((a) => {
      if (!a.expected_return_date) return false;
      const exp = new Date(a.expected_return_date);
      return exp < today;
    }).length;
  }, [assignments]);
  const officersHoldingCount = useMemo(() => {
    return new Set(assignments.map((a) => a.guard_id).filter(Boolean)).size;
  }, [assignments]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleOpenRequestReturnModal = (asgn: EquipmentAssignment) => {
    setSelectedAsgn(asgn);
    setShowRequestReturnModal(true);
  };

  const handleConfirmRequestReturn = async () => {
    if (!selectedAsgn) return;
    setSubmittingRequest(true);
    try {
      await inventoryService.returnEquipment(selectedAsgn.id, "Return requested by Range Forest Officer");
      showToast(`Return requested for ${selectedAsgn.item_name}. Officer inventory status updated.`, "success");
      setShowRequestReturnModal(false);
      setSelectedAsgn(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to request equipment return.", "error");
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Issued Equipment Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Issued Equipment Directory"
        subtitle="Monitor reusable station assets currently deployed with officers across field operations."
        icon={ShieldCheck}
        badge={`${totalIssued} Active Reusable Deployments`}
      />

      {/* Global Toast Notification */}
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

      {/* 4 LIGHT STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block tracking-wider">
              Total Issued Equipment
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {totalIssued} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 block">Reusable Assets Only</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-900 text-amber-300 shadow-xs">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-800 block tracking-wider">
              Currently In Use
            </span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {inUseCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 mt-1 block">Active Field Missions</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 block tracking-wider">
              Overdue Returns
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {overdueCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 mt-1 block">Past Expected Date</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-900 text-white shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-800 block tracking-wider">
              Officers Holding Equipment
            </span>
            <span className="text-2xl font-black text-purple-950 mt-1 block">
              {officersHoldingCount} <span className="text-xs font-normal text-gray-500">Officers</span>
            </span>
            <span className="text-[10px] font-bold text-purple-700 mt-1 block">Station Field Staff</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-900 text-white shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment name, officer, badge ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ISSUED EQUIPMENT TABLE (EVENLY DISTRIBUTED FULL WIDTH, NO CATEGORY COLUMN, PURPLE BUTTON) */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-3.5 text-left align-middle w-[22%]">Equipment</th>
                <th className="px-4 py-3.5 text-center align-middle w-[24%]">Assigned Officer</th>
                <th className="px-4 py-3.5 text-center align-middle w-[18%]">Station</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Assigned Date</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Expected Return</th>
                <th className="px-3 py-3.5 text-center align-middle w-[8%]">Condition</th>
                <th className="px-3 py-3.5 text-center align-middle w-[8%]">Status</th>
                <th className="px-4 py-3.5 text-center align-middle w-[16%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredAssignments.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all whitespace-nowrap">
                  {/* Left Aligned Equipment Name */}
                  <td className="px-5 py-3.5 text-left align-middle font-black text-emerald-950 truncate max-w-[200px]" title={asgn.item_name}>
                    {asgn.item_name}
                  </td>
                  {/* Center Aligned Officer */}
                  <td className="px-4 py-3.5 text-center align-middle font-extrabold text-emerald-900 truncate max-w-[220px]" title={`${asgn.guard_name} (${asgn.guard_badge || `FG-${asgn.guard_id}`})`}>
                    {asgn.guard_name} <span className="font-mono text-gray-500 font-normal">({asgn.guard_badge || `FG-${asgn.guard_id}`})</span>
                  </td>
                  {/* Center Aligned Station */}
                  <td className="px-4 py-3.5 text-center align-middle text-gray-600 truncate max-w-[180px]">
                    {(asgn as any).station_name || "Muthanga Range Office"}
                  </td>
                  {/* Center Aligned Assigned Date */}
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                    {formatDate(asgn.issue_date)}
                  </td>
                  {/* Center Aligned Expected Return */}
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-gray-600 text-[11px]">
                    {asgn.expected_return_date ? formatDate(asgn.expected_return_date) : "Permanent"}
                  </td>
                  {/* Center Aligned Condition */}
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-2.5 py-0.5 bg-emerald-100/80 text-emerald-900 rounded-lg text-[10px] font-black inline-block">
                      {asgn.condition || "Good"}
                    </span>
                  </td>
                  {/* Center Aligned Status Single-Line Badge */}
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Issued
                    </span>
                  </td>
                  {/* Center Aligned Actions Single Line */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedAsgn(asgn);
                          setShowViewModal(true);
                        }}
                        className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* STYLED IN DISTINCT PROFESSIONAL PURPLE (#7C3AED / bg-purple-600) */}
                      <button
                        onClick={() => handleOpenRequestReturnModal(asgn)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-black text-[10px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer border border-purple-700"
                        title="Request Return"
                      >
                        <RotateCcw className="w-3 h-3 text-white" /> Request Return
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAsgn(asgn);
                          setShowHistoryModal(true);
                        }}
                        className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 transition-all cursor-pointer"
                        title="View Assignment History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    No active reusable equipment deployments found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" /> Equipment Assignment Details
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Equipment Item:</span>
                <span className="font-extrabold text-emerald-950">{selectedAsgn.item_name}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Officer:</span>
                <span className="font-black text-emerald-950">{selectedAsgn.guard_name} ({selectedAsgn.guard_badge || `FG-${selectedAsgn.guard_id}`})</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Quantity Issued:</span>
                <span className="font-mono font-black">{selectedAsgn.quantity} {selectedAsgn.unit || "Units"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Assigned Date:</span>
                <span className="font-mono text-gray-700">{formatDate(selectedAsgn.issue_date)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Expected Return:</span>
                <span className="font-mono text-gray-700">{selectedAsgn.expected_return_date ? formatDate(selectedAsgn.expected_return_date) : "Permanent Issue"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block mb-1">Purpose / Mission:</span>
                <p className="p-3 rounded-xl bg-emerald-50 text-emerald-950 font-semibold border border-emerald-100">
                  {selectedAsgn.purpose || "Field Duty Mission"}
                </p>
              </div>
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

      {/* HISTORY MODAL */}
      {showHistoryModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-700" /> Assignment History Log
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-950 font-semibold">
                Showing historical lifecycle records for <strong>{selectedAsgn.item_name}</strong> issued to <strong>{selectedAsgn.guard_name}</strong>.
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex justify-between font-bold text-emerald-950">
                    <span>Issued by Range Forest Officer</span>
                    <span className="font-mono text-gray-500 text-[10px]">{formatDate(selectedAsgn.issue_date)}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">Direct station stock assignment. Quantity: {selectedAsgn.quantity} {selectedAsgn.unit || "Units"}.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST RETURN CONFIRMATION MODAL */}
      {showRequestReturnModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" /> Confirm Return Request
              </h3>
              <button onClick={() => setShowRequestReturnModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80 space-y-2 text-xs">
              <p className="font-extrabold text-purple-950">
                Are you sure you want to request return for this equipment?
              </p>
              <div className="space-y-1 pt-1 text-purple-900 font-semibold">
                <div className="flex justify-between">
                  <span>Equipment Item:</span>
                  <strong className="text-purple-950">{selectedAsgn.item_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Officer:</span>
                  <strong className="text-purple-950">{selectedAsgn.guard_name} ({selectedAsgn.guard_badge || `FG-${selectedAsgn.guard_id}`})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <strong className="text-purple-950 font-mono">{selectedAsgn.quantity} {selectedAsgn.unit || "Units"}</strong>
                </div>
              </div>
              <p className="text-[11px] text-purple-800 pt-2 border-t border-purple-200 italic">
                On confirmation, the officer's dashboard will show that this equipment has been requested to be returned.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                type="button"
                onClick={() => setShowRequestReturnModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestReturn}
                disabled={submittingRequest}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer border border-purple-700"
              >
                {submittingRequest && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                Confirm Return Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
