import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentRequest } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

export const RFOEquipmentRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);

  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [issueRemarks, setIssueRemarks] = useState<string>("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("");

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

  const handleApprove = async (req: EquipmentRequest) => {
    try {
      await inventoryService.approveOrRejectRequest(req.id, "APPROVED");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to approve request");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await inventoryService.approveOrRejectRequest(selectedRequest.id, "REJECTED", rejectionReason);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await inventoryService.issueEquipment(selectedRequest.id, issueRemarks, expectedReturnDate || undefined);
      setShowIssueModal(false);
      setSelectedRequest(null);
      setIssueRemarks("");
      setExpectedReturnDate("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to issue equipment");
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      (r.guard_name && r.guard_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.item_name && r.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.purpose && r.purpose.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Guard Requests Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forest Guard Equipment Requests"
        subtitle="Review, approve, reject, and issue equipment requested by station Forest Guards for field operations."
        icon={Clock}
        badge={`${requests.filter((r) => r.status === "Pending").length} Pending`}
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
              placeholder="Search guard, item, or purpose..."
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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Issued">Issued</option>
            <option value="Rejected">Rejected</option>
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

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Requested At</th>
                <th className="px-6 py-4">Forest Guard</th>
                <th className="px-6 py-4">Requested Item</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {new Date(req.requested_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    {req.guard_name || `Guard #${req.guard_id}`}
                  </td>
                  <td className="px-6 py-4 font-bold">{req.item_name}</td>
                  <td className="px-6 py-4 font-mono font-black text-emerald-700">
                    {req.quantity} {req.unit}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-emerald-800/70 max-w-xs truncate">{req.purpose}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                        req.status === "Pending"
                          ? "bg-amber-100 text-amber-900"
                          : req.status === "Approved"
                          ? "bg-blue-100 text-blue-900"
                          : req.status === "Issued"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {(req.status === "Approved" || req.status === "Pending") && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowIssueModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all inline-flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Issue Equipment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No equipment requests found for your station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Request from {selectedRequest.guard_name}
            </h3>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify operational reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-700" />
              Issue Equipment to {selectedRequest.guard_name}
            </h3>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs space-y-1 text-blue-950">
              <p><strong>Item:</strong> {selectedRequest.item_name} ({selectedRequest.quantity} {selectedRequest.unit})</p>
              <p><strong>Purpose:</strong> {selectedRequest.purpose}</p>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Expected Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Issue Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issued for sector 3 wildlife migration patrol"
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Confirm & Issue Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
