import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { InventorySummaryReport, StationInventory } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import { InventoryErrorCard } from "@/components/common/InventoryErrorCard";
import {
  LayoutDashboard,
  Box,
  Layers,
  Wrench,
  AlertTriangle,
  Flame,
  FileCheck,
  PlusCircle,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Trash2,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

export const RFODashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InventorySummaryReport | null>(null);
  const [stockItems, setStockItems] = useState<StationInventory[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, stockData] = await Promise.all([
        inventoryService.getSummaryReport(),
        inventoryService.getMyStationInventory(),
      ]);
      setSummary(sumData);
      setStockItems(stockData);
    } catch (err: any) {
      setError(err.message || "Failed to establish live connection to station inventory telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Station Telemetry & Category Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Range Station Inventory Command Center"
        subtitle="Real-time telemetry of permanent hardware assets, consumables, refillable kits, low-stock thresholds, and audit logs."
        icon={LayoutDashboard}
        badge="PostgreSQL Synchronized"
      />

      {error && (
        <InventoryErrorCard
          title="Station Telemetry Unavailable"
          message={error}
          onRetry={fetchData}
        />
      )}

      {/* 10 EQUAL-HEIGHT TELEMETRY CARDS (PART 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Permanent Assets */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Permanent Assets</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.permanent_assets_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Hardware & Optics</span>
          </div>
        </div>

        {/* 2. Consumables */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Consumables</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.consumables_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Direct Auto-Deduct</span>
          </div>
        </div>

        {/* 3. Refillable Kits */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Refillable Kits</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.refillable_kits_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Medical & Trauma Boxes</span>
          </div>
        </div>

        {/* 4. Pending Refills */}
        <div className="p-4 rounded-3xl bg-white border border-amber-950/20 bg-amber-500/5 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-amber-700/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">Pending Refills</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {summary?.pending_refills_count || 0}
            </div>
            <span className="text-[10px] font-bold text-amber-800">Requires Component Replenish</span>
          </div>
        </div>

        {/* 5. Items Under Repair */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Under Repair</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-900">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.items_under_repair_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Service Center Workshop</span>
          </div>
        </div>

        {/* 6. Low Stock Alerts (HIGHLIGHTED IN RED PART 7) */}
        <div className="p-4 rounded-3xl bg-red-500/10 border border-red-200 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-950">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-900 font-mono">
              {summary?.low_stock_items_count || 0}
            </div>
            <span className="text-[10px] font-bold text-red-700">Below Reorder Level</span>
          </div>
        </div>

        {/* 7. Disposed Assets */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Disposed Assets</span>
            <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.disposed_assets_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Condemned & Written Off</span>
          </div>
        </div>

        {/* 8. Lost Equipment */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Lost Equipment</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.lost_equipment_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Reported Unaccounted</span>
          </div>
        </div>

        {/* 9. Pending Requests */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Pending Requests</span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-900">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.pending_requests_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Guard Requisitions</span>
          </div>
        </div>

        {/* 10. Pending Returns */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[115px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Pending Returns</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {summary?.pending_returns_count || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Active Field Deployments</span>
          </div>
        </div>
      </div>

      {/* QUICK OPERATIONAL SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/officer/inventory/stock"
          className="p-4 rounded-2xl bg-emerald-900 text-white hover:bg-emerald-950 transition-all flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-extrabold">Add / Update Station Stock</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-300" />
        </Link>

        <Link
          to="/officer/inventory/kits"
          className="p-4 rounded-2xl bg-purple-900 text-white hover:bg-purple-950 transition-all flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-extrabold">Refillable Kit Inspector</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-300" />
        </Link>

        <Link
          to="/officer/inventory/issue"
          className="p-4 rounded-2xl bg-blue-900 text-white hover:bg-blue-950 transition-all flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-extrabold">Direct Equipment Issue</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-blue-300" />
        </Link>

        <Link
          to="/officer/inventory/history"
          className="p-4 rounded-2xl bg-amber-900 text-white hover:bg-amber-950 transition-all flex items-center justify-between shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-extrabold">Audit History & CSV Export</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-300" />
        </Link>
      </div>

      {/* LIVE STATION STOCK TABLE WITH THRESHOLD HIGHLIGHTING (PART 7) */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs space-y-3">
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-950/10 flex items-center justify-between">
          <div className="font-black text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Station Stock Telemetry ({stockItems.length} Master Items)
          </div>
          <button
            onClick={fetchData}
            className="p-1.5 text-emerald-900 hover:bg-emerald-100 rounded-lg transition-all"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/20 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-3.5">Equipment Item</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Available Stock</th>
                <th className="px-6 py-3.5">Reserved</th>
                <th className="px-6 py-3.5">Damaged</th>
                <th className="px-6 py-3.5">Reorder Level</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {stockItems.map((item) => {
                const isLow = item.status === "Low Stock" || item.status === "Out of Stock";
                return (
                  <tr
                    key={item.id}
                    className={`transition-all ${
                      isLow ? "bg-red-500/10 border-l-4 border-l-red-600 font-bold" : "hover:bg-emerald-50/30"
                    }`}
                  >
                    <td className="px-6 py-3.5 font-extrabold text-emerald-950">
                      {item.item_name}
                      {item.consumable && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-black">
                          Consumable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-800/70">{item.category}</td>
                    <td className={`px-6 py-3.5 font-mono font-black ${isLow ? "text-red-700" : "text-emerald-900"}`}>
                      {item.available_quantity} {item.unit}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-emerald-800/70">{item.reserved_quantity}</td>
                    <td className="px-6 py-3.5 font-mono font-bold text-red-600">{item.damaged_quantity}</td>
                    <td className="px-6 py-3.5 font-mono text-emerald-800/70">{item.reorder_level} {item.unit}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                          item.status === "Available"
                            ? "bg-emerald-100 text-emerald-900"
                            : item.status === "Low Stock" || item.status === "Out of Stock"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {stockItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No station inventory records initialized for your assigned station.
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
