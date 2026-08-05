import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import { api } from "@/services/api";
import type { StationInventory, InventorySummaryReport } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Warehouse,
  Search,
  AlertTriangle,
  XCircle,
  Layers,
  ShieldAlert,
  History,
  Info,
  Loader2,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";

interface DistrictItem {
  id: number;
  district_name: string;
  state_name?: string;
}

interface StateItem {
  id: number;
  state_name: string;
}

export const AdminStationInventoryOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [stationInventories, setStationInventories] = useState<StationInventory[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [summaryReport, setSummaryReport] = useState<InventorySummaryReport | null>(null);

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stData, summaryData, distData, stateData] = await Promise.all([
        inventoryService.getAllStationsInventory(),
        inventoryService.getSummaryReport(),
        api.getDistricts(),
        api.getStates(),
      ]);
      setStationInventories(stData);
      setSummaryReport(summaryData);
      setDistricts(distData);
      setStates(stateData);
    } catch (err: any) {
      setError(err.message || "Failed to load station inventory overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered station inventory items
  const filteredInventories = useMemo(() => {
    return stationInventories.filter((st) => {
      const matchesSearch =
        !searchTerm ||
        (st.station_name && st.station_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (st.item_name && st.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (st.category && st.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDistrict =
        selectedDistrict === "ALL" ||
        (st.district_name && st.district_name === selectedDistrict) ||
        (st.district_id && st.district_id.toString() === selectedDistrict);

      const matchesState =
        selectedState === "ALL" || (st.state_name && st.state_name === selectedState);

      return matchesSearch && matchesDistrict && matchesState;
    });
  }, [stationInventories, searchTerm, selectedDistrict, selectedState]);

  // Grouped by station
  const stationGroups = useMemo(() => {
    const map = new Map<string, {
      station_id: number;
      station_name: string;
      district_name: string;
      state_name: string;
      items: StationInventory[];
      total_items_count: number;
      available_sum: number;
      reserved_sum: number;
      damaged_sum: number;
      low_stock_count: number;
      out_of_stock_count: number;
    }>();

    filteredInventories.forEach((item) => {
      const key = item.station_name || `Station #${item.station_id}`;
      if (!map.has(key)) {
        map.set(key, {
          station_id: item.station_id,
          station_name: key,
          district_name: item.district_name || "Wayanad",
          state_name: item.state_name || "Kerala",
          items: [],
          total_items_count: 0,
          available_sum: 0,
          reserved_sum: 0,
          damaged_sum: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
        });
      }

      const group = map.get(key)!;
      group.items.push(item);
      group.total_items_count += 1;
      group.available_sum += item.available_quantity;
      group.reserved_sum += item.reserved_quantity;
      group.damaged_sum += item.damaged_quantity;

      if (item.status === "Low Stock") group.low_stock_count += 1;
      if (item.status === "Out of Stock") group.out_of_stock_count += 1;
    });

    return Array.from(map.values());
  }, [filteredInventories]);

  // Category Distribution Math
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { count: number; totalQty: number }>();
    filteredInventories.forEach((item) => {
      const cat = item.category || "General";
      if (!catMap.has(cat)) {
        catMap.set(cat, { count: 0, totalQty: 0 });
      }
      const c = catMap.get(cat)!;
      c.count += 1;
      c.totalQty += item.current_quantity;
    });

    const total = filteredInventories.length || 1;
    return Array.from(catMap.entries()).map(([cat, val]) => ({
      category: cat,
      count: val.count,
      totalQty: val.totalQty,
      percentage: Math.round((val.count / total) * 100),
    }));
  }, [filteredInventories]);

  // Low stock items alert list
  const lowStockAlertsList = useMemo(() => {
    return filteredInventories.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock");
  }, [filteredInventories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Cross-Station Inventory Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Inventory Overview"
        subtitle="Read-only monitoring of stock levels, equipment allocations, and stock alerts across all monitoring stations."
        icon={Warehouse}
        badge={`${stationGroups.length} Active Stations`}
      />

      {/* Read Only Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider text-emerald-900 block mb-0.5">
            Read-Only Station Telemetry
          </span>
          This dashboard displays live PostgreSQL inventory balances across stations. Admin does not manage or edit station stock directly. Stock additions, equipment issues, and returns are executed by Range Forest Officers (RFOs).
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {/* Analytics Metric Cards Grid */}
      {summaryReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-900 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Total Stocked Items</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_items_in_stock}</h3>
              <p className="text-[11px] font-semibold text-emerald-700">Across {stationGroups.length} Stations</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-900 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Low Stock Items</p>
              <h3 className="text-2xl font-black text-emerald-950">
                {summaryReport.low_stock_items_count + summaryReport.out_of_stock_items_count}
              </h3>
              <p className="text-[11px] font-semibold text-amber-700">
                {summaryReport.low_stock_items_count} Low, {summaryReport.out_of_stock_items_count} Out of Stock
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-900 shrink-0">
              <Warehouse className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Equipment Assigned</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_items_reserved}</h3>
              <p className="text-[11px] font-semibold text-blue-700">Issued to Field Guards</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-900 shrink-0">
              <History className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Damaged Equipment</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_items_damaged}</h3>
              <p className="text-[11px] font-semibold text-red-700">Out of Service</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Visual Breakdown Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Inventory Stock & Reservation by Station */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-emerald-950/10 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-700" />
              Inventory Balance by Station
            </h3>
            <span className="text-[11px] font-extrabold text-emerald-800/70">Available vs Reserved</span>
          </div>

          <div className="space-y-3 pt-1">
            {stationGroups.map((group) => {
              const maxQty = Math.max(1, group.available_sum + group.reserved_sum + group.damaged_sum);
              const availWidth = Math.round((group.available_sum / maxQty) * 100);
              const resWidth = Math.round((group.reserved_sum / maxQty) * 100);

              return (
                <div key={group.station_name} className="space-y-1 text-xs font-semibold text-emerald-950">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold">{group.station_name}</span>
                    <span className="font-mono text-[11px] text-emerald-800">
                      {group.available_sum} Available | {group.reserved_sum} Reserved | {group.damaged_sum} Damaged
                    </span>
                  </div>

                  <div className="w-full bg-emerald-950/5 h-3 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-700 h-full transition-all"
                      style={{ width: `${availWidth}%` }}
                      title={`Available: ${group.available_sum}`}
                    />
                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{ width: `${resWidth}%` }}
                      title={`Reserved: ${group.reserved_sum}`}
                    />
                  </div>
                </div>
              );
            })}
            {stationGroups.length === 0 && (
              <p className="text-xs text-emerald-800/60 font-medium py-4 text-center">No station telemetry available.</p>
            )}
          </div>
        </div>

        {/* Chart 2: Category Distribution Breakdown */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-emerald-950/10 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Inventory Distribution by Category
            </h3>
            <span className="text-[11px] font-extrabold text-emerald-800/70">Category Shares</span>
          </div>

          <div className="space-y-3 pt-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="space-y-1 text-xs font-semibold text-emerald-950">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold">{cat.category}</span>
                  <span className="font-mono text-[11px] text-emerald-800">
                    {cat.count} Items ({cat.totalQty} Units) - {cat.percentage}%
                  </span>
                </div>
                <div className="w-full bg-emerald-950/5 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-800 h-full transition-all" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="text-xs text-emerald-800/60 font-medium py-4 text-center">No category metrics logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Station */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
            <input
              type="text"
              placeholder="Search station or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>

          {/* Filter by District */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.district_name}>
                {d.district_name}
              </option>
            ))}
          </select>

          {/* Filter by State */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.state_name}>
                {s.state_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          <div className="flex items-center p-1 bg-emerald-950/5 border border-emerald-950/10 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "cards" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-800/70"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "table" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-800/70"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Low Stock Restock Alerts List (If any) */}
      {lowStockAlertsList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Station Restock Warning Alerts ({lowStockAlertsList.length} Items Below Threshold)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-semibold">
            {lowStockAlertsList.map((item) => (
              <div key={item.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-amber-950">{item.item_name}</span>
                  <span className="text-[10px] text-amber-800 block">{item.station_name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    item.status === "Out of Stock" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {item.available_quantity} {item.unit} (Min: {item.minimum_stock})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards View Mode */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stationGroups.map((group) => (
            <div
              key={group.station_name}
              className="bg-white rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs"
            >
              <div className="flex justify-between items-start border-b border-emerald-950/10 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-emerald-700 shrink-0" />
                    {group.station_name}
                  </h3>
                  <span className="text-xs text-emerald-800/70 font-semibold">
                    {group.district_name}, {group.state_name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {group.out_of_stock_count > 0 ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                      ⚠ Out of Stock Alerts ({group.out_of_stock_count})
                    </span>
                  ) : group.low_stock_count > 0 ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                      ⚠ Low Stock Alerts ({group.low_stock_count})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-900">
                      Optimal Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Station Summary Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div className="p-2.5 bg-emerald-50/60 rounded-2xl border border-emerald-950/5">
                  <span className="text-[10px] uppercase font-black text-emerald-800/70 block">Total Items</span>
                  <span className="text-lg font-black text-emerald-950">{group.total_items_count}</span>
                </div>

                <div className="p-2.5 bg-emerald-100/50 rounded-2xl border border-emerald-950/5">
                  <span className="text-[10px] uppercase font-black text-emerald-800/70 block">Available</span>
                  <span className="text-lg font-black text-emerald-700">{group.available_sum}</span>
                </div>

                <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-200/50">
                  <span className="text-[10px] uppercase font-black text-blue-800/70 block">Reserved</span>
                  <span className="text-lg font-black text-blue-700">{group.reserved_sum}</span>
                </div>

                <div className="p-2.5 bg-red-50 rounded-2xl border border-red-200/50">
                  <span className="text-[10px] uppercase font-black text-red-800/70 block">Damaged</span>
                  <span className="text-lg font-black text-red-600">{group.damaged_sum}</span>
                </div>
              </div>

              {/* Station Inventory Items List */}
              <div className="space-y-2 pt-2 border-t border-emerald-950/5">
                <h4 className="text-[11px] font-black uppercase text-emerald-950 tracking-wider">
                  Station Stock Breakdown ({group.items.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-emerald-950/5 rounded-xl flex items-center justify-between text-xs font-semibold"
                    >
                      <div>
                        <span className="font-extrabold text-emerald-950">{item.item_name}</span>
                        <span className="text-[10px] text-emerald-800/60 ml-2 font-normal">({item.category})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold">
                          {item.available_quantity} / {item.current_quantity} {item.unit}
                        </span>
                        {item.status === "In Stock" && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-bold">
                            In Stock
                          </span>
                        )}
                        {item.status === "Low Stock" && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold">
                            Low Stock
                          </span>
                        )}
                        {item.status === "Out of Stock" && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
                            Out
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {stationGroups.length === 0 && (
            <div className="col-span-2 p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-emerald-800/60 font-medium">
              No monitoring stations found matching your search or location filters.
            </div>
          )}
        </div>
      )}

      {/* Detailed Table View Mode */}
      {viewMode === "table" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Station Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Total Stock</th>
                  <th className="px-6 py-4">Available</th>
                  <th className="px-6 py-4">Reserved (Issued)</th>
                  <th className="px-6 py-4">Damaged</th>
                  <th className="px-6 py-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {filteredInventories.map((st) => (
                  <tr key={st.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{st.station_name}</td>
                    <td className="px-6 py-4 text-emerald-800/70 text-[11px]">
                      {st.district_name || "Wayanad"}, {st.state_name || "Kerala"}
                    </td>
                    <td className="px-6 py-4 font-bold">{st.item_name}</td>
                    <td className="px-6 py-4 font-mono font-extrabold">{st.current_quantity} {st.unit}</td>
                    <td className="px-6 py-4 font-mono text-emerald-700 font-extrabold">{st.available_quantity}</td>
                    <td className="px-6 py-4 font-mono text-blue-700 font-extrabold">{st.reserved_quantity}</td>
                    <td className="px-6 py-4 font-mono text-red-600 font-extrabold">{st.damaged_quantity}</td>
                    <td className="px-6 py-4">
                      {st.status === "In Stock" && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black">
                          Optimal Stock
                        </span>
                      )}
                      {st.status === "Low Stock" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Low Stock Alert
                        </span>
                      )}
                      {st.status === "Out of Stock" && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" /> Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
