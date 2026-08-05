import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export const AdminAuditLogsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getAuditLogs({
        action: actionFilter !== "ALL" ? actionFilter : undefined,
      });
      setAuditLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [actionFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading System Audit Logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="System-Wide Inventory Audit Logs"
        subtitle="Read-only administrative audit log recording every inventory mutation, approval, issue, return, and transfer."
        icon={ShieldCheck}
        badge="Admin Audit Portal"
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-emerald-950/10 p-4 shadow-xs flex justify-between items-center">
        <div className="text-xs font-bold text-emerald-950">
          Showing <strong>{auditLogs.length}</strong> system audit records
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 border border-emerald-950/10 rounded-xl text-xs font-extrabold text-emerald-950 outline-none"
        >
          <option value="ALL">All Audit Actions</option>
          <option value="Stock Added">Stock Added</option>
          <option value="Stock Adjusted">Stock Adjusted</option>
          <option value="Submitted Return">Submitted Return</option>
          <option value="Initiated Transfer">Initiated Transfer</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/5 text-emerald-950 font-black uppercase text-[10px] tracking-wider border-b border-emerald-950/10">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">User & Role</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Before → After Value</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 font-semibold text-emerald-950">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-bold">
                    {log.user_name || `User #${log.user_id}`} <span className="text-[10px] text-gray-400">({log.user_role})</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold">{log.entity_type} #{log.entity_id || ""}</td>
                  <td className="px-5 py-3.5 text-emerald-900 font-extrabold">
                    {log.old_value || "—"} → {log.new_value || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 font-mono text-[11px]">{log.ip_address || "127.0.0.1"}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 font-medium">
                    No system audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
