import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import {
  RotateCcw,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Image as ImageIcon,
  Check,
  Wrench,
  AlertTriangle,
  XCircle,
  Clock,
  History as HistoryIcon,
} from "lucide-react";

export const RFOReturnsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Return Data Collections
  const [returnSubmissions, setReturnSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // History Checkboxes
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([]);

  // Confirmation Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    show: boolean;
    type: "single" | "selected" | "all";
    targetId?: number;
    title: string;
    message: string;
  }>({
    show: false,
    type: "single",
    title: "",
    message: "",
  });

  // Photo Preview Modal State
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

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
      const submissions = await inventoryService.getStationReturns();
      setReturnSubmissions(submissions);
    } catch (err: any) {
      setError(err.message || "Failed to load station returns queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Pending Returns Only
  const pendingReturnsList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    // Return submissions that are pending verification
    return returnSubmissions.filter((ret) => {
      const isPending =
        ret.status === "Pending Verification" ||
        ret.status === "PENDING_RETURN" ||
        ret.status === "Pending";

      if (!isPending) return false;
      if (!term) return true;

      return (
        (ret.guard_name || "").toLowerCase().includes(term) ||
        (ret.item_name || "").toLowerCase().includes(term) ||
        (ret.reason || "").toLowerCase().includes(term)
      );
    });
  }, [returnSubmissions, searchTerm]);

  // Verified Return History Section
  const verifiedHistoryList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return returnSubmissions.filter((ret) => {
      const isHistory =
        ret.status !== "Pending Verification" &&
        ret.status !== "PENDING_RETURN" &&
        ret.status !== "Pending";

      if (!isHistory) return false;
      if (!term) return true;

      return (
        (ret.guard_name || "").toLowerCase().includes(term) ||
        (ret.item_name || "").toLowerCase().includes(term) ||
        (ret.status || "").toLowerCase().includes(term)
      );
    });
  }, [returnSubmissions, searchTerm]);

  // Handle Verification Actions (Accept, Send Repair, Write Off, Reject)
  const handleVerifyReturnAction = async (
    returnId: number,
    action: "ACCEPT" | "REPAIR" | "WRITE_OFF" | "REJECT",
    remarks?: string
  ) => {
    setSubmitting(true);
    try {
      await inventoryService.verifyReturn(returnId, {
        action,
        remarks: remarks || `Action ${action} processed by Range Forest Officer.`,
      });

      showToast(`Return Action (${action}) Processed Successfully`, "success");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to verify return.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle History Deletion Execution
  const handleExecuteDeleteHistory = async () => {
    setSubmitting(true);
    try {
      if (confirmDeleteModal.type === "single" && confirmDeleteModal.targetId) {
        await inventoryService.deleteReturnHistory(confirmDeleteModal.targetId);
      } else if (confirmDeleteModal.type === "selected" && selectedHistoryIds.length > 0) {
        await inventoryService.deleteReturnHistoryBatch(selectedHistoryIds);
        setSelectedHistoryIds([]);
      } else if (confirmDeleteModal.type === "all") {
        await inventoryService.deleteAllReturnHistory();
        setSelectedHistoryIds([]);
      }

      showToast("Return History Deleted Successfully", "success");
      setConfirmDeleteModal({ show: false, type: "single", title: "", message: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete return history.");
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-select history handlers
  const handleToggleSelectHistory = (id: number) => {
    setSelectedHistoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllHistory = () => {
    if (selectedHistoryIds.length === verifiedHistoryList.length) {
      setSelectedHistoryIds([]);
    } else {
      setSelectedHistoryIds(verifiedHistoryList.map((h) => h.id));
    }
  };

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
        <p className="text-sm font-medium text-emerald-950">Loading Pending Returns Queue & History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Verify Equipment Returns"
        subtitle="Review pending return submissions from Forest Guards, verify item conditions, process actions, and manage return history."
        icon={RotateCcw}
        badge={`${pendingReturnsList.length} Pending Verifications`}
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

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search guard, equipment, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all flex items-center gap-2 text-xs font-bold"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Returns Queue
        </button>
      </div>

      {/* SECTION 1: PENDING RETURNS ONLY TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Return Submissions
          </h3>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-black">
            {pendingReturnsList.length} Awaiting Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[1350px]">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                  <th className="px-4 py-4 text-center align-middle">Guard</th>
                  <th className="px-4 py-4 text-center align-middle">Equipment</th>
                  <th className="px-4 py-4 text-center align-middle">Issue Date</th>
                  <th className="px-4 py-4 text-center align-middle">Return Date</th>
                  <th className="px-3.5 py-4 text-center align-middle">Condition</th>
                  <th className="px-4 py-4 text-center align-middle">Reason</th>
                  <th className="px-3.5 py-4 text-center align-middle">Photos</th>
                  <th className="px-4 py-4 text-center align-middle">Remarks</th>
                  <th className="px-3.5 py-4 text-center align-middle">Status</th>
                  <th className="px-5 py-4 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {pendingReturnsList.map((ret) => (
                  <tr key={ret.id} className="hover:bg-emerald-50/30 transition-all">
                    {/* Guard */}
                    <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                      <div>{ret.guard_name || "Forest Guard"}</div>
                      {ret.guard_badge && (
                        <span className="text-[10px] text-emerald-800/70 font-bold block">
                          Badge #{ret.guard_badge}
                        </span>
                      )}
                    </td>

                    {/* Equipment */}
                    <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                      {ret.item_name || "Equipment"}
                    </td>

                    {/* Issue Date */}
                    <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-600 font-bold whitespace-nowrap">
                      {formatDate(ret.issue_date)}
                    </td>

                    {/* Return Date */}
                    <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-amber-900 font-bold whitespace-nowrap">
                      {formatDate(ret.submitted_date)}
                    </td>

                    {/* Condition */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                        ret.condition === "Good" || ret.condition === "Excellent"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {ret.condition || "Good"}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-4 text-center align-middle text-gray-700 whitespace-nowrap">
                      {ret.reason || "Normal Return"}
                    </td>

                    {/* Photos (Optional) */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      {ret.photos ? (
                        <button
                          onClick={() => setPreviewPhotoUrl(ret.photos)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-[10px] font-extrabold border border-blue-200 inline-flex items-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3 text-blue-700" /> View Photo
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal">None</span>
                      )}
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-4 text-center align-middle text-gray-600 text-[11px] whitespace-nowrap">
                      {ret.remarks || "No remarks provided."}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-black">
                        PENDING_RETURN
                      </span>
                    </td>

                    {/* Actions: Accept, Send Repair, Write Off, Reject */}
                    <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleVerifyReturnAction(ret.id, "ACCEPT")}
                          disabled={submitting}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                          title="Accept Return & Restore Stock"
                        >
                          <Check className="w-3 h-3 text-emerald-300" /> Accept
                        </button>

                        <button
                          onClick={() => handleVerifyReturnAction(ret.id, "REPAIR")}
                          disabled={submitting}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                          title="Send to Repair Queue"
                        >
                          <Wrench className="w-3 h-3 text-amber-200" /> Send Repair
                        </button>

                        <button
                          onClick={() => handleVerifyReturnAction(ret.id, "WRITE_OFF")}
                          disabled={submitting}
                          className="px-2.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                          title="Write Off Equipment"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-300" /> Write Off
                        </button>

                        <button
                          onClick={() => handleVerifyReturnAction(ret.id, "REJECT")}
                          disabled={submitting}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-800 text-white font-black text-[10px] shadow-xs transition-all inline-flex items-center gap-1 shrink-0"
                          title="Reject Return Submission"
                        >
                          <XCircle className="w-3 h-3 text-gray-300" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingReturnsList.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-10 text-center text-gray-400 font-medium italic">
                      No pending equipment return submissions awaiting verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: VERIFIED RETURN HISTORY & DELETION CONTROLS */}
      <div className="space-y-3 pt-6 border-t border-emerald-950/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-emerald-700" />
              Verified Return History Log
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              Archived log of completed, repaired, written off, and rejected equipment returns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedHistoryIds.length > 0 && (
              <button
                onClick={() =>
                  setConfirmDeleteModal({
                    show: true,
                    type: "selected",
                    title: "Delete Selected Return History",
                    message: `Are you sure you want to delete ${selectedHistoryIds.length} selected return history record(s)? This action cannot be undone.`,
                  })
                }
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedHistoryIds.length})
              </button>
            )}

            {verifiedHistoryList.length > 0 && (
              <button
                onClick={() =>
                  setConfirmDeleteModal({
                    show: true,
                    type: "all",
                    title: "Purge All Return History",
                    message: `Are you sure you want to purge all ${verifiedHistoryList.length} verified return history records for this station? This action cannot be undone.`,
                  })
                }
                className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All History
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                  <th className="px-3 py-4 text-center align-middle w-10">
                    <input
                      type="checkbox"
                      checked={
                        verifiedHistoryList.length > 0 &&
                        selectedHistoryIds.length === verifiedHistoryList.length
                      }
                      onChange={handleSelectAllHistory}
                      className="w-4 h-4 text-emerald-900 rounded-md cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 text-center align-middle">Guard</th>
                  <th className="px-4 py-4 text-center align-middle">Equipment</th>
                  <th className="px-4 py-4 text-center align-middle">Return Date</th>
                  <th className="px-3.5 py-4 text-center align-middle">Condition</th>
                  <th className="px-4 py-4 text-center align-middle">Verified By</th>
                  <th className="px-4 py-4 text-center align-middle">Verified Timestamp</th>
                  <th className="px-3.5 py-4 text-center align-middle">Status</th>
                  <th className="px-4 py-4 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {verifiedHistoryList.map((ret) => {
                  const isChecked = selectedHistoryIds.includes(ret.id);

                  return (
                    <tr
                      key={ret.id}
                      className={`hover:bg-emerald-50/30 transition-all ${
                        isChecked ? "bg-emerald-50/60" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectHistory(ret.id)}
                          className="w-4 h-4 text-emerald-900 rounded-md cursor-pointer"
                        />
                      </td>

                      {/* Guard */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        <div>{ret.guard_name || "Forest Guard"}</div>
                      </td>

                      {/* Equipment */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                        {ret.item_name || "Equipment"}
                      </td>

                      {/* Return Date */}
                      <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {formatDate(ret.submitted_date)}
                      </td>

                      {/* Condition */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-xl text-[10px] font-black">
                          {ret.condition || "Good"}
                        </span>
                      </td>

                      {/* Verified By */}
                      <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-900 whitespace-nowrap">
                        {ret.verifier_name || "Officer"}
                      </td>

                      {/* Verified Timestamp */}
                      <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-emerald-900 font-bold whitespace-nowrap">
                        {formatDate(ret.verified_at)}
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          ret.status === "ACCEPT" || ret.status === "Accepted"
                            ? "bg-emerald-100 text-emerald-900"
                            : ret.status === "REPAIR"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-red-100 text-red-900"
                        }`}>
                          {ret.status}
                        </span>
                      </td>

                      {/* Delete One Action */}
                      <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                        <button
                          onClick={() =>
                            setConfirmDeleteModal({
                              show: true,
                              type: "single",
                              targetId: ret.id,
                              title: "Delete Return History Record",
                              message: `Are you sure you want to delete the return history record for '${ret.item_name}'?`,
                            })
                          }
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-all border border-red-200"
                          title="Delete History Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {verifiedHistoryList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-gray-400 font-medium italic">
                      No verified return history records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDeleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-2xl bg-red-100 shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950">{confirmDeleteModal.title}</h3>
                <p className="text-xs font-semibold text-gray-500">Database History Purge</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-700 leading-relaxed">
              {confirmDeleteModal.message}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-emerald-950/10">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal({ show: false, type: "single", title: "", message: "" })}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteHistory}
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Equipment Return Inspection Photo
              </h4>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-gray-400 hover:text-emerald-950 font-black text-base"
              >
                ×
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-950/10 max-h-96 flex items-center justify-center bg-black/5">
              <img src={previewPhotoUrl} alt="Inspection" className="max-h-96 object-contain" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 bg-emerald-900 text-white font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
