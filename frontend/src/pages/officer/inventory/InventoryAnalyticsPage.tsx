import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { InventorySummaryReport } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import { BarChart2, Loader2, AlertCircle } from "lucide-react";

export const InventoryAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InventorySummaryReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await inventoryService.getSummaryReport();
        setReport(data);
      } catch (err: any) {
        setError(err.message || "Failed to load inventory analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Inventory Analytics Dashboard...</p>
      </div>
    );
  }

  if (!report) return null;

  const totalUnits = (report.total_items_in_stock || 0) + (report.total_items_reserved || 0) + (report.total_items_damaged || 0) || 1;
  const availablePct = Math.round(((report.total_items_in_stock || 0) / totalUnits) * 100);
  const reservedPct = Math.round(((report.total_items_reserved || 0) / totalUnits) * 100);
  const damagedPct = Math.round(((report.total_items_damaged || 0) / totalUnits) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Station Inventory Analytics & Intelligence"
        subtitle="Visual breakdown of stock distribution, consumables consumption trends, low stock alerts, and maintenance telemetry."
        icon={BarChart2}
        badge="Analytics Engine"
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

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Master Items</div>
          <div className="text-xl font-black text-emerald-950 mt-1">{report.total_master_items}</div>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Available Stock</div>
          <div className="text-xl font-black text-emerald-700 mt-1">{report.total_items_in_stock}</div>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Issued Gear</div>
          <div className="text-xl font-black text-blue-700 mt-1">{report.total_items_reserved}</div>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Damaged / Repair</div>
          <div className="text-xl font-black text-amber-700 mt-1">{report.total_items_damaged}</div>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Low Stock Alerts</div>
          <div className="text-xl font-black text-red-700 mt-1">{report.low_stock_items_count}</div>
        </div>
        <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Pending Requests</div>
          <div className="text-xl font-black text-purple-700 mt-1">{report.pending_requests_count}</div>
        </div>
      </div>

      {/* VISUAL PROGRESS BARS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Overall Stock Distribution</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-900">Available Stock</span>
                <span>{availablePct}% ({report.total_items_in_stock} units)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-600 h-3 rounded-full transition-all" style={{ width: `${availablePct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-900">Issued / Reserved Gear</span>
                <span>{reservedPct}% ({report.total_items_reserved} units)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${reservedPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-900">Damaged / Under Repair</span>
                <span>{damagedPct}% ({report.total_items_damaged} units)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${damagedPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Asset Category Breakdown</h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-950">Permanent Assets</span>
              <span className="text-sm font-black text-emerald-900">{report.permanent_assets_count} units</span>
            </div>
            <div className="p-3.5 bg-amber-50/60 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-amber-950">Consumable Supplies</span>
              <span className="text-sm font-black text-amber-900">{report.consumables_count} units</span>
            </div>
            <div className="p-3.5 bg-purple-50/60 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-purple-950">Refillable Field Kits</span>
              <span className="text-sm font-black text-purple-900">{report.refillable_kits_count} kits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
