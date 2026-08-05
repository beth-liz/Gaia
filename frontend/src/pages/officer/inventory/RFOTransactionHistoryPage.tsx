import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryTransaction, InventoryMaster } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  History,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

export const RFOTransactionHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEquipmentId = searchParams.get("equipment_id") ? parseInt(searchParams.get("equipment_id")!) : undefined;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<InventoryMaster[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTxType, setSelectedTxType] = useState<string>("ALL");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | undefined>(initialEquipmentId);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, masters] = await Promise.all([
        inventoryService.getTransactionsFiltered({
          transaction_type: selectedTxType,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          equipment_id: selectedEquipmentId,
          search: searchTerm || undefined,
        }),
        inventoryService.getMasterItems(),
      ]);
      setTransactions(txs);
      setMasterCatalog(masters);
    } catch (err: any) {
      setError(err.message || "Failed to load station transaction history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTxType, selectedEquipmentId, startDate, endDate]);

  const handleExportCSV = () => {
    inventoryService.exportTransactionsCSV({
      transaction_type: selectedTxType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      equipment_id: selectedEquipmentId,
      search: searchTerm || undefined,
    });
  };

  const transactionTypes = [
    "ALL",
    "STOCK_ADDED",
    "STOCK_UPDATED",
    "ISSUED",
    "RETURNED",
    "DAMAGED",
    "REPAIRED",
    "REPLACED",
    "DISCARDED",
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Station Audit Trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Transaction History & Audit Trail"
        subtitle="Immutable ledger of all stock additions, equipment issues, return verifications, and damaged gear actions."
        icon={History}
        badge="PostgreSQL Audit Log"
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search remarks, user, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>

            {/* Tx Type */}
            <select
              value={selectedTxType}
              onChange={(e) => setSelectedTxType(e.target.value)}
              className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "All Transaction Types" : t}
                </option>
              ))}
            </select>

            {/* Equipment Filter */}
            <select
              value={selectedEquipmentId || ""}
              onChange={(e) => setSelectedEquipmentId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="">All Master Equipment</option>
              {masterCatalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.item_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end w-full lg:w-auto">
            <button
              onClick={fetchData}
              className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all shrink-0"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-950/5 text-xs font-semibold text-emerald-950">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-emerald-950/10 bg-emerald-950/5 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-emerald-950/10 bg-emerald-950/5 font-semibold"
            />
          </div>

          {(startDate || endDate || selectedEquipmentId || selectedTxType !== "ALL" || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTxType("ALL");
                setSelectedEquipmentId(undefined);
                setStartDate("");
                setEndDate("");
              }}
              className="text-[11px] text-red-600 font-extrabold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Equipment Item</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Performed By</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Remarks / Log Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-emerald-950">{tx.item_name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                        tx.transaction_type === "STOCK_ADDED"
                          ? "bg-emerald-100 text-emerald-900"
                          : tx.transaction_type === "ISSUED"
                          ? "bg-blue-100 text-blue-900"
                          : tx.transaction_type === "RETURNED"
                          ? "bg-emerald-100 text-emerald-900"
                          : tx.transaction_type === "DAMAGED" || tx.transaction_type === "DISCARDED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-black">{tx.quantity}</td>
                  <td className="px-6 py-4 text-xs font-extrabold">{tx.performer_name}</td>
                  <td className="px-6 py-4 text-xs text-emerald-800/70">{tx.assignee_name || "-"}</td>
                  <td className="px-6 py-4 text-[11px] text-emerald-800/70">{tx.supplier || "-"}</td>
                  <td className="px-6 py-4 text-[11px] text-emerald-800/70 max-w-xs truncate">{tx.remarks || "-"}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No transactions match your current search or date range filters.
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
