import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { History, Download, Search, AlertCircle, Loader2 } from "lucide-react";

export const InventoryMovementHistoryPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getTransactionsFiltered({
        transaction_type: txTypeFilter,
        search: searchQuery || undefined,
      });
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory movement history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [txTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleExportCSV = () => {
    inventoryService.exportTransactionsCSV({
      transaction_type: txTypeFilter !== "ALL" ? txTypeFilter : undefined,
      search: searchQuery || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Movement Audit History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Inventory Movement Audit Trail"
        subtitle="Complete chronological timeline of all inventory stock movements, allocations, returns, and repairs."
        icon={History}
        badge="Audit System"
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

      {/* FILTER & EXPORT BAR */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 p-5 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-950/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search remarks, equipment, or officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-emerald-950/10 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-extrabold">
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value)}
            className="px-3 py-2 border border-emerald-950/10 rounded-xl text-xs font-extrabold text-emerald-950 outline-none"
          >
            <option value="ALL">All Movement Types</option>
            <option value="STOCK_IN">Stock Added</option>
            <option value="ISSUE">Issued</option>
            <option value="RETURN">Returned</option>
            <option value="CONSUME">Consumed</option>
            <option value="REFILL">Refilled</option>
            <option value="DAMAGE">Damaged</option>
            <option value="REPAIR">Repaired</option>
            <option value="TRANSFER">Transferred</option>
            <option value="ADJUSTMENT">Adjusted</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-emerald-900 text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/5 text-emerald-950 font-black uppercase text-[10px] tracking-wider border-b border-emerald-950/10">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Movement Type</th>
                <th className="px-5 py-3.5">Item</th>
                <th className="px-5 py-3.5">Before → After</th>
                <th className="px-5 py-3.5">Performed By</th>
                <th className="px-5 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 font-semibold text-emerald-950">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 font-medium">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      tx.transaction_type === "STOCK_IN" ? "bg-emerald-100 text-emerald-900" :
                      tx.transaction_type === "ISSUE" ? "bg-blue-100 text-blue-900" :
                      tx.transaction_type === "DAMAGE" ? "bg-red-100 text-red-900" : "bg-purple-100 text-purple-900"
                    }`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold">{tx.item_name || "Station Item"}</td>
                  <td className="px-5 py-3.5 font-extrabold text-emerald-900">
                    {tx.quantity_before ?? "—"} → {tx.quantity_after ?? "—"} (Changed: {tx.quantity_changed || tx.quantity})
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{tx.performer_name || `User #${tx.performed_by}`}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{tx.remarks || "No details"}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 font-medium">
                    No movement records found matching the filter.
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
