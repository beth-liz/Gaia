import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  PackageCheck,
  RotateCcw,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  ShieldCheck,
  History as HistoryIcon,
} from "lucide-react";

export const RFOAssignedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Expanded Rows Map
  const [expandedRowsMap, setExpandedRowsMap] = useState<Record<number, boolean>>({});

  // Verify Return Modal
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [verifyCondition, setVerifyCondition] = useState<"Good" | "Minor Damage" | "Major Damage" | "Lost">("Good");
  const [verifyRemarks, setVerifyRemarks] = useState<string>("");

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

  const toggleRowExpand = (id: number) => {
    setExpandedRowsMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenVerifyModal = (asgn: EquipmentAssignment) => {
    setSelectedAsgn(asgn);
    setVerifyCondition("Good");
    setVerifyRemarks("");
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgn) return;
    if (!verifyRemarks.trim()) {
      alert("Verification remarks are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.verifyReturnOptions(selectedAsgn.id, {
        condition: verifyCondition,
        remarks: verifyRemarks,
      });

      showToast("Return Verified Successfully", "success");
      setShowVerifyModal(false);
      setSelectedAsgn(null);
      setVerifyRemarks("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to process return verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const safeAssignments = useMemo(() => {
    return Array.isArray(assignments) ? assignments : [];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return safeAssignments.filter((a) => {
      const matchesSearch =
        !searchTerm ||
        (a.guard_name && a.guard_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.item_name && a.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        (a.status && a.status.toUpperCase() === statusFilter.toUpperCase());

      return matchesSearch && matchesStatus;
    });
  }, [safeAssignments, searchTerm, statusFilter]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${day} ${month} ${year}, ${time}`;
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Assigned Field Gear Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Assigned Equipment & Field Deployments"
        subtitle="Monitor live station equipment issued to Forest Guards, inspect expected return countdowns, and verify returns."
        icon={PackageCheck}
        badge={`${safeAssignments.filter((a) => a.status?.toUpperCase() === "ISSUED").length} Active Deployments`}
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
          <button onClick={() => setToastMsg(null)} className="text-white hover:opacity-80 font-black text-base ml-4">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-950/60 block">Total Deployments</span>
          <div className="text-xl font-black font-mono text-emerald-950 mt-1">{safeAssignments.length}</div>
        </div>
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-950/60 block">Active Issued</span>
          <div className="text-xl font-black font-mono text-purple-900 mt-1">
            {safeAssignments.filter((a) => a.status?.toUpperCase() === "ISSUED").length}
          </div>
        </div>
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-950/60 block">Pending Returns</span>
          <div className="text-xl font-black font-mono text-amber-700 mt-1">
            {safeAssignments.filter((a) => a.status?.toUpperCase() === "PENDING_RETURN").length}
          </div>
        </div>
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-950/60 block">Completed Returns</span>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {safeAssignments.filter((a) => a.status?.toUpperCase() === "RETURNED").length}
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search guard, equipment, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "ISSUED", "PENDING_RETURN", "RETURNED", "DAMAGED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === st
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-emerald-950/5 text-emerald-950 hover:bg-emerald-100"
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={fetchData}
            className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all ml-2"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* REDESIGNED CENTERED TABLE WITH EXPANDABLE ROWS */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[1350px]">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-4 py-4 text-center align-middle">Issue Date</th>
                <th className="px-4 py-4 text-center align-middle">Guard</th>
                <th className="px-4 py-4 text-center align-middle">Equipment</th>
                <th className="px-3.5 py-4 text-center align-middle">Category</th>
                <th className="px-3.5 py-4 text-center align-middle">Issued Qty</th>
                <th className="px-3.5 py-4 text-center align-middle">Usage Type</th>
                <th className="px-4 py-4 text-center align-middle">Expected Return</th>
                <th className="px-4 py-4 text-center align-middle">Issued By</th>
                <th className="px-3.5 py-4 text-center align-middle">Condition</th>
                <th className="px-3.5 py-4 text-center align-middle">Status</th>
                <th className="px-4 py-4 text-center align-middle">Days Remaining</th>
                <th className="px-5 py-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredAssignments.map((a) => {
                const isExpanded = !!expandedRowsMap[a.id];

                return (
                  <React.Fragment key={a.id}>
                    <tr className="hover:bg-emerald-50/30 transition-all cursor-pointer">
                      {/* Center Aligned Issue Date */}
                      <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-600 font-bold whitespace-nowrap">
                        {formatDate(a.issue_date)}
                      </td>

                      {/* Center Aligned Guard */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        <div>{a.guard_name || "Forest Guard"}</div>
                        {a.guard_badge && (
                          <span className="text-[10px] text-emerald-800/70 font-bold block">
                            Badge #{a.guard_badge}
                          </span>
                        )}
                      </td>

                      {/* Center Aligned Equipment */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        {a.item_name || "Equipment"}
                      </td>

                      {/* Center Aligned Category */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black">
                          {a.category || "General"}
                        </span>
                      </td>

                      {/* Center Aligned Issued Qty */}
                      <td className="px-3.5 py-4 text-center align-middle font-mono font-black text-emerald-950 whitespace-nowrap">
                        {a.quantity} {a.unit || "Units"}
                      </td>

                      {/* Center Aligned Usage Type */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          a.item_usage_type === "PERSONAL" ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900"
                        }`}>
                          {a.item_usage_type === "PERSONAL" ? "Permanent" : "Temporary"}
                        </span>
                      </td>

                      {/* Center Aligned Expected Return */}
                      <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-amber-900 font-bold whitespace-nowrap">
                        {formatDateOnly(a.expected_return_date)}
                      </td>

                      {/* Center Aligned Issued By */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-900 text-[11px] whitespace-nowrap">
                        {a.issuer_name || "Officer"}
                      </td>

                      {/* Center Aligned Condition */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          a.condition === "Good" ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
                        }`}>
                          {a.condition || "Good"}
                        </span>
                      </td>

                      {/* Center Aligned Status */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          a.status === "ISSUED"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : a.status === "PENDING_RETURN"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : a.status === "RETURNED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-red-100 text-red-900 border border-red-300"
                        }`}>
                          {a.status}
                        </span>
                      </td>

                      {/* Center Aligned Days Remaining */}
                      <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          (a.days_remaining || "").includes("Overdue")
                            ? "bg-red-600 text-white"
                            : (a.days_remaining || "").includes("Due Today")
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-100 text-emerald-950"
                        }`}>
                          {a.days_remaining || "Permanent Issue"}
                        </span>
                      </td>

                      {/* Center Aligned Actions */}
                      <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(a.status === "ISSUED" || a.status === "PENDING_RETURN") && (
                            <button
                              onClick={() => handleOpenVerifyModal(a)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-[11px] shadow-sm transition-all inline-flex items-center gap-1.5 shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-300" /> Verify Return
                            </button>
                          )}

                          <button
                            onClick={() => toggleRowExpand(a.id)}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shrink-0"
                            title="Toggle Details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE ROW ADDITIONAL DETAILS ACCORDION */}
                    {isExpanded && (
                      <tr className="bg-emerald-50/40 border-b border-emerald-950/10">
                        <td colSpan={12} className="p-5 text-left">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            {/* Issue History */}
                            <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <HistoryIcon className="w-3.5 h-3.5 text-emerald-700" /> Issue History
                              </span>
                              <div className="font-semibold text-emerald-950">Issued By: {a.issuer_name || "Officer"}</div>
                              <div className="font-mono text-[11px] text-gray-500">{formatDate(a.issue_date)}</div>
                            </div>

                            {/* Remarks */}
                            <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-emerald-700" /> Remarks & Notes
                              </span>
                              <div className="font-semibold text-gray-700">{a.remarks || "No remarks recorded."}</div>
                            </div>

                            {/* Mission */}
                            <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Mission Purpose
                              </span>
                              <div className="font-semibold text-emerald-950">{a.purpose || "Field Patrol Assignment"}</div>
                            </div>

                            {/* Previous Returns & Actual Timestamps */}
                            <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-emerald-700" /> Actual Return Timestamps
                              </span>
                              <div className="font-mono text-[11px] text-emerald-900 font-bold">
                                {a.returned_date ? formatDate(a.returned_date) : "Not Returned Yet"}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-gray-400 font-medium italic">
                    No equipment assignments found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VERIFY RETURN MODAL */}
      {showVerifyModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-black text-emerald-950">Verify Equipment Return</h3>
                  <p className="text-xs font-semibold text-gray-500">
                    {selectedAsgn.item_name} ({selectedAsgn.quantity} {selectedAsgn.unit || "Units"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-gray-400 hover:text-emerald-950 font-black text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-2">
                  Select Return Condition *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "Good", label: "Good Condition", desc: "Restore to available stock" },
                    { key: "Minor Damage", label: "Minor Damage", desc: "Flag for minor repair" },
                    { key: "Major Damage", label: "Major Damage", desc: "Move to damaged stock" },
                    { key: "Lost", label: "Lost Equipment", desc: "Record write-off" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setVerifyCondition(item.key as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        verifyCondition === item.key
                          ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                          : "bg-white hover:bg-emerald-50 border-emerald-950/10 text-emerald-950"
                      }`}
                    >
                      <div className="text-xs font-black">{item.label}</div>
                      <div className={`text-[10px] font-semibold ${verifyCondition === item.key ? "text-emerald-200" : "text-gray-500"}`}>
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">
                  Verification Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Officer verification notes..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
