import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentRequest } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  FileCheck2,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Check,
  X,
  Send,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  UserCheck,
  FileText,
  User,
  MapPin,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

export const RFOEquipmentRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Raw DB Lists
  const [guardRequests, setGuardRequests] = useState<EquipmentRequest[]>([]);
  const [issuedGearAssignments, setIssuedGearAssignments] = useState<any[]>([]);
  const [hqRequests, setHqRequests] = useState<any[]>([]);

  // Search Terms
  const [guardSearchTerm, setGuardSearchTerm] = useState<string>("");
  const [hqSearchTerm, setHqSearchTerm] = useState<string>("");

  // SECTION 1: GUARD REQUESTS STATUS FILTER (DEFAULT: "PENDING")
  const [guardStatusFilter, setGuardStatusFilter] = useState<
    "PENDING" | "APPROVED" | "ISSUED" | "REJECTED"
  >("PENDING");

  // Modals
  const [selectedReq, setSelectedReq] = useState<EquipmentRequest | any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showIssueConfirmModal, setShowIssueConfirmModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectRemarks, setRejectRemarks] = useState<string>("");

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
      const [stationReqs, stationAsgns, hqData] = await Promise.all([
        inventoryService.getStationRequests(),
        inventoryService.getStationAssignments(),
        inventoryService.getAdminHQRequests(),
      ]);

      // Guard requests are station requests where request_type is not HQ_STOCK_REQUEST
      const rawGuardList = (stationReqs || []).filter(
        (r) => (r.request_type || "").toUpperCase() !== "HQ_STOCK_REQUEST"
      );
      setGuardRequests(rawGuardList);

      // Active issued gear assignments currently possessed by officers in station
      const activeAsgns = (stationAsgns || []).filter(
        (a) => ["ISSUED", "ACTIVE", "ASSIGNED", "PENDING_RETURN"].includes((a.status || "").toUpperCase())
      );
      setIssuedGearAssignments(activeAsgns);

      // HQ Requests come directly from HQ admin request endpoints
      setHqRequests(hqData.requests || []);
    } catch (err: any) {
      setError(err.message || "Failed to load equipment requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Section 1: Guard Requests & Issued Gear Filtered List
  const filteredGuardRequests = useMemo(() => {
    const searchLower = guardSearchTerm.toLowerCase().trim();

    if (guardStatusFilter === "ISSUED") {
      // 1. Requisitions with ISSUED status
      const reqIssued = guardRequests.filter((r) =>
        ["ISSUED", "COMPLETED", "FULFILLED"].includes((r.status || "").toUpperCase())
      );

      // 2. Active station assignments currently possessed by officers
      const asgnIssued = issuedGearAssignments.map((a) => ({
        id: `asgn-${a.id}`,
        guard_id: a.guard_id,
        guard_name: a.guard_name || "Forest Guard",
        badge_id: a.guard_badge || `FG-${a.guard_id}`,
        station_name: a.station_name || "Muthanga Range Office",
        item_name: a.item_name || "Equipment Item",
        equipment_name: a.item_name || "Equipment Item",
        quantity: a.quantity,
        unit: a.unit || "Units",
        priority: a.assignment_type || "DIRECT_ISSUE",
        requested_at: a.issue_date,
        status: "ISSUED",
        remarks: a.purpose || a.remarks || "Direct Officer Possession",
        is_direct_assignment: true,
        original_data: a,
      }));

      const combined = [...reqIssued, ...asgnIssued];

      if (!searchLower) return combined;

      return combined.filter((r) => {
        const gName = (r.guard_name || "").toLowerCase();
        const bId = (r.badge_id || "").toLowerCase();
        const eq = (r.item_name || r.equipment_name || "").toLowerCase();
        return gName.includes(searchLower) || bId.includes(searchLower) || eq.includes(searchLower);
      });
    }

    // Pending, Approved, Rejected filtering
    return guardRequests.filter((r) => {
      const statusUpper = (r.status || "PENDING").toUpperCase();
      let matchesFilter = false;

      if (guardStatusFilter === "PENDING") matchesFilter = statusUpper === "PENDING";
      else if (guardStatusFilter === "APPROVED") matchesFilter = statusUpper === "APPROVED";
      else if (guardStatusFilter === "REJECTED") matchesFilter = statusUpper === "REJECTED";

      if (!matchesFilter) return false;
      if (!searchLower) return true;

      const gName = (r.guard_name || "").toLowerCase();
      const bId = (r.badge_id || "").toLowerCase();
      const eq = (r.item_name || r.equipment_name || "").toLowerCase();
      return gName.includes(searchLower) || bId.includes(searchLower) || eq.includes(searchLower);
    });
  }, [guardRequests, issuedGearAssignments, guardStatusFilter, guardSearchTerm]);

  // Section 2: HQ Requests Filtered List
  const filteredHqRequests = useMemo(() => {
    const searchLower = hqSearchTerm.toLowerCase().trim();
    return hqRequests.filter((r) => {
      if (!searchLower) return true;
      const eq = (r.equipment_name || "").toLowerCase();
      const cat = (r.category || "").toLowerCase();
      const st = (r.status || "").toLowerCase();
      return eq.includes(searchLower) || cat.includes(searchLower) || st.includes(searchLower);
    });
  }, [hqRequests, hqSearchTerm]);

  // Counts for Guard Tabs
  const pendingCount = useMemo(() => guardRequests.filter((r) => (r.status || "").toUpperCase() === "PENDING").length, [guardRequests]);
  const approvedCount = useMemo(() => guardRequests.filter((r) => (r.status || "").toUpperCase() === "APPROVED").length, [guardRequests]);
  const issuedCount = useMemo(() => {
    const reqIssuedCount = guardRequests.filter((r) =>
      ["ISSUED", "COMPLETED", "FULFILLED"].includes((r.status || "").toUpperCase())
    ).length;
    return reqIssuedCount + issuedGearAssignments.length;
  }, [guardRequests, issuedGearAssignments]);
  const rejectedCount = useMemo(() => guardRequests.filter((r) => (r.status || "").toUpperCase() === "REJECTED").length, [guardRequests]);

  // Status Badges
  const renderStatusBadge = (status: string, isHQ = false) => {
    const s = (status || "PENDING").toUpperCase();

    if (isHQ) {
      if (s === "PENDING") {
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-xl text-[10px] font-black inline-block">
            HQ Pending
          </span>
        );
      } else if (s === "APPROVED") {
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-[10px] font-black inline-block">
            HQ Approved
          </span>
        );
      } else if (s === "ISSUED" || s === "COMPLETED") {
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black inline-block">
            HQ Issued
          </span>
        );
      } else if (s === "REJECTED") {
        return (
          <span className="px-3 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[10px] font-black inline-block">
            HQ Rejected
          </span>
        );
      }
    }

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
    } else if (s === "ISSUED" || s === "COMPLETED" || s === "FULFILLED") {
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

  // Action Handlers
  const handleApproveGuardRequest = async (req: EquipmentRequest) => {
    setSubmitting(true);
    try {
      await inventoryService.approveOrRejectRequest(req.id, "APPROVED");
      showToast("Request Approved Successfully", "success");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectGuardRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await inventoryService.approveOrRejectRequest(selectedReq.id, "REJECTED", rejectRemarks);
      showToast("Request Rejected", "success");
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

  const handleConfirmIssueEquipment = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await inventoryService.approveOrRejectRequest(selectedReq.id, "ISSUE");
      showToast("Equipment Issued Successfully", "success");
      setShowIssueConfirmModal(false);
      setSelectedReq(null);
      setGuardStatusFilter("ISSUED"); // Switch filter to Issued tab
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
        <p className="text-sm font-medium text-emerald-950">Loading Equipment Requests Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Range Officer Equipment Requests Portal"
        subtitle="Manage Forest Guard equipment requisitions and monitor Headquarters stock requests across independent workflows."
        icon={FileCheck2}
        badge={`${guardRequests.length + hqRequests.length} Total Requisitions`}
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

      {/* ========================================================================= */}
      {/* SECTION 1: FOREST GUARD REQUISITIONS (OFFICER MANAGEMENT WORKFLOW) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-emerald-950/5 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900 text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950">Section 1: Forest Guard Requisitions</h3>
              <p className="text-xs font-semibold text-gray-500">
                Review, approve, issue, and manage equipment requests submitted by Forest Guards to Head Officer.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-950 text-xs font-black">
            {guardRequests.length} Guard Requests
          </span>
        </div>

        {/* SECTION 1 TOOLBAR: SEARCH ON TOP ROW + 4 EQUAL-WIDTH BUTTONS ON DEDICATED ROW */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-4">
          {/* Top Row: Search Bar & Refresh */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search officer name, badge ID, equipment..."
                value={guardSearchTerm}
                onChange={(e) => setGuardSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>

            <button
              onClick={fetchData}
              className="px-4 py-2.5 text-xs font-extrabold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-950/10 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Section 1</span>
            </button>
          </div>

          {/* Dedicated Row: 4 Equal-Width Professional Status Filter Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-emerald-950/10">
            {/* Tab 1: Pending Guard Requests */}
            <button
              onClick={() => setGuardStatusFilter("PENDING")}
              className={`p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                guardStatusFilter === "PENDING"
                  ? "bg-amber-900 text-white border-amber-950 shadow-md"
                  : "bg-amber-50/70 text-amber-950 border-amber-200 hover:bg-amber-100/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pending Guard Requests</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-black ${
                guardStatusFilter === "PENDING" ? "bg-amber-800 text-white" : "bg-amber-200/80 text-amber-950"
              }`}>
                {pendingCount}
              </span>
            </button>

            {/* Tab 2: Approved Guard Requests */}
            <button
              onClick={() => setGuardStatusFilter("APPROVED")}
              className={`p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                guardStatusFilter === "APPROVED"
                  ? "bg-blue-900 text-white border-blue-950 shadow-md"
                  : "bg-blue-50/70 text-blue-950 border-blue-200 hover:bg-blue-100/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Approved Guard Requests</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-black ${
                guardStatusFilter === "APPROVED" ? "bg-blue-800 text-white" : "bg-blue-200/80 text-blue-950"
              }`}>
                {approvedCount}
              </span>
            </button>

            {/* Tab 3: Issued Equipment (DISPLAYS ALL ACTIVE ISSUED GEAR POSSESSED BY OFFICERS) */}
            <button
              onClick={() => setGuardStatusFilter("ISSUED")}
              className={`p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                guardStatusFilter === "ISSUED"
                  ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                  : "bg-emerald-50/70 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Issued Equipment</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-black ${
                guardStatusFilter === "ISSUED" ? "bg-emerald-800 text-white" : "bg-emerald-200/80 text-emerald-950"
              }`}>
                {issuedCount}
              </span>
            </button>

            {/* Tab 4: Rejected Guard Requests */}
            <button
              onClick={() => setGuardStatusFilter("REJECTED")}
              className={`p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                guardStatusFilter === "REJECTED"
                  ? "bg-red-900 text-white border-red-950 shadow-md"
                  : "bg-red-50/70 text-red-950 border-red-200 hover:bg-red-100/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Rejected Guard Requests</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-xl text-[11px] font-mono font-black ${
                guardStatusFilter === "REJECTED" ? "bg-red-800 text-white" : "bg-red-200/80 text-red-950"
              }`}>
                {rejectedCount}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 1 TABLE: GUARD REQUESTS & ACTIVE ISSUED GEAR */}
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3.5 text-center align-middle">Name</th>
                  <th className="px-3 py-3.5 text-center align-middle">Badge ID</th>
                  <th className="px-4 py-3.5 text-center align-middle">Station</th>
                  <th className="px-4 py-3.5 text-center align-middle">Equipment</th>
                  <th className="px-3 py-3.5 text-center align-middle">Quantity</th>
                  <th className="px-3 py-3.5 text-center align-middle">Priority / Type</th>
                  <th className="px-4 py-3.5 text-center align-middle">Requested / Issue Date</th>
                  <th className="px-3 py-3.5 text-center align-middle">Status</th>
                  <th className="px-4 py-3.5 text-center align-middle">Head Officer Response</th>
                  <th className="px-4 py-3.5 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {filteredGuardRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-4 py-3.5 text-center align-middle font-extrabold text-emerald-950">
                      {req.guard_name || "Forest Guard"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono font-bold text-gray-600">
                      {req.badge_id || `FG-${req.guard_id}`}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle text-gray-700">
                      {req.station_name || "Muthanga Station"}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-black text-emerald-900">
                      {req.item_name || req.equipment_name}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                      {req.quantity} {req.unit || "Units"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      {renderPriorityBadge(req.priority || "MEDIUM")}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                      {formatDate(req.requested_at)}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      {renderStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle text-gray-600 font-semibold text-[11px]">
                      {(req as any).rejection_reason || (req as any).remarks || (guardStatusFilter === "PENDING" ? "Awaiting Officer Review" : "Active Officer Possession")}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => {
                            setSelectedReq(req as any);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* PENDING TAB ACTIONS */}
                        {guardStatusFilter === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApproveGuardRequest(req as any)}
                              disabled={submitting}
                              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white font-black text-[10px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Approve Guard Request"
                            >
                              <Check className="w-3 h-3 text-amber-300" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setRejectRemarks("");
                                setShowRejectModal(true);
                              }}
                              disabled={submitting}
                              className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-all cursor-pointer"
                              title="Reject Guard Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* APPROVED TAB ACTIONS */}
                        {guardStatusFilter === "APPROVED" && (
                          <>
                            <button
                              disabled
                              className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-400 font-extrabold text-[10px] rounded-lg cursor-not-allowed flex items-center gap-1"
                              title="Already Approved"
                            >
                              <Check className="w-3 h-3 text-gray-400" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setShowIssueConfirmModal(true);
                              }}
                              disabled={submitting}
                              className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Issue Equipment to Guard"
                            >
                              <Send className="w-3 h-3 text-amber-300" /> Issue Equipment
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredGuardRequests.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                      No requisitions or active equipment found in this section matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: HEADQUARTERS REQUISITIONS (HQ ADMIN WORKFLOW) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="p-4 rounded-2xl bg-indigo-950/5 border border-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-900 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-indigo-950">Section 2: Headquarters Requisitions</h3>
              <p className="text-xs font-semibold text-gray-500">
                Monitor stock requisitions submitted by Head Officer to Headquarters Admin.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-100 text-indigo-950 text-xs font-black">
            {hqRequests.length} HQ Requisitions
          </span>
        </div>

        {/* SECTION 2 TOOLBAR: SEARCH & REFRESH */}
        <div className="p-4 rounded-3xl bg-white border border-indigo-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-indigo-700/50" />
            <input
              type="text"
              placeholder="Search HQ equipment, category, status..."
              value={hqSearchTerm}
              onChange={(e) => setHqSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-indigo-950/10 bg-indigo-950/5 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-800 placeholder-indigo-900/40"
            />
          </div>

          <button
            onClick={fetchData}
            className="p-2 text-indigo-900 hover:bg-indigo-100 rounded-xl border border-indigo-950/10 transition-all cursor-pointer"
            title="Refresh HQ Requisitions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* SECTION 2 TABLE: HEADQUARTERS REQUESTS */}
        <div className="bg-white rounded-3xl border border-indigo-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-indigo-950/5 border-b border-indigo-950/10 text-indigo-950 font-black uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3.5 text-center align-middle">Equipment</th>
                  <th className="px-3 py-3.5 text-center align-middle">Category</th>
                  <th className="px-3 py-3.5 text-center align-middle">Requested Qty</th>
                  <th className="px-3 py-3.5 text-center align-middle">Priority</th>
                  <th className="px-4 py-3.5 text-center align-middle">Request Date</th>
                  <th className="px-3 py-3.5 text-center align-middle">HQ Status</th>
                  <th className="px-4 py-3.5 text-center align-middle">HQ Response</th>
                  <th className="px-3 py-3.5 text-center align-middle">Issued Qty</th>
                  <th className="px-4 py-3.5 text-center align-middle">Issued Date</th>
                  <th className="px-4 py-3.5 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/5 text-indigo-950 text-xs font-semibold">
                {filteredHqRequests.map((hqReq) => (
                  <tr key={hqReq.id} className="hover:bg-indigo-50/30 transition-all">
                    <td className="px-4 py-3.5 text-center align-middle font-black text-indigo-950">
                      {hqReq.equipment_name}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-bold text-indigo-900">
                      {hqReq.category}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                      {hqReq.quantity_requested} Units
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      {renderPriorityBadge(hqReq.priority)}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                      {formatDate(hqReq.requested_date)}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      {renderStatusBadge(hqReq.status, true)}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle text-indigo-900 font-semibold text-[11px]">
                      {hqReq.remarks || hqReq.reason || "Under Headquarters Review"}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle font-mono font-black text-emerald-700">
                      {["ISSUED", "COMPLETED"].includes((hqReq.status || "").toUpperCase())
                        ? `${hqReq.issued_quantity || hqReq.quantity_requested} Units`
                        : (hqReq.status || "").toUpperCase() === "APPROVED"
                        ? `${hqReq.issued_quantity || hqReq.quantity_requested} Units (Approved)`
                        : (hqReq.status || "").toUpperCase() === "REJECTED"
                        ? `0 Units (Rejected)`
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-mono text-gray-600 text-[11px]">
                      {hqReq.status && (hqReq.status || "").toUpperCase() !== "PENDING"
                        ? formatDate(hqReq.issued_date || hqReq.approved_at || hqReq.requested_date)
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Only */}
                        <button
                          onClick={() => {
                            setSelectedReq(hqReq);
                            setShowDetailsModal(true);
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

                {filteredHqRequests.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                      No Headquarters Stock Requisitions found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: VIEW DETAILS DRAWER (READ ONLY) */}
      {showDetailsModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" /> Requisition Full Details
                </h3>
                <p className="text-xs font-semibold text-gray-500">Submitted on {formatDate(selectedReq.requested_at || selectedReq.requested_date)}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Status</span>
                  {renderStatusBadge(selectedReq.status, selectedReq.request_type === "HQ_STOCK_REQUEST")}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Priority</span>
                  {renderPriorityBadge(selectedReq.priority)}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {selectedReq.request_type !== "HQ_STOCK_REQUEST" ? (
                  <>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-bold flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-700" /> Guard Name:</span>
                      <span className="font-extrabold text-emerald-950">{selectedReq.guard_name || "Forest Guard"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-bold">Badge ID:</span>
                      <span className="font-mono font-black text-gray-700">{selectedReq.badge_id || `FG-${selectedReq.guard_id}`}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-gray-500 font-bold flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-700" /> Station:</span>
                      <span className="font-extrabold text-emerald-950">{selectedReq.station_name || "Muthanga Station"}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-bold flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-indigo-700" /> Target Station:</span>
                    <span className="font-extrabold text-indigo-950">{selectedReq.station_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold">Equipment:</span>
                  <span className="font-extrabold text-emerald-900">{selectedReq.item_name || selectedReq.equipment_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-gray-500 font-bold">Requested Quantity:</span>
                  <span className="font-mono font-black text-emerald-950">{selectedReq.quantity || selectedReq.quantity_requested} Units</span>
                </div>
              </div>

              <div>
                <span className="font-black text-emerald-950 uppercase text-[10px] block mb-1">Purpose / Reason</span>
                <p className="p-3 rounded-xl bg-gray-50 text-gray-700 font-semibold border border-gray-200">
                  {selectedReq.purpose || selectedReq.reason || "Field Duty Patrol"}
                </p>
              </div>

              <div>
                <span className="font-black text-emerald-950 uppercase text-[10px] block mb-1">
                  {selectedReq.request_type === "HQ_STOCK_REQUEST" ? "HQ Response" : "Head Officer Response"}
                </span>
                <p className="p-3 rounded-xl bg-emerald-50/60 text-emerald-950 font-semibold border border-emerald-100">
                  {selectedReq.rejection_reason || selectedReq.remarks || "No additional remarks."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM ISSUE EQUIPMENT DIALOG (FOR APPROVED GUARD REQUESTS) */}
      {showIssueConfirmModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-700" /> Confirm Equipment Issuance
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  Are you sure you want to issue this equipment from station inventory?
                </p>
              </div>
              <button onClick={() => setShowIssueConfirmModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2 text-xs">
              <div className="flex justify-between font-extrabold text-emerald-950">
                <span>Equipment Item:</span>
                <span>{selectedReq.item_name || selectedReq.equipment_name}</span>
              </div>
              <div className="flex justify-between text-emerald-900 font-semibold">
                <span>Assigned Guard:</span>
                <span>{selectedReq.guard_name} ({selectedReq.badge_id || `FG-${selectedReq.guard_id}`})</span>
              </div>
              <div className="flex justify-between text-emerald-900 font-semibold">
                <span>Quantity to Issue:</span>
                <span className="font-mono font-black">{selectedReq.quantity} Units</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                type="button"
                onClick={() => setShowIssueConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                NO
              </button>
              <button
                type="button"
                onClick={handleConfirmIssueEquipment}
                disabled={submitting}
                className="px-6 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                YES (Confirm Issue)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT GUARD REQUEST MODAL */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div>
                <h3 className="text-base font-black text-red-950 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" /> Reject Guard Request
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  {selectedReq.item_name || selectedReq.equipment_name} for {selectedReq.guard_name}
                </p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleRejectGuardRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-red-950 uppercase mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason for declining guard request..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="w-full p-3 border border-red-200 rounded-2xl bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-red-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
