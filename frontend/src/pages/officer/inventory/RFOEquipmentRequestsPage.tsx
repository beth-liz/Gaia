import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentRequest } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Building2,
  Calendar,
} from "lucide-react";

export const RFOEquipmentRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"Pending" | "Approved" | "Rejected" | "Issued" | "Cancelled">("Pending");

  // Expanded Rows Map
  const [expandedRowsMap, setExpandedRowsMap] = useState<Record<number, boolean>>({});

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);

  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [issueRemarks, setIssueRemarks] = useState<string>("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("");

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
      const reqs = await inventoryService.getStationRequests();
      setRequests(reqs);
    } catch (err: any) {
      setError(err.message || "Failed to load equipment requests.");
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

  const handleApprove = async (req: EquipmentRequest) => {
    setSubmitting(true);
    try {
      await inventoryService.approveOrRejectRequest(req.id, "APPROVED");
      showToast("Equipment Request Approved Successfully", "success");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to approve request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await inventoryService.approveOrRejectRequest(selectedRequest.id, "REJECTED", rejectionReason);
      showToast("Equipment Request Rejected", "error");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await inventoryService.issueEquipment(selectedRequest.id, issueRemarks, expectedReturnDate || undefined);
      showToast("Equipment Issued Successfully", "success");
      setShowIssueModal(false);
      setSelectedRequest(null);
      setIssueRemarks("");
      setExpectedReturnDate("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to issue equipment");
    } finally {
      setSubmitting(false);
    }
  };

  const safeRequests = useMemo(() => {
    return Array.isArray(requests) ? requests : [];
  }, [requests]);

  // Tab Filtering & Search
  const filteredRequests = useMemo(() => {
    return safeRequests.filter((r) => {
      const statusUpper = (r.status || "").toUpperCase();
      let matchesTab = false;

      if (activeTab === "Pending") matchesTab = statusUpper === "PENDING" || statusUpper === "PENDING_APPROVAL";
      else if (activeTab === "Approved") matchesTab = statusUpper === "APPROVED";
      else if (activeTab === "Rejected") matchesTab = statusUpper === "REJECTED";
      else if (activeTab === "Issued") matchesTab = statusUpper === "ISSUED" || statusUpper === "COMPLETED";
      else if (activeTab === "Cancelled") matchesTab = statusUpper === "CANCELLED";

      if (!matchesTab) return false;
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();
      return (
        (r.guard_name && r.guard_name.toLowerCase().includes(term)) ||
        (r.item_name && r.item_name.toLowerCase().includes(term)) ||
        (r.purpose && r.purpose.toLowerCase().includes(term)) ||
        (`REQ-${r.id}`).toLowerCase().includes(term)
      );
    });
  }, [safeRequests, activeTab, searchTerm]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Equipment Requests Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Equipment Requisition Portal"
        subtitle="Manage station equipment requests from Forest Guards, review priority levels, approve requisitions, and inspect lifecycle timelines."
        icon={Clock}
        badge={`${safeRequests.filter((r) => r.status === "PENDING").length} Pending Requests`}
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
              <XCircle className="w-4 h-4 text-white shrink-0" />
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

      {/* Toolbar & Search */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search request #, guard, equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all flex items-center gap-2 text-xs font-bold"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Queue
        </button>
      </div>

      {/* 5 TABS NAVIGATION */}
      <div className="p-2 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 flex items-center gap-2 overflow-x-auto">
        {(["Pending", "Approved", "Rejected", "Issued", "Cancelled"] as const).map((tab) => {
          const count = safeRequests.filter((r) => {
            const st = (r.status || "").toUpperCase();
            if (tab === "Pending") return st === "PENDING" || st === "PENDING_APPROVAL";
            if (tab === "Approved") return st === "APPROVED";
            if (tab === "Rejected") return st === "REJECTED";
            if (tab === "Issued") return st === "ISSUED" || st === "COMPLETED";
            if (tab === "Cancelled") return st === "CANCELLED";
            return false;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === tab
                  ? "bg-emerald-900 text-white shadow-md"
                  : "bg-transparent text-emerald-950 hover:bg-emerald-100/60"
              }`}
            >
              <span>{tab} Requests</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] ${
                activeTab === tab ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-900"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* REDESIGNED CENTERED TABLE WITH TIMELINE & EXPANDABLE ROWS */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-4 py-4 text-center align-middle">Request Number</th>
                <th className="px-4 py-4 text-center align-middle">Date</th>
                <th className="px-4 py-4 text-center align-middle">Equipment</th>
                <th className="px-3.5 py-4 text-center align-middle">Quantity</th>
                <th className="px-4 py-4 text-center align-middle">Purpose</th>
                <th className="px-3.5 py-4 text-center align-middle">Priority</th>
                <th className="px-4 py-4 text-center align-middle">Requested By</th>
                <th className="px-3.5 py-4 text-center align-middle">Status</th>
                <th className="px-4 py-4 text-center align-middle">HQ Response</th>
                <th className="px-5 py-4 text-center align-middle">Timeline</th>
                <th className="px-5 py-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredRequests.map((r) => {
                const reqNumber = `REQ-2026-${String(r.id).padStart(4, "0")}`;
                const isExpanded = !!expandedRowsMap[r.id];
                const statusUpper = (r.status || "").toUpperCase();

                return (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-emerald-50/30 transition-all">
                      {/* Request Number */}
                      <td className="px-4 py-4 text-center align-middle font-mono font-black text-emerald-950 whitespace-nowrap">
                        {reqNumber}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-600 font-bold whitespace-nowrap">
                        {formatDate(r.requested_at)}
                      </td>

                      {/* Equipment */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        {r.item_name || "Equipment"}
                      </td>

                      {/* Quantity */}
                      <td className="px-3.5 py-4 text-center align-middle font-mono font-black text-emerald-900 whitespace-nowrap">
                        {r.quantity || r.requested_quantity || 1} {r.unit || "Units"}
                      </td>

                      {/* Purpose */}
                      <td className="px-4 py-4 text-center align-middle text-gray-700 text-[11px] max-w-[200px] truncate whitespace-nowrap">
                        {r.purpose || r.reason || "Patrol Duty"}
                      </td>

                      {/* Priority */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          r.priority === "URGENT" || r.priority === "HIGH"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-emerald-100 text-emerald-900"
                        }`}>
                          {r.priority || "MEDIUM"}
                        </span>
                      </td>

                      {/* Requested By */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        <div>{r.guard_name || "Forest Guard"}</div>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          statusUpper === "PENDING"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : statusUpper === "APPROVED"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : statusUpper === "ISSUED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-red-100 text-red-900 border border-red-300"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* HQ Response */}
                      <td className="px-4 py-4 text-center align-middle font-semibold text-gray-600 text-[11px] whitespace-nowrap">
                        {r.reason || (statusUpper === "APPROVED" ? "Approved by RFO" : "Awaiting Review")}
                      </td>

                      {/* Timeline Workflow Stepper */}
                      <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">Req</span>
                          <span className="text-gray-300">→</span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            statusUpper === "APPROVED" || statusUpper === "ISSUED" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-400"
                          }`}>Appr</span>
                          <span className="text-gray-300">→</span>
                          <span className={`px-2 py-0.5 rounded-md ${
                            statusUpper === "ISSUED" ? "bg-emerald-900 text-white" : "bg-gray-100 text-gray-400"
                          }`}>Iss</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {statusUpper === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(r)}
                                disabled={submitting}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                              >
                                <Check className="w-3 h-3 text-emerald-300" /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(r);
                                  setShowRejectModal(true);
                                }}
                                disabled={submitting}
                                className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}

                          {statusUpper === "APPROVED" && (
                            <button
                              onClick={() => {
                                setSelectedRequest(r);
                                setShowIssueModal(true);
                              }}
                              disabled={submitting}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                            >
                              <Send className="w-3 h-3 text-amber-300" /> Issue Gear
                            </button>
                          )}

                          <button
                            onClick={() => toggleRowExpand(r.id)}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shrink-0"
                            title="Toggle Lifecycle History"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE ROW LIFECYCLE HISTORY ACCORDION */}
                    {isExpanded && (
                      <tr className="bg-emerald-50/40 border-b border-emerald-950/10">
                        <td colSpan={11} className="p-5 text-left">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Requisition Details
                              </span>
                              <div className="font-extrabold text-emerald-950">
                                {r.item_name} ({r.quantity || r.requested_quantity} {r.unit || "Units"})
                              </div>
                              <div className="text-gray-600 font-semibold">Purpose: {r.purpose || r.reason || "Field Patrol Duty"}</div>
                              <div className="font-mono text-[11px] text-gray-500">Requested: {formatDate(r.requested_at)}</div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Station & Guard Allocation
                              </span>
                              <div className="font-bold text-emerald-950">Requested By: {r.guard_name || "Forest Guard"}</div>
                              <div className="text-gray-600 font-semibold">Priority Level: {r.priority || "MEDIUM"}</div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white border border-emerald-950/10 space-y-1">
                              <span className="text-[10px] font-black text-emerald-950 uppercase flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-emerald-700" /> HQ Response & Remarks
                              </span>
                              <div className="font-semibold text-gray-700">{r.reason || "No response notes recorded."}</div>
                              {r.approved_at && (
                                <div className="font-mono text-[11px] text-emerald-900 font-bold">
                                  Approved: {formatDate(r.approved_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-gray-400 font-medium italic">
                    No {activeTab.toLowerCase()} equipment requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-emerald-950">Reject Equipment Requisition</h3>
            <p className="text-xs font-semibold text-gray-500">
              Rejecting request <span className="font-mono font-bold text-emerald-950">REQ-2026-{String(selectedRequest.id).padStart(4, "0")}</span> for {selectedRequest.item_name}.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify official rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-emerald-950">Issue Equipment to Forest Guard</h3>
            <p className="text-xs font-semibold text-gray-500">
              Dispatching {selectedRequest.quantity || selectedRequest.requested_quantity} {selectedRequest.unit || "Units"} of {selectedRequest.item_name} to Guard {selectedRequest.guard_name}.
            </p>
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Issue Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Voucher or allocation notes..."
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Dispatch & Issue Gear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
