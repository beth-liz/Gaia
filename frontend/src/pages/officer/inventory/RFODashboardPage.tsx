import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { RFOInventoryDashboardData } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import { InventoryErrorCard } from "@/components/common/InventoryErrorCard";
import {
  LayoutDashboard,
  Box,
  Warehouse,
  Layers,
  Wrench,
  AlertTriangle,
  FileCheck,
  PlusCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  XCircle,
  Building2,
  ShoppingCart,
  Send,
  Lock,
  CheckCircle,
  UserCheck,
} from "lucide-react";

export const RFODashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<RFOInventoryDashboardData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Collapsible Accordion State per Category ID (all open by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getRFODashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || "Failed to establish live connection to station inventory telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategory = (catId: number) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const cards = dashboardData?.cards;

  // Filtered Grouped Categories
  const filteredCategories = useMemo(() => {
    if (!dashboardData?.grouped_categories) return [];
    if (!searchTerm.trim()) return dashboardData.grouped_categories;

    const term = searchTerm.toLowerCase();
    return dashboardData.grouped_categories
      .map((cat) => {
        const matchingItems = cat.items.filter(
          (i) =>
            i.equipment_name.toLowerCase().includes(term) ||
            i.category.toLowerCase().includes(term) ||
            (i.supplier_source && i.supplier_source.toLowerCase().includes(term))
        );
        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [dashboardData, searchTerm]);

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
    const s = status ? status.toUpperCase() : "AVAILABLE";
    if (s.includes("OUT OF STOCK")) {
      return (
        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-[10px] font-black inline-block">
          Out of Stock
        </span>
      );
    } else if (s.includes("CRITICAL")) {
      return (
        <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[10px] font-black inline-block">
          Critical
        </span>
      );
    } else if (s.includes("LOW STOCK")) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-black inline-block">
          Low Stock
        </span>
      );
    } else if (s.includes("RESERVED")) {
      return (
        <span className="px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-[10px] font-black inline-block">
          Reserved
        </span>
      );
    } else if (s.includes("ISSUED")) {
      return (
        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-xl text-[10px] font-black inline-block">
          Issued
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black inline-block">
          Available
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Range Station Telemetry & Grouped Inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Range Station Inventory Command Center"
        subtitle="Real-time telemetry of equipment stock, field deployment, pending requests, damaged stock, and category balance."
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

      {/* SECTION 4: QUICK ACTIONS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => navigate("/officer/inventory/station-stock")}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            Add / Update Station Stock
          </button>

          <button
            onClick={() => navigate("/officer/inventory/equipment-requests")}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2 transition-all shrink-0"
          >
            <FileCheck className="w-4 h-4 text-emerald-700" />
            Equipment Requests
          </button>

          <button
            onClick={() => navigate("/officer/inventory/issue-equipment")}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2 transition-all shrink-0"
          >
            <Send className="w-4 h-4 text-emerald-700" />
            Issue Equipment
          </button>

          <button
            onClick={() => navigate("/officer/inventory/assigned-equipment")}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-2xl border border-emerald-200 flex items-center gap-2 transition-all shrink-0"
          >
            <UserCheck className="w-4 h-4 text-emerald-700" />
            Assigned Equipment
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all self-end sm:self-auto"
          title="Refresh Dashboard"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: 10 DYNAMIC TOP STATISTICS CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Inventory Items */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Inventory Items</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.total_inventory_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800/70">Station Catalog Items</span>
          </div>
        </div>

        {/* 2. Total Available Stock */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Available Stock</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {cards?.total_available_stock ?? 0} <span className="text-xs font-semibold text-gray-500">Units</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">Ready for Issue</span>
          </div>
        </div>

        {/* 3. Currently Issued Equipment */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-blue-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-950/70">Issued Equipment</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              {cards?.currently_issued_equipment ?? 0} <span className="text-xs font-semibold text-gray-500">Units</span>
            </div>
            <span className="text-[10px] font-bold text-blue-700">Active Field Deployment</span>
          </div>
        </div>

        {/* 4. Pending Equipment Requests */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-purple-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-950/70">Pending Requests</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-950 font-mono">
              {cards?.pending_equipment_requests ?? 0}
            </div>
            <span className="text-[10px] font-bold text-purple-700">Awaiting RFO Review</span>
          </div>
        </div>

        {/* 5. Low Stock Items */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-amber-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950/70">Low Stock Items</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {cards?.low_stock_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-amber-700">At / Below Min Level</span>
          </div>
        </div>

        {/* 6. Out of Stock Items */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-gray-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">Out of Stock</span>
            <div className="p-2 rounded-xl bg-gray-100 text-gray-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800 font-mono">
              {cards?.out_of_stock_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-gray-500">Requires Replenishment</span>
          </div>
        </div>

        {/* 7. Returned Today */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Returned Today</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.returned_today ?? 0}
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">Today</span>
          </div>
        </div>

        {/* 8. Locally Purchased Items (This Month) */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950/70">Local Purchases</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.locally_purchased_this_month ?? 0} <span className="text-xs font-semibold text-gray-500">Units</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">This Month</span>
          </div>
        </div>

        {/* 9. HQ Requested Items Pending */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-blue-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-950/70">HQ Pending</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              {cards?.hq_requested_pending ?? 0}
            </div>
            <span className="text-[10px] font-bold text-blue-700">Awaiting Dispatch</span>
          </div>
        </div>

        {/* 10. Damaged Items */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-red-800/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-950/70">Damaged Items</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-900">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-950 font-mono">
              {cards?.damaged_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-red-700">Needs Repair / Disposal</span>
          </div>
        </div>
      </div>

      {/* SEARCH BAR FOR CATEGORY ACCORDION TABLE */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment, category, vendor source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>
        <span className="text-xs font-extrabold text-emerald-800">
          {filteredCategories.length} Categories Displayed
        </span>
      </div>

      {/* SECTION 2 & 3: CATEGORY-GROUPED COLLAPSIBLE INVENTORY TABLE */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-xs font-semibold text-gray-500">
            No station inventory items match your filter criteria.
          </div>
        ) : (
          filteredCategories.map((group) => {
            const isCollapsed = !!collapsedCategories[group.category_id];

            return (
              <div
                key={group.category_id}
                className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs transition-all"
              >
                {/* Category Accordion Header */}
                <div
                  onClick={() => toggleCategory(group.category_id)}
                  className="p-4 bg-emerald-50/70 hover:bg-emerald-100/50 border-b border-emerald-950/10 flex items-center justify-between cursor-pointer transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-lg bg-emerald-900 text-white shrink-0">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        {group.category_name}
                      </h4>
                      <p className="text-[11px] font-bold text-gray-500">
                        {group.items_count} Equipment Items • Total Available: {group.total_available} Units
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {group.procurement_type === "ADMIN_ONLY" ? (
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-700" /> Admin Only
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> Local Allowed
                      </span>
                    )}
                  </div>
                </div>

                {/* Collapsible Category Items Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                          <th className="px-5 py-3 text-left align-middle">Equipment Name</th>
                          <th className="px-4 py-3 text-center align-middle">Available</th>
                          <th className="px-4 py-3 text-center align-middle">Reserved</th>
                          <th className="px-4 py-3 text-center align-middle">Issued</th>
                          <th className="px-4 py-3 text-center align-middle">Damaged</th>
                          <th className="px-4 py-3 text-center align-middle">Min Level</th>
                          <th className="px-4 py-3 text-center align-middle">Current Stock</th>
                          <th className="px-4 py-3 text-center align-middle">Stock Status</th>
                          <th className="px-4 py-3 text-center align-middle">Last Updated</th>
                          <th className="px-4 py-3 text-center align-middle">Supplier Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                        {group.items.map((row) => (
                          <tr key={row.id} className="hover:bg-emerald-50/20 transition-all">
                            {/* Left Aligned Equipment Name */}
                            <td className="px-5 py-3.5 text-left align-middle font-extrabold text-emerald-950">
                              {row.equipment_name}
                            </td>

                            {/* Center Aligned Available */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-700">
                              {row.available} {row.unit}
                            </td>

                            {/* Center Aligned Reserved */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-extrabold text-blue-900">
                              {row.reserved}
                            </td>

                            {/* Center Aligned Issued */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-extrabold text-purple-900">
                              {row.issued}
                            </td>

                            {/* Center Aligned Damaged */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-extrabold text-red-700">
                              {row.damaged}
                            </td>

                            {/* Center Aligned Minimum Level */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-amber-700">
                              {row.minimum_level}
                            </td>

                            {/* Center Aligned Current Stock */}
                            <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                              {row.current_stock} {row.unit}
                            </td>

                            {/* Center Aligned Stock Status Badge */}
                            <td className="px-4 py-3.5 text-center align-middle">
                              {renderStatusBadge(row.stock_status)}
                            </td>

                            {/* Center Aligned Last Updated */}
                            <td className="px-4 py-3.5 text-center align-middle text-[11px] font-mono font-bold text-gray-500">
                              {formatDate(row.last_updated)}
                            </td>

                            {/* Center Aligned Supplier Source */}
                            <td className="px-4 py-3.5 text-center align-middle text-[11px] font-extrabold text-emerald-900">
                              {row.supplier_source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
