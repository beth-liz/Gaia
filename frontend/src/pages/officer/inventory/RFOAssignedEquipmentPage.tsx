import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  PackageCheck,
  User,
  RotateCcw,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

export const RFOAssignedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Verify Return Modal
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
      setError(err.message || "Failed to load station equipment assignments.");
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

  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  const filteredAssignments = safeAssignments.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      (a.guard_name && a.guard_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.item_name && a.item_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (a.status && a.status.toUpperCase() === statusFilter.toUpperCase());
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Assigned Field Gear...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Equipment & Deployments"
        subtitle="Monitor equipment deployed to Forest Guards in the field and process return verifications."
        icon={PackageCheck}
        badge={`${safeAssignments.filter((a) => a.status?.toUpperCase() === "ISSUED").length} Active Deployments`}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
            <input
              type="text"
              placeholder="Search guard or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Active (Issued)</option>
            <option value="RETURNED">Returned</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETURN_PENDING">Return Pending</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Forest Guard</th>
                <th className="px-6 py-4">Equipment Item</th>
                <th className="px-6 py-4">Issued Qty</th>
                <th className="px-6 py-4">Issued By</th>
                <th className="px-6 py-4">Expected Return</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredAssignments.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {asgn.issue_date ? new Date(asgn.issue_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    {asgn.guard_name || `Guard #${asgn.guard_id}`}
                  </td>
                  <td className="px-6 py-4 font-bold">{asgn.item_name || `Item #${asgn.station_inventory_id}`}</td>
                  <td className="px-6 py-4 font-mono font-black text-emerald-700">
                    {asgn.quantity} {asgn.unit || "units"}
                  </td>
                  <td className="px-6 py-4 text-xs text-emerald-800/70">{asgn.issuer_name || "RFO"}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {asgn.expected_return_date ? new Date(asgn.expected_return_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                        asgn.status?.toUpperCase() === "ISSUED"
                          ? "bg-blue-100 text-blue-900"
                          : asgn.status?.toUpperCase() === "RETURNED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {asgn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {asgn.status?.toUpperCase() === "ISSUED" && (
                      <button
                        onClick={() => {
                          setSelectedAsgn(asgn);
                          setVerifyAction("ACCEPT");
                          setDamagedQtyInput(asgn.quantity);
                          setShowVerifyModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-300" /> Verify Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No active or historical equipment assignments found for this station.
                  </td>
                </tr>
              )}
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
              <p><strong>Guard:</strong> {selectedAsgn.guard_name}</p>
              <p><strong>Item:</strong> {selectedAsgn.item_name} ({selectedAsgn.quantity} {selectedAsgn.unit})</p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Verification Action *
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
                  Verification Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Note equipment condition upon inspection..."
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
