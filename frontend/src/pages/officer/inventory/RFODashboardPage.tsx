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
  ShieldAlert,
  Compass,
  Radio,
  Eye,
  Crosshair,
  Sparkles,
} from "lucide-react";

export const RFODashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<RFOInventoryDashboardData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Collapsible Accordion State per Category ID (COLLAPSED BY DEFAULT: {})
  const [expandedCategories, setExpandedCategories] = useState<Record<string | number, boolean>>({});

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

  const toggleCategory = (catId: string | number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const cards = dashboardData?.cards;

  // Filtered Grouped Categories & Search Auto-expansion
  const filteredCategories = useMemo(() => {
    if (!dashboardData?.grouped_categories) return [];
    if (!searchTerm.trim()) return dashboardData.grouped_categories;

    const term = searchTerm.toLowerCase();
    return dashboardData.grouped_categories
      .map((cat) => {
        const matchingItems = (cat.items || []).filter(
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
      .filter((cat) => cat.items.length > 0 || cat.category_name.toLowerCase().includes(term));
  }, [dashboardData, searchTerm]);

  // Auto expand categories when searching
  useEffect(() => {
    if (searchTerm.trim() && filteredCategories.length > 0) {
      const newExpanded: Record<string | number, boolean> = {};
      filteredCategories.forEach((cat) => {
        newExpanded[cat.category_id] = true;
      });
      setExpandedCategories(newExpanded);
    }
  }, [searchTerm, filteredCategories]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("elec") || name.includes("comm")) return Radio;
    if (name.includes("opti") || name.includes("surv")) return Eye;
    if (name.includes("nav")) return Compass;
    if (name.includes("tool") || name.includes("main")) return Wrench;
    if (name.includes("med")) return Sparkles;
    if (name.includes("safe") || name.includes("prot")) return Crosshair;
    return Layers;
  };

  const renderStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase() : "AVAILABLE";
    if (s.includes("OUT OF STOCK")) {
      return (
        <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[10px] font-black inline-block">
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

  const renderSupplierBadge = (source: string, procType: string) => {
    if (!source || source === "Not Recorded") {
      return (
        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-extrabold italic inline-block">
          Not Recorded
        </span>
      );
    }
    if (source.includes("HQ") || source.includes("Headquarters") || procType === "ADMIN_ONLY") {
      return (
        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-[10px] font-black inline-block">
          {source}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-black inline-block">
        {source}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Range Station Telemetry & Dynamic Categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Range Station Inventory Command Center"
        subtitle="Real-time telemetry of equipment stock, field deployment, pending requests, damaged stock, and dynamic category balance."
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



      {/* REFINED SEMANTIC COLOR PALETTE: 10 STATISTICS TELEMETRY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Inventory Items (🟢 GREEN) */}
        <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Inventory Items</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.total_inventory_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800">Station Catalog Items</span>
          </div>
        </div>

        {/* 2. Total Available Stock (🟢 GREEN) */}
        <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Available Stock</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.total_available_stock ?? 0} <span className="text-xs font-semibold text-emerald-800">Units</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700">Ready for Issue</span>
          </div>
        </div>

        {/* 3. Returned Today (🟢 GREEN) */}
        <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Returned Today</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {cards?.returned_today ?? 0}
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block">Today</span>
          </div>
        </div>

        {/* 4. Currently Issued Equipment (🔵 BLUE) */}
        <div className="p-4 rounded-3xl bg-blue-50/80 border border-blue-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-950">Issued Equipment</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 font-mono">
              {cards?.currently_issued_equipment ?? 0} <span className="text-xs font-semibold text-blue-800">Units</span>
            </div>
            <span className="text-[10px] font-bold text-blue-700">Active Field Deployment</span>
          </div>
        </div>

        {/* 5. Pending Equipment Requests (🟣 PURPLE) */}
        <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-950">Pending Requests</span>
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

        {/* 6. HQ Requested Items Pending (🟣 PURPLE) */}
        <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-950">HQ Pending</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-950 font-mono">
              {cards?.hq_requested_pending ?? 0}
            </div>
            <span className="text-[10px] font-bold text-purple-700">Awaiting Dispatch</span>
          </div>
        </div>

        {/* 7. Low Stock Items (🟠 ORANGE) */}
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">Low Stock Items</span>
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

        {/* 8. Out of Stock Items (🔴 RED) */}
        <div className="p-4 rounded-3xl bg-red-50/80 border border-red-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-950">Out of Stock</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-900">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-950 font-mono">
              {cards?.out_of_stock_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-red-700">Requires Replenishment</span>
          </div>
        </div>

        {/* 9. Damaged Items (🔴 RED) */}
        <div className="p-4 rounded-3xl bg-red-50/80 border border-red-200 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-950">Damaged Items</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-900">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-950 font-mono">
              {cards?.damaged_items ?? 0}
            </div>
            <span className="text-[10px] font-bold text-red-700">Needs Repair / Write Off</span>
          </div>
        </div>

        {/* 10. Locally Purchased Items (This Month) (🟡 YELLOW) */}
        <div className="p-4 rounded-3xl bg-yellow-50/90 border border-yellow-300 shadow-xs flex flex-col justify-between min-h-[120px] hover:border-yellow-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-yellow-950">Local Purchases</span>
            <div className="p-2 rounded-xl bg-yellow-100 text-yellow-900">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-yellow-950 font-mono">
              {cards?.locally_purchased_this_month ?? 0} <span className="text-xs font-semibold text-yellow-800">Units</span>
            </div>
            <span className="text-[10px] font-extrabold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-md inline-block">This Month</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
        <button
          onClick={() => navigate("/officer/inventory/stock")}
          className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-xs border border-emerald-200 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Add / Update Station Stock</span>
        </button>

        <button
          onClick={() => navigate("/officer/inventory/requests")}
          className="w-full py-3.5 px-4 bg-blue-50 hover:bg-blue-100/90 text-blue-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-xs border border-blue-200 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <FileCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Equipment Requests</span>
        </button>

        <button
          onClick={() => navigate("/officer/inventory/issue")}
          className="w-full py-3.5 px-4 bg-purple-50 hover:bg-purple-100/90 text-purple-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-xs border border-purple-200 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <Send className="w-4 h-4 text-purple-700 shrink-0" />
          <span>Issue Equipment</span>
        </button>

        <button
          onClick={() => navigate("/officer/inventory/assigned")}
          className="w-full py-3.5 px-4 bg-yellow-50 hover:bg-yellow-100/90 text-yellow-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-xs border border-yellow-300 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <UserCheck className="w-4 h-4 text-yellow-800 shrink-0" />
          <span>Assigned Equipment</span>
        </button>
      </div>

      {/* SEARCH BAR (TIGHT ZERO GAP DIRECTLY ATTACHED ABOVE CATEGORY LIST) */}
      <div className="p-4 rounded-t-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4 -mb-6 relative z-10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment, category, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-emerald-800">
            {filteredCategories.length} Categories Loaded
          </span>
          <button
            onClick={fetchData}
            className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Station Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* CATEGORY-GROUPED ACCORDION TABLE (COLLAPSED BY DEFAULT) */}
      <div className="space-y-3 pt-6">
        {filteredCategories.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-xs font-semibold text-gray-500">
            No station inventory categories match your search criteria.
          </div>
        ) : (
          filteredCategories.map((group) => {
            const isExpanded = !!expandedCategories[group.category_id];
            const CategoryIcon = getCategoryIcon(group.category_name);

            return (
              <div
                key={group.category_id}
                className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs transition-all"
              >
                {/* Category Accordion Header (Collapsed View by Default) */}
                <div
                  onClick={() => toggleCategory(group.category_id)}
                  className="p-4 bg-emerald-50/70 hover:bg-emerald-100/60 border-b border-emerald-950/10 flex items-center justify-between cursor-pointer transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-900 text-white shrink-0 shadow-xs">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
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
                        <Lock className="w-3 h-3 text-purple-700" /> HQ Controlled
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> Station Purchase
                      </span>
                    )}

                    <div className="p-1 rounded-lg text-emerald-950 transition-transform">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Category Items Table (Hidden when collapsed) */}
                {isExpanded && (
                  <div className="overflow-x-auto animate-in fade-in duration-150">
                    {group.items.length === 0 ? (
                      <div className="p-6 text-center text-xs font-semibold text-gray-400 italic">
                        No equipment items registered under {group.category_name}.
                      </div>
                    ) : (
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

                              {/* Center Aligned Supplier Source Badge */}
                              <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                                {renderSupplierBadge(row.supplier_source, group.procurement_type)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
