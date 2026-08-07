import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import {
  History,
  Search,
  Loader2,
  Trash2,
  CheckCircle,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";

export const RFOAuditHistoryPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // Selection Checkboxes
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([]);

  // Confirmation Delete Modal
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
      const logs = await inventoryService.getAuditLogs({
        search: searchQuery || undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
      });
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory audit log history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Fixed Automatic CSV Export
  const handleExportCSV = () => {
    inventoryService.exportAuditLogsCSV({
      search: searchQuery || undefined,
      action: actionFilter !== "ALL" ? actionFilter : undefined,
    });
    showToast("Audit Log CSV Export Triggered", "success");
  };

  // Selection toggle
  const handleToggleSelectLog = (id: number) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllLogs = () => {
    if (selectedLogIds.length === auditLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(auditLogs.map((l) => l.id));
    }
  };

  // Deletion Handlers
  const handleExecuteDeleteAudit = async () => {
    setSubmitting(true);
    try {
      if (confirmDeleteModal.type === "single" && confirmDeleteModal.targetId) {
        await inventoryService.deleteAuditLog(confirmDeleteModal.targetId);
      } else if (confirmDeleteModal.type === "selected" && selectedLogIds.length > 0) {
        await inventoryService.deleteAuditLogsBatch(selectedLogIds);
        setSelectedLogIds([]);
      } else if (confirmDeleteModal.type === "all") {
        await inventoryService.deleteAllAuditLogs();
        setSelectedLogIds([]);
      }

      showToast("Audit Log Deleted Successfully", "success");
      setConfirmDeleteModal({ show: false, type: "single", title: "", message: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete audit log.");
    } finally {
      setSubmitting(false);
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
        <p className="text-sm font-medium text-emerald-950">Loading System Audit Log History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory Audit History & System Logs"
        subtitle="Immutable audit trail recording every inventory stock modification, assignment, approval, return, and deletion with automatic CSV export."
        icon={History}
        badge={`${auditLogs.length} Audit Records`}
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

      {/* TOOLBAR, FILTERS & EXPORT BUTTON */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search action, officer, equipment, before/after values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-extrabold shadow-xs">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-emerald-950/10 bg-emerald-950/5 rounded-xl text-xs font-extrabold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="Stock Added">Stock Added</option>
            <option value="Issued Equipment">Issued Equipment</option>
            <option value="Return Verified (Good)">Return Verified (Good)</option>
            <option value="Return Verified (Minor Damage)">Return Verified (Minor Damage)</option>
            <option value="Return Verified (Major Damage)">Return Verified (Major Damage)</option>
            <option value="Return Verified (Lost)">Return Verified (Lost)</option>
          </select>

          {selectedLogIds.length > 0 && (
            <button
              onClick={() =>
                setConfirmDeleteModal({
                  show: true,
                  type: "selected",
                  title: "Delete Selected Audit Logs",
                  message: `Are you sure you want to delete ${selectedLogIds.length} selected audit log entry(s)?`,
                })
              }
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedLogIds.length})
            </button>
          )}

          {auditLogs.length > 0 && (
            <button
              onClick={() =>
                setConfirmDeleteModal({
                  show: true,
                  type: "all",
                  title: "Purge All Audit Logs",
                  message: `Are you sure you want to purge all ${auditLogs.length} audit log entries for this station? This action cannot be undone.`,
                })
              }
              className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All
            </button>
          )}

          {/* FIXED AUTOMATIC UTF-8 CSV EXPORT BUTTON */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" /> Export UTF-8 CSV
          </button>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[1450px]">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-3 py-4 text-center align-middle w-10">
                  <input
                    type="checkbox"
                    checked={auditLogs.length > 0 && selectedLogIds.length === auditLogs.length}
                    onChange={handleSelectAllLogs}
                    className="w-4 h-4 text-emerald-900 rounded-md cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-center align-middle">Timestamp</th>
                <th className="px-4 py-4 text-center align-middle">Action</th>
                <th className="px-4 py-4 text-center align-middle">Officer</th>
                <th className="px-4 py-4 text-center align-middle">Equipment</th>
                <th className="px-4 py-4 text-center align-middle">Before Value</th>
                <th className="px-4 py-4 text-center align-middle">After Value</th>
                <th className="px-4 py-4 text-center align-middle">Reason / Notes</th>
                <th className="px-3.5 py-4 text-center align-middle">IP</th>
                <th className="px-4 py-4 text-center align-middle">Device</th>
                <th className="px-3.5 py-4 text-center align-middle">Status</th>
                <th className="px-4 py-4 text-center align-middle">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {auditLogs.map((log) => {
                const isChecked = selectedLogIds.includes(log.id);

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-emerald-50/30 transition-all ${
                      isChecked ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-4 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectLog(log.id)}
                        className="w-4 h-4 text-emerald-900 rounded-md cursor-pointer"
                      />
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-600 font-bold whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black">
                        {log.action}
                      </span>
                    </td>

                    {/* Officer */}
                    <td className="px-4 py-4 text-center align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                      {log.officer}
                    </td>

                    {/* Equipment */}
                    <td className="px-4 py-4 text-center align-middle font-bold text-emerald-900 whitespace-nowrap">
                      {log.equipment}
                    </td>

                    {/* Before Value */}
                    <td className="px-4 py-4 text-center align-middle font-mono text-gray-500 text-[11px] whitespace-nowrap">
                      {log.before_value}
                    </td>

                    {/* After Value */}
                    <td className="px-4 py-4 text-center align-middle font-mono font-black text-emerald-950 text-[11px] whitespace-nowrap">
                      {log.after_value}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-4 text-center align-middle text-gray-600 text-[11px] max-w-[200px] truncate whitespace-nowrap">
                      {log.reason}
                    </td>

                    {/* IP */}
                    <td className="px-3.5 py-4 text-center align-middle font-mono text-[10px] text-gray-400 whitespace-nowrap">
                      {log.ip_address}
                    </td>

                    {/* Device */}
                    <td className="px-4 py-4 text-center align-middle text-[10px] text-gray-500 font-bold whitespace-nowrap">
                      {log.device}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black">
                        {log.status || "SUCCESS"}
                      </span>
                    </td>

                    {/* Delete Single Row */}
                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      <button
                        onClick={() =>
                          setConfirmDeleteModal({
                            show: true,
                            type: "single",
                            targetId: log.id,
                            title: "Delete Audit Log Record",
                            message: `Are you sure you want to delete audit log entry #${log.id}?`,
                          })
                        }
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-all border border-red-200"
                        title="Delete Audit Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-10 text-center text-gray-400 font-medium italic">
                    No system audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION DELETE MODAL */}
      {confirmDeleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-2xl bg-red-100 shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950">{confirmDeleteModal.title}</h3>
                <p className="text-xs font-semibold text-gray-500">Database Audit Log Deletion</p>
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
                onClick={handleExecuteDeleteAudit}
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
    </div>
  );
};
