import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Send,
  Check,
  X,
  FileText,
  User,
  MapPin,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

export const AdminHQRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [metrics, setMetrics] = useState({
    pending_requests: 0,
    approved_today: 0,
    rejected_requests: 0,
    issued_equipment: 0,
    high_priority: 0,
  });

  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals State
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);

  const [rejectRemarks, setRejectRemarks] = useState<string>("");

  const [issueForm, setIssueForm] = useState({
    issue_quantity: 1,
    remarks: "Dispatched by Headquarters Central Stock",
  });

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
      const data = await inventoryService.getAdminHQRequests();
      setMetrics(data.metrics || {
        pending_requests: 0,
        approved_today: 0,
        rejected_requests: 0,
        issued_equipment: 0,
        high_priority: 0,
      });
      setRequestsList(data.requests || []);
    } catch (err: any) {
      setError(err.message || "Failed to load Headquarters Equipment Requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : (req.status || "").toUpperCase() === statusFilter.toUpperCase();

      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesStatus;

      const code = (req.request_code || "").toLowerCase();
      const station = (req.station_name || "").toLowerCase();
      const officer = (req.officer_name || "").toLowerCase();
      const eq = (req.equipment_name || "").toLowerCase();
      const cat = (req.category || "").toLowerCase();

      return (
        matchesStatus &&
        (code.includes(term) ||
          station.includes(term) ||
          officer.includes(term) ||
          eq.includes(term) ||
          cat.includes(term))
      );
    });
  }, [requestsList, statusFilter, searchTerm]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "PENDING") {
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-black inline-block">
          Pending
        </span>
      );
    } else if (s === "APPROVED") {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-[10px] font-black inline-block">
          Approved
        </span>
      );
    } else if (s === "ISSUED" || s === "COMPLETED") {
      return (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black inline-block">
          Issued
        </span>
      );
    } else if (s === "REJECTED") {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[10px] font-black inline-block">
          Rejected
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded-xl text-[10px] font-black inline-block">
        {status}
      </span>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const p = (priority || "MEDIUM").toUpperCase();
    if (p === "URGENT" || p === "HIGH") {
      return (
        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[10px] font-black inline-block">
          {p}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-extrabold inline-block">
        {p}
      </span>
    );
  };

  // Actions
  const handleApprove = async (req: any) => {
    setSubmitting(true);
    try {
      await inventoryService.approveAdminHQRequest(req.id);
      showToast(`Request ${req.request_code} Approved Successfully`, "success");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await inventoryService.rejectAdminHQRequest(selectedReq.id, rejectRemarks);
      showToast(`Request ${selectedReq.request_code} Rejected`, "success");
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectRemarks("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reject request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (issueForm.issue_quantity <= 0) {
      alert("Issue quantity must be greater than zero.");
      return;
    }

    if (issueForm.issue_quantity > selectedReq.hq_available_stock) {
      alert(`Cannot issue ${issueForm.issue_quantity} units. Maximum HQ available stock is ${selectedReq.hq_available_stock} units.`);
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.issueAdminHQEquipment(selectedReq.id, {
        issue_quantity: issueForm.issue_quantity,
        remarks: issueForm.remarks,
      });

      showToast("Equipment Issued Successfully", "success");
      setShowIssueModal(false);
      setSelectedReq(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to issue equipment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Headquarters Equipment Requisitions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Headquarters Equipment Requests"
        subtitle="Review, approve, reject, and dispatch central HQ equipment for forest station requisitions across the state."
        icon={Building2}
        badge={`${requestsList.length} State Requisitions`}
      />

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

      {/* 5 TELEMETRY DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Pending Requests (Orange) */}
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col justify-between min-h-[110px] hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">Pending Requests</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {metrics.pending_requests}
            </div>
            <span className="text-[10px] font-bold text-amber-700">Awaiting HQ Review</span>
          </div>
        </div>

        {/* 2. Approved Today (Blue) */}
        <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 shadow-xs flex flex-col justify-between min-h-[110px] hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-950">Approved Today</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              {metrics.approved_today}
            </div>
            <span className="text-[10px] font-bold text-blue-700">Ready for Dispatch</span>
          </div>
        </div>

        {/* 3. Rejected (Red) */}
        <div className="p-4 rounded-3xl bg-red-50/80 border border-red-200 shadow-xs flex flex-col justify-between min-h-[110px] hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-950">Rejected</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-900">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-950 font-mono">
              {metrics.rejected_requests}
            </div>
            <span className="text-[10px] font-bold text-red-700">Declined Requisitions</span>
          </div>
        </div>

        {/* 4. Issued Equipment (Green) */}
        <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex flex-col justify-between min-h-[110px] hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Issued Equipment</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {metrics.issued_equipment}
            </div>
            <span className="text-[10px] font-bold text-emerald-700">Dispatched & Synced</span>
          </div>
        </div>

        {/* 5. High Priority (Purple) */}
        <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 shadow-xs flex flex-col justify-between min-h-[110px] hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-950">High Priority</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-950 font-mono">
              {metrics.high_priority}
            </div>
            <span className="text-[10px] font-bold text-purple-700">Urgent Patrol Needs</span>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & STATUS TABS TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search request code, station, officer, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", "PENDING", "APPROVED", "ISSUED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === st
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950"
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={fetchData}
            className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all ml-2"
            title="Refresh Requisitions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* REFINED REQUISITION TABLE (10 COLUMNS, NO REQUEST ID, STICKY HEADER) */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[650px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-emerald-950/10 backdrop-blur-md border-b border-emerald-950/15 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3.5 text-left align-middle">Station Name</th>
                <th className="px-4 py-3.5 text-left align-middle">Officer</th>
                <th className="px-4 py-3.5 text-left align-middle">Equipment</th>
                <th className="px-3 py-3.5 text-center align-middle">Category</th>
                <th className="px-3 py-3.5 text-center align-middle">Qty Requested</th>
                <th className="px-3 py-3.5 text-center align-middle">Priority</th>
                <th className="px-4 py-3.5 text-left align-middle">Reason</th>
                <th className="px-3 py-3.5 text-center align-middle">Requested Date</th>
                <th className="px-3 py-3.5 text-center align-middle">Status</th>
                <th className="px-4 py-3.5 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredRequests.map((req) => {
                const statusUpper = (req.status || "PENDING").toUpperCase();
                const isPending = statusUpper === "PENDING";
                const isApproved = statusUpper === "APPROVED";
                const canApprove = isPending;
                const canIssue = isPending || isApproved;
                const canReject = isPending || isApproved;

                return (
                  <tr key={req.id} className="hover:bg-emerald-50/30 transition-all">
                    {/* 1. Station Name */}
                    <td className="px-4 py-3 text-left align-middle font-extrabold text-emerald-950">
                      {req.station_name}
                    </td>

                    {/* 2. Officer */}
                    <td className="px-4 py-3 text-left align-middle text-gray-700">
                      {req.officer_name}
                    </td>

                    {/* 3. Equipment */}
                    <td className="px-4 py-3 text-left align-middle font-black text-emerald-950">
                      {req.equipment_name}
                    </td>

                    {/* 4. Category */}
                    <td className="px-3 py-3 text-center align-middle font-bold text-gray-600 text-[11px]">
                      {req.category}
                    </td>

                    {/* 5. Quantity Requested */}
                    <td className="px-3 py-3 text-center align-middle font-mono font-black text-emerald-950">
                      {req.quantity_requested}
                    </td>

                    {/* 6. Priority */}
                    <td className="px-3 py-3 text-center align-middle">
                      {renderPriorityBadge(req.priority)}
                    </td>

                    {/* 7. Reason */}
                    <td className="px-4 py-3 text-left align-middle text-gray-600 line-clamp-1 max-w-[150px]" title={req.reason}>
                      {req.reason}
                    </td>

                    {/* 8. Requested Date */}
                    <td className="px-3 py-3 text-center align-middle font-mono text-gray-500 text-[11px]">
                      {formatDate(req.requested_date)}
                    </td>

                    {/* 9. Status */}
                    <td className="px-3 py-3 text-center align-middle">
                      {renderStatusBadge(req.status)}
                    </td>

                    {/* 10. Actions (ALL 4 BUTTONS ALWAYS VISIBLE WITH DISABLED STATES) */}
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. View Button (Always Enabled) */}
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Approve Button (Enabled for PENDING, Disabled & Greyed Out for others) */}
                        {canApprove ? (
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={submitting}
                            className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Approve Requisition"
                          >
                            <Check className="w-3 h-3 text-amber-300" /> Approve
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-2.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 font-extrabold text-[10px] rounded-xl cursor-not-allowed flex items-center gap-1"
                            title="Approve (Completed)"
                          >
                            <Check className="w-3 h-3 text-gray-400" /> Approve
                          </button>
                        )}

                        {/* 3. Issue Button (Enabled for PENDING & APPROVED, Disabled & Greyed Out for ISSUED/REJECTED) */}
                        {canIssue ? (
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setIssueForm({
                                issue_quantity: req.quantity_requested,
                                remarks: `Dispatched ${req.quantity_requested} units to ${req.station_name}`,
                              });
                              setShowIssueModal(true);
                            }}
                            disabled={submitting}
                            className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Issue Equipment"
                          >
                            <Send className="w-3 h-3 text-amber-300" /> Issue
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-2.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 font-extrabold text-[10px] rounded-xl cursor-not-allowed flex items-center gap-1"
                            title="Issue (Completed)"
                          >
                            <Send className="w-3 h-3 text-gray-400" /> Issue
                          </button>
                        )}

                        {/* 4. Reject Button (Enabled for PENDING & APPROVED, Disabled & Greyed Out for REJECTED/ISSUED) */}
                        {canReject ? (
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setRejectRemarks("");
                              setShowRejectModal(true);
                            }}
                            disabled={submitting}
                            className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-all cursor-pointer"
                            title="Reject Requisition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                            title="Reject (Completed)"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    No Headquarters Equipment Requisitions found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW DETAILS DRAWER (DISPLAYS REQUEST ID HERE) */}
      {showDetailsModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" /> Requisition Details
                </h3>
                <p className="text-xs font-semibold text-gray-500">Submitted on {formatDate(selectedReq.requested_date)}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              {/* DISPLAY REQUEST ID EXCLUSIVELY INSIDE VIEW MODAL */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-900 block">Request ID</span>
                  <span className="font-mono font-black text-sm text-indigo-950">{selectedReq.request_code}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-gray-500 block font-mono">DB Record ID</span>
                  <span className="font-mono font-bold text-gray-700">#{selectedReq.id}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Status</span>
                  {renderStatusBadge(selectedReq.status)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Priority</span>
                  {renderPriorityBadge(selectedReq.priority)}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-700" /> Station:</span>
                  <span className="font-extrabold text-emerald-950">{selectedReq.station_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-700" /> Requested By:</span>
                  <span className="font-extrabold text-emerald-950">{selectedReq.officer_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold">Equipment Item:</span>
                  <span className="font-extrabold text-emerald-900">{selectedReq.equipment_name} ({selectedReq.category})</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold">Quantity Requested:</span>
                  <span className="font-mono font-black text-emerald-950">{selectedReq.quantity_requested} Units</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold">HQ Available Stock:</span>
                  <span className="font-mono font-black text-indigo-900">{selectedReq.hq_available_stock} Units Available</span>
                </div>
              </div>

              <div>
                <span className="font-black text-emerald-950 uppercase text-[10px] block mb-1">Requisition Purpose / Reason</span>
                <p className="p-3 rounded-xl bg-gray-50 text-gray-700 font-semibold border border-gray-200">{selectedReq.reason}</p>
              </div>

              {selectedReq.remarks && (
                <div>
                  <span className="font-black text-emerald-950 uppercase text-[10px] block mb-1">HQ Remarks</span>
                  <p className="p-3 rounded-xl bg-gray-50 text-gray-700 font-semibold border border-gray-200">{selectedReq.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT MODAL */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div>
                <h3 className="text-base font-black text-red-950 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" /> Reject Requisition {selectedReq.request_code}
                </h3>
                <p className="text-xs font-semibold text-gray-500">{selectedReq.equipment_name} for {selectedReq.station_name}</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-red-950 uppercase mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify why this requisition is being rejected..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="w-full p-3 border border-red-200 rounded-2xl bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-red-100">
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
                  Reject Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE EQUIPMENT DIALOG */}
      {showIssueModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-700" /> Issue Headquarters Equipment
                </h3>
                <p className="text-xs font-semibold text-gray-500">Dispatch equipment to {selectedReq.station_name}</p>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            {/* REQUEST SUMMARY CALLOUT */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2 text-xs">
              <div className="flex justify-between font-extrabold text-indigo-950">
                <span>Equipment Item:</span>
                <span>{selectedReq.equipment_name} ({selectedReq.category})</span>
              </div>
              <div className="flex justify-between text-indigo-900 font-semibold">
                <span>Station & Officer:</span>
                <span>{selectedReq.station_name} • {selectedReq.officer_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 text-center">
                <div className="p-2 rounded-xl bg-white border border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Requested Qty</span>
                  <span className="font-mono font-black text-sm text-indigo-950">{selectedReq.quantity_requested} Units</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">HQ Stock Available</span>
                  <span className="font-mono font-black text-sm text-emerald-700">{selectedReq.hq_available_stock} Units</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Issue Quantity *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedReq.hq_available_stock}
                  required
                  value={issueForm.issue_quantity}
                  onChange={(e) => setIssueForm({ ...issueForm, issue_quantity: Number(e.target.value) })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-mono font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <span className="text-[10px] font-semibold text-gray-400 mt-1 block">
                  Must be between 1 and {selectedReq.hq_available_stock} units.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Dispatch Remarks</label>
                <textarea
                  rows={2}
                  value={issueForm.remarks}
                  onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
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
                  Issue Equipment & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
