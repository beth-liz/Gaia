import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Clock,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  RotateCcw,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export const RFOPendingReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStationAssignments(undefined, "PENDING");
      const pendingReturns = (data || []).filter((a: any) => {
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

        const statusUpper = (a.status || "").toUpperCase();
        return !isConsumableCat && (statusUpper === "PENDING_RETURN" || statusUpper === "RETURN_REQUESTED");
      });

      setAssignments(pendingReturns);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Top Metrics
  const pendingToday = useMemo(() => {
    const today = new Date().toDateString();
    return assignments.filter((a) => a.returned_date && new Date(a.returned_date).toDateString() === today).length;
  }, [assignments]);

  const pendingThisWeek = assignments.length;
  const itemsWaitingInspection = assignments.length;
  const overdueCount = useMemo(() => {
    const today = new Date();
    return assignments.filter((a) => a.expected_return_date && new Date(a.expected_return_date) < today).length;
  }, [assignments]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-amber-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-amber-950">Loading Pending Returns List...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Pending Equipment Returns"
        subtitle="Equipment marked for return by Forest Guards awaiting physical verification and inspection by Range Forest Officer."
        icon={Clock}
        badge={`${assignments.length} Waiting Physical Verification`}
      />

      {/* 4 LIGHT STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 block tracking-wider">
              Pending Today
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {pendingToday} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 mt-1 block">Submitted Today</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-900 text-white shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-800 block tracking-wider">
              Pending This Week
            </span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {pendingThisWeek} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 mt-1 block">Weekly Queue</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-red-50/80 border border-red-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-red-800 block tracking-wider">
              Overdue Returns
            </span>
            <span className="text-2xl font-black text-red-950 mt-1 block">
              {overdueCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-red-700 mt-1 block">Needs Inspection</span>
          </div>
          <div className="p-3 rounded-2xl bg-red-900 text-white shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block tracking-wider">
              Waiting Inspection
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {itemsWaitingInspection} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 block">Ready for Officer</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-900 text-amber-300 shadow-xs">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment or officer..."
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

      {/* PENDING RETURNS TABLE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-3.5 text-left align-middle w-[22%]">Equipment</th>
                <th className="px-4 py-3.5 text-center align-middle w-[22%]">Officer</th>
                <th className="px-3 py-3.5 text-center align-middle w-[11%]">Assigned Date</th>
                <th className="px-3 py-3.5 text-center align-middle w-[11%]">Return Requested</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Condition</th>
                <th className="px-4 py-3.5 text-center align-middle w-[14%]">Remarks</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Status</th>
                <th className="px-4 py-3.5 text-center align-middle w-[16%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredAssignments.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all whitespace-nowrap">
                  <td className="px-5 py-3.5 text-left align-middle font-black text-emerald-950 truncate max-w-[200px]" title={asgn.item_name}>
                    {asgn.item_name}
                  </td>
                  <td className="px-4 py-3.5 text-center align-middle font-extrabold text-emerald-900 truncate max-w-[200px]" title={`${asgn.guard_name} (${asgn.guard_badge || `FG-${asgn.guard_id}`})`}>
                    {asgn.guard_name} <span className="font-mono text-gray-500 font-normal">({asgn.guard_badge || `FG-${asgn.guard_id}`})</span>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                    {formatDate(asgn.issue_date)}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-amber-900 text-[11px]">
                    {formatDate(asgn.actual_return || asgn.issue_date)}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 rounded-lg text-[10px] font-black inline-block">
                      {asgn.condition || "Good"}
                    </span>
                  </td>
                  {/* REMARKS ELLIPSIS WITH HOVER TOOLTIP */}
                  <td className="px-4 py-3.5 text-center align-middle text-gray-600 text-[11px]">
                    <span className="max-w-[160px] truncate block mx-auto cursor-help" title={asgn.remarks || "Awaiting physical inspection"}>
                      {asgn.remarks || "Awaiting physical inspection"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    {(asgn.status || "").toUpperCase() === "RETURN_REQUESTED" ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Awaiting Guard Return
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Returned - Awaiting Verification
                      </span>
                    )}
                  </td>
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
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    No pending equipment returns awaiting verification.
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
                <Clock className="w-5 h-5 text-amber-600" /> Pending Return Submission
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Equipment:</span>
                <span className="font-extrabold text-emerald-950">{selectedAsgn.item_name}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Officer:</span>
                <span className="font-black text-emerald-950">{selectedAsgn.guard_name} ({selectedAsgn.guard_badge || `FG-${selectedAsgn.guard_id}`})</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Condition Reported:</span>
                <span className="font-black text-amber-900">{selectedAsgn.condition || "Good"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block mb-1">Return Remarks:</span>
                <p className="p-3 rounded-xl bg-amber-50 text-amber-950 font-semibold border border-amber-100">
                  {selectedAsgn.remarks || "No additional remarks."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  navigate("/officer/inventory/assigned/verify-returns", { state: { selectedAssignment: selectedAsgn } });
                }}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1"
              >
                Proceed to Inspect →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
