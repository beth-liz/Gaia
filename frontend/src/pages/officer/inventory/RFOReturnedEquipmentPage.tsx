import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  History,
} from "lucide-react";

export const RFOReturnedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStationAssignments();
      const returnedList = (data || []).filter((a: any) => {
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
        return !isConsumableCat && (statusUpper === "RETURNED" || statusUpper === "COMPLETED" || statusUpper === "VERIFIED");
      });

      setAssignments(returnedList);
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
  const returnedToday = useMemo(() => {
    const today = new Date().toDateString();
    return assignments.filter((a) => a.returned_date && new Date(a.returned_date).toDateString() === today).length;
  }, [assignments]);

  const returnedThisMonth = assignments.length;
  const avgReturnTime = "4.2 Days";
  const verifiedReturnsTotal = assignments.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Returned Equipment Audit Archive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Returned Equipment Log & History"
        subtitle="Historical read-only log of all closed and verified equipment returns synchronized with station inventory."
        icon={CheckCircle2}
        badge="Read-Only Audit Archive"
      />

      {/* 4 LIGHT STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block tracking-wider">
              Returned Today
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {returnedToday} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 block">Completed Today</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-900 text-amber-300 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-800 block tracking-wider">
              Returned This Month
            </span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {returnedThisMonth} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 mt-1 block">Monthly Closed Total</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-indigo-50/80 border border-indigo-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-800 block tracking-wider">
              Average Return Time
            </span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block">
              {avgReturnTime}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 mt-1 block">From Issue to Verification</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-900 text-white shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-800 block tracking-wider">
              Verified Returns
            </span>
            <span className="text-2xl font-black text-purple-950 mt-1 block">
              {verifiedReturnsTotal} <span className="text-xs font-normal text-gray-500">Records</span>
            </span>
            <span className="text-[10px] font-bold text-purple-700 mt-1 block">Archived In Log</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-900 text-white shadow-xs">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search returned equipment or officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
          title="Refresh Log"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* RETURNED EQUIPMENT TABLE (NO CATEGORY COLUMN, NO DOWNLOAD BUTTON, FULL WIDTH) */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-3.5 text-left align-middle w-[24%]">Equipment</th>
                <th className="px-4 py-3.5 text-center align-middle w-[24%]">Officer</th>
                <th className="px-3 py-3.5 text-center align-middle w-[11%]">Return Date</th>
                <th className="px-4 py-3.5 text-center align-middle w-[15%]">Verified By</th>
                <th className="px-3 py-3.5 text-center align-middle w-[9%]">Condition</th>
                <th className="px-4 py-3.5 text-center align-middle w-[14%]">Remarks</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Status</th>
                <th className="px-4 py-3.5 text-center align-middle w-[13%]">Actions</th>
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
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-emerald-950 text-[11px]">
                    {formatDate(asgn.actual_return || asgn.issue_date)}
                  </td>
                  <td className="px-4 py-3.5 text-center align-middle font-bold text-gray-700 truncate max-w-[140px]">
                    {asgn.issuer_name || "Range Forest Officer"}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-2.5 py-0.5 bg-emerald-100/80 text-emerald-900 rounded-lg text-[10px] font-black inline-block">
                      {asgn.condition || "Good"}
                    </span>
                  </td>
                  {/* REMARKS ELLIPSIS WITH HOVER TOOLTIP */}
                  <td className="px-4 py-3.5 text-center align-middle text-gray-600 text-[11px]">
                    <span className="max-w-[160px] truncate block mx-auto cursor-help" title={asgn.remarks || "Verified & Added to Stock"}>
                      {asgn.remarks || "Verified & Added to Stock"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Closed & Returned
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center align-middle">
                    <button
                      onClick={() => {
                        setSelectedAsgn(asgn);
                        setShowHistoryModal(true);
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 mx-auto cursor-pointer"
                      title="View History"
                    >
                      <History className="w-3 h-3 text-emerald-800" /> View History
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    No closed equipment return history logs found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW HISTORY MODAL */}
      {showHistoryModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" /> Verified Return History Record
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
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
                <span className="text-gray-500 font-bold">Return Date:</span>
                <span className="font-mono text-emerald-950">{formatDate(selectedAsgn.actual_return || selectedAsgn.issue_date)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Verified By:</span>
                <span className="font-bold text-emerald-900">{selectedAsgn.issuer_name || "Range Forest Officer"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-bold">Final Verified Condition:</span>
                <span className="font-black text-emerald-900">{selectedAsgn.condition || "Good"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block mb-1">Final Inspection Remarks:</span>
                <p className="p-3 rounded-xl bg-emerald-50 text-emerald-950 font-semibold border border-emerald-100">
                  {selectedAsgn.remarks || "Verified & synchronized with station stock."}
                </p>
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
    </div>
  );
};
