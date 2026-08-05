import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  RotateCcw,
  User,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

export const RFOReturnsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [verifyAction, setVerifyAction] = useState<"ACCEPT" | "MARK_DAMAGED" | "REJECT">("ACCEPT");
  const [damagedQtyInput, setDamagedQtyInput] = useState<number>(1);
  const [remarksInput, setRemarksInput] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const asgns = await inventoryService.getStationAssignments();
      setAssignments(asgns);
    } catch (err: any) {
      setError(err.message || "Failed to load station returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgn) return;
    try {
      await inventoryService.verifyReturnOptions(selectedAsgn.id, {
        action: verifyAction,
        damaged_quantity: verifyAction === "MARK_DAMAGED" ? damagedQtyInput : undefined,
        remarks: remarksInput,
      });

      setShowVerifyModal(false);
      setSelectedAsgn(null);
      setRemarksInput("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to process return verification");
    }
  };

  const pendingReturns = assignments.filter((a) => a.status === "Issued");
  const completedReturns = assignments.filter((a) => a.status === "Returned" || a.status === "Damaged");

  const filteredActive = pendingReturns.filter(
    (a) =>
      !searchTerm ||
      (a.guard_name && a.guard_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.item_name && a.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Equipment Returns Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Return Verification Portal"
        subtitle="Inspect and verify returned gear from Forest Guards with Accept, Mark Damaged, or Reject options."
        icon={RotateCcw}
        badge={`${pendingReturns.length} Deployments Awaiting Return`}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search guard or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Return Verification Queue */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs space-y-3">
        <div className="p-4 bg-emerald-50/40 border-b border-emerald-950/10 font-black text-xs text-emerald-950 uppercase tracking-wider">
          Deployments Ready for Return Verification ({filteredActive.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/20 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Forest Guard</th>
                <th className="px-6 py-4">Equipment Item</th>
                <th className="px-6 py-4">Qty Issued</th>
                <th className="px-6 py-4">Issued By</th>
                <th className="px-6 py-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredActive.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/30">
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {new Date(asgn.issue_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    {asgn.guard_name}
                  </td>
                  <td className="px-6 py-4 font-bold">{asgn.item_name}</td>
                  <td className="px-6 py-4 font-mono font-black text-emerald-700">
                    {asgn.quantity} {asgn.unit}
                  </td>
                  <td className="px-6 py-4 text-xs text-emerald-800/70">{asgn.issuer_name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedAsgn(asgn);
                        setVerifyAction("ACCEPT");
                        setDamagedQtyInput(asgn.quantity);
                        setShowVerifyModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-300" /> Process Return Options
                    </button>
                  </td>
                </tr>
              ))}
              {filteredActive.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No active deployments waiting for return verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processed Returns Log */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs space-y-3">
        <div className="p-4 bg-emerald-50/40 border-b border-emerald-950/10 font-black text-xs text-emerald-950 uppercase tracking-wider">
          Verified Return Log ({completedReturns.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/20 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-3">Return Date</th>
                <th className="px-6 py-3">Guard</th>
                <th className="px-6 py-3">Equipment</th>
                <th className="px-6 py-3">Qty</th>
                <th className="px-6 py-3">Return Result</th>
                <th className="px-6 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {completedReturns.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/20">
                  <td className="px-6 py-3 text-[11px] font-mono text-emerald-800/70">
                    {asgn.returned_date ? new Date(asgn.returned_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-3 font-extrabold text-emerald-950">{asgn.guard_name}</td>
                  <td className="px-6 py-3 font-bold">{asgn.item_name}</td>
                  <td className="px-6 py-3 font-mono font-bold">{asgn.quantity} {asgn.unit}</td>
                  <td className="px-6 py-3">
                    {asgn.status === "Returned" ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> Accepted
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" /> Marked Damaged
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-[11px] text-emerald-800/70 truncate max-w-xs">{asgn.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Verification Modal */}
      {showVerifyModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-700" />
              Verify Returned Equipment
            </h3>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
              <p><strong>Forest Guard:</strong> {selectedAsgn.guard_name}</p>
              <p><strong>Item:</strong> {selectedAsgn.item_name} ({selectedAsgn.quantity} {selectedAsgn.unit})</p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Select Action *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyAction("ACCEPT")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      verifyAction === "ACCEPT"
                        ? "bg-emerald-900 text-amber-300 border-emerald-950 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyAction("MARK_DAMAGED")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      verifyAction === "MARK_DAMAGED"
                        ? "bg-red-600 text-white border-red-700 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Mark Damaged
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyAction("REJECT")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      verifyAction === "REJECT"
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {verifyAction === "MARK_DAMAGED" && (
                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Verified Damaged Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAsgn.quantity}
                    required
                    value={damagedQtyInput}
                    onChange={(e) => setDamagedQtyInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Inspection Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Note equipment condition upon physical verification..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-md ${
                    verifyAction === "ACCEPT"
                      ? "bg-emerald-900 hover:bg-emerald-950"
                      : verifyAction === "MARK_DAMAGED"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  Confirm Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
