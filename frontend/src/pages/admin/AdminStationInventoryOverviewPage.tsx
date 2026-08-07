import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import { api } from "@/services/api";
import type {
  AdminInventoryOverviewData,
  AdminPaginatedStationItem,
} from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Warehouse,
  Search,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Info,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Wrench,
  MapPin,
} from "lucide-react";

export const AdminStationInventoryOverviewPage: React.FC = () => {
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Overview Aggregation Data & Paginated Data
  const [overviewData, setOverviewData] = useState<AdminInventoryOverviewData | null>(null);
  const [paginatedData, setPaginatedData] = useState<{
    items: AdminPaginatedStationItem[];
    total_records: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    items: [],
    total_records: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });

  // Hierarchy Filter Data
  const [states, setStates] = useState<{ id: number; state_name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; district_name: string; state_id?: number }[]>([]);
  const [stations, setStations] = useState<{ id: number; station_name: string; district_id?: number }[]>([]);

  // Selected Filters
  const [selectedStateId, setSelectedStateId] = useState<number>(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedStationId, setSelectedStationId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  // Load Overview Aggregation Data
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await inventoryService.getAdminOverview();
      setOverviewData(data);
    } catch (err: any) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Paginated Station Items
  const fetchPaginatedItems = async (pageToFetch: number = 1) => {
    setLoadingItems(true);
    try {
      const res = await inventoryService.getAdminStations({
        state_id: selectedStateId || undefined,
        district_id: selectedDistrictId || undefined,
        station_id: selectedStationId || undefined,
        search: searchTerm || undefined,
        page: pageToFetch,
        page_size: 20,
      });
      setPaginatedData(res);
      setCurrentPage(res.page);
    } catch (err: any) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoadingItems(false);
    }
  };

  // Load Location Hierarchy Options
  const fetchHierarchy = async () => {
    try {
      const [stList, distList, stationList] = await Promise.all([
        api.getStates().catch(() => []),
        api.getDistricts().catch(() => []),
        api.getMonitoringStations().catch(() => []),
      ]);
      setStates(stList);
      setDistricts(distList);
      setStations(stationList.map((s: any) => ({ id: s.id, station_name: s.station_name, district_id: s.district_id })));
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchHierarchy();
  }, []);

  useEffect(() => {
    fetchPaginatedItems(1);
  }, [selectedStateId, selectedDistrictId, selectedStationId, searchTerm]);

  const handleRefreshAll = () => {
    setError(null);
    fetchOverview();
    fetchPaginatedItems(currentPage);
  };

  // Cascading Filter Logic
  const filteredDistricts = useMemo(() => {
    if (!selectedStateId) return districts;
    return districts.filter((d) => d.state_id === selectedStateId);
  }, [districts, selectedStateId]);

  const filteredStations = useMemo(() => {
    if (!selectedDistrictId) return stations;
    return stations.filter((s) => s.district_id === selectedDistrictId);
  }, [stations, selectedDistrictId]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSelectedStateId(val);
    setSelectedDistrictId(0);
    setSelectedStationId(0);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSelectedDistrictId(val);
    setSelectedStationId(0);
  };

  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStationId(Number(e.target.value));
  };

  const cards = overviewData?.cards;

  const renderStockStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase() : "OPTIMAL STOCK";
    if (s.includes("OUT OF STOCK") || s === "OUT OF STOCK") {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-[11px] font-black inline-block">
          Out Of Stock
        </span>
      );
    } else if (s.includes("LOW STOCK") || s === "LOW STOCK") {
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black inline-block">
          Low Stock
        </span>
      );
    } else if (s.includes("DAMAGED") || s === "DAMAGED") {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-900 border border-orange-300 rounded-xl text-[11px] font-black inline-block">
          Damaged
        </span>
      );
    } else if (s.includes("CRITICAL") || s === "CRITICAL") {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[11px] font-black inline-block">
          Critical
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[11px] font-black inline-block">
          Optimal Stock
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Station Inventory Monitoring Overview"
        subtitle="Global monitoring of stock levels, field equipment assignments, damage tracking, and station balance telemetry."
        icon={Warehouse}
        badge="System Admin Read-Only Control"
      />

      {/* Strict Read-Only Scope Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider text-emerald-900 block mb-0.5">
            Admin Monitoring Scope
          </span>
          Admin maintains view-only oversight across all stations. Stock logging, equipment issuing, kit replenishment, and return verifications are performed directly by Range Forest Officers (RFOs) per station.
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {/* SECTION 2: BACKEND AGGREGATED DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stocked Items Card */}
        <div className="p-5 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-950 tracking-wider">Total Stocked Items</span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-900">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          {loadingOverview ? (
            <div className="h-8 bg-gray-200 animate-pulse rounded-xl w-32" />
          ) : (
            <div>
              <div className="text-3xl font-black text-emerald-950">{cards?.total_stocked_items ?? 0} <span className="text-sm font-bold text-gray-500">Units</span></div>
              <p className="text-xs font-bold text-emerald-700 mt-1">Across {cards?.stocked_stations_count ?? 0} Stations</p>
            </div>
          )}
        </div>

        {/* Low Stock Items Card */}
        <div className="p-5 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider">Low Stock Items</span>
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          {loadingOverview ? (
            <div className="h-8 bg-gray-200 animate-pulse rounded-xl w-32" />
          ) : (
            <div>
              <div className="text-3xl font-black text-amber-950">{cards?.low_stock_items_count ?? 0} <span className="text-sm font-bold text-gray-500">Items</span></div>
              <p className="text-xs font-bold text-amber-800 mt-1">{cards?.low_stock_stations_count ?? 0} Stations Affected</p>
            </div>
          )}
        </div>

        {/* Equipment Assigned Card */}
        <div className="p-5 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-blue-950 tracking-wider">Equipment Assigned</span>
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-900">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          {loadingOverview ? (
            <div className="h-8 bg-gray-200 animate-pulse rounded-xl w-32" />
          ) : (
            <div>
              <div className="text-3xl font-black text-blue-950">{cards?.equipment_assigned_count ?? 0} <span className="text-sm font-bold text-gray-500">Equipment Issued</span></div>
              <p className="text-xs font-bold text-blue-800 mt-1">{cards?.guards_equipped_count ?? 0} Guards Equipped</p>
            </div>
          )}
        </div>

        {/* Damaged Equipment Card */}
        <div className="p-5 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-red-950 tracking-wider">Damaged Equipment</span>
            <div className="p-2.5 rounded-2xl bg-red-100 text-red-900">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          {loadingOverview ? (
            <div className="h-8 bg-gray-200 animate-pulse rounded-xl w-32" />
          ) : (
            <div>
              <div className="text-3xl font-black text-red-950">{cards?.damaged_quantity ?? 0} <span className="text-sm font-bold text-gray-500">Damaged Units</span></div>
              <p className="text-xs font-bold text-red-800 mt-1">
                {cards?.under_repair_count ?? 0} Under Repair | {cards?.awaiting_disposal_count ?? 0} Awaiting Disposal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 & 4: INVENTORY BALANCE BY STATION & DISTRIBUTION BY CATEGORY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 3: INVENTORY BALANCE BY STATION (VERTICAL STACK) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-700" />
              Inventory Balance by Station
            </h3>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
              {overviewData?.station_summaries.length ?? 0} Stations
            </span>
          </div>

          {loadingOverview ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 bg-white rounded-3xl border border-emerald-950/10 h-32 animate-pulse" />
              ))}
            </div>
          ) : (overviewData?.station_summaries || []).length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-xs font-semibold text-gray-500">
              No inventory data available across monitoring stations.
            </div>
          ) : (
            <div className="space-y-4">
              {(overviewData?.station_summaries || []).map((stSummary) => {
                const total = stSummary.total_quantity || 1;
                const availPct = Math.round((stSummary.available_quantity / total) * 100);
                const resPct = Math.round((stSummary.reserved_quantity / total) * 100);
                const damPct = Math.round((stSummary.damaged_quantity / total) * 100);

                return (
                  <div
                    key={stSummary.station_id}
                    className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                          {stSummary.station_name}
                        </h4>
                        <p className="text-xs font-semibold text-gray-500">
                          {stSummary.district_name}, {stSummary.state_name} • {stSummary.total_items} Items Defined
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black self-start sm:self-center ${
                          stSummary.health_status === "Healthy"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : stSummary.health_status === "Needs Attention"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-red-100 text-red-900 border border-red-300"
                        }`}
                      >
                        {stSummary.health_status}
                      </span>
                    </div>

                    {/* Progress Bar Stack */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${availPct}%` }} className="bg-emerald-600 h-full" title={`Available: ${stSummary.available_quantity}`} />
                        <div style={{ width: `${resPct}%` }} className="bg-blue-600 h-full" title={`Reserved: ${stSummary.reserved_quantity}`} />
                        <div style={{ width: `${damPct}%` }} className="bg-red-600 h-full" title={`Damaged: ${stSummary.damaged_quantity}`} />
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs font-bold pt-1 gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                          Available: <strong>{stSummary.available_quantity}</strong>
                        </div>

                        <div className="flex items-center gap-1.5 text-blue-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                          Reserved: <strong>{stSummary.reserved_quantity}</strong>
                        </div>

                        <div className="flex items-center gap-1.5 text-red-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                          Damaged: <strong>{stSummary.damaged_quantity}</strong>
                        </div>

                        <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Stock Alerts: <strong>{stSummary.low_stock_alerts}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: INVENTORY DISTRIBUTION BY CATEGORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Category Distribution
            </h3>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
              {overviewData?.category_summary.length ?? 0} Categories
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-4">
            {loadingOverview ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-14 bg-gray-100 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (overviewData?.category_summary || []).length === 0 ? (
              <div className="text-center text-xs font-semibold text-gray-500 py-6">
                No category distribution data available.
              </div>
            ) : (
              (overviewData?.category_summary || []).map((catItem) => (
                <div key={catItem.category_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                    <span>{catItem.category_name}</span>
                    <span className="text-emerald-800">{catItem.share_percentage}%</span>
                  </div>

                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(2, catItem.share_percentage))}%` }}
                      className="h-full bg-emerald-800 rounded-full transition-all"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold text-gray-500">
                    <span>Master Items: <strong className="text-emerald-950">{catItem.master_items_count}</strong></span>
                    <span>Total Quantity: <strong className="text-emerald-950">{catItem.total_quantity} Units</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 7, 8, 9, 10: SEARCH, CASCADING FILTERS, VIEW MODE TOGGLE & TABLE/CARD DATA */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
            <input
              type="text"
              placeholder="Search station, item, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>

          {/* Cascading State Dropdown */}
          <select
            value={selectedStateId}
            onChange={handleStateChange}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value={0}>All States</option>
            {states.map((st) => (
              <option key={st.id} value={st.id}>
                {st.state_name}
              </option>
            ))}
          </select>

          {/* Cascading District Dropdown */}
          <select
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value={0}>All Districts</option>
            {filteredDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.district_name}
              </option>
            ))}
          </select>

          {/* Cascading Station Dropdown */}
          <select
            value={selectedStationId}
            onChange={handleStationChange}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value={0}>All Stations</option>
            {filteredStations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.station_name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle & Refresh Button */}
        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          <div className="p-1 bg-emerald-950/5 rounded-2xl border border-emerald-950/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-gray-500 hover:text-emerald-900"
              }`}
            >
              <List className="w-4 h-4" /> Table View
            </button>

            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                viewMode === "cards"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-gray-500 hover:text-emerald-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Card View
            </button>
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
            title="Refresh Station Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 5 & 6: TABLE VIEW WITH ALIGNMENT & CALCULATED STOCK STATUS BADGES */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4 text-left align-middle">Station Name</th>
                  <th className="px-6 py-4 text-center align-middle">Location</th>
                  <th className="px-6 py-4 text-left align-middle">Item Name</th>
                  <th className="px-6 py-4 text-center align-middle">Total Stock</th>
                  <th className="px-6 py-4 text-center align-middle">Available</th>
                  <th className="px-6 py-4 text-center align-middle">Reserved</th>
                  <th className="px-6 py-4 text-center align-middle">Damaged</th>
                  <th className="px-6 py-4 text-center align-middle">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {loadingItems ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <tr key={n}>
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-6 bg-gray-100 animate-pulse rounded-xl" />
                      </td>
                    </tr>
                  ))
                ) : paginatedData.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                      No inventory data available for selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.items.map((row) => (
                    <tr key={row.id} className="hover:bg-emerald-50/30 transition-all">
                      {/* Left Aligned Station Name */}
                      <td className="px-6 py-4 text-left align-middle font-extrabold text-emerald-950">
                        {row.station_name}
                      </td>

                      {/* Center Aligned Location */}
                      <td className="px-6 py-4 text-center align-middle text-emerald-800/70">
                        {row.district_name}, {row.state_name}
                      </td>

                      {/* Left Aligned Item Name & Category */}
                      <td className="px-6 py-4 text-left align-middle">
                        <div className="font-extrabold text-emerald-950">{row.item_name}</div>
                        <div className="text-[10px] text-emerald-800/60 font-bold">{row.category}</div>
                      </td>

                      {/* Center Aligned Total Stock */}
                      <td className="px-6 py-4 text-center align-middle font-mono font-black text-emerald-950">
                        {row.total_quantity} {row.unit}
                      </td>

                      {/* Center Aligned Available */}
                      <td className="px-6 py-4 text-center align-middle font-mono font-black text-emerald-700">
                        {row.available_quantity} {row.unit}
                      </td>

                      {/* Center Aligned Reserved */}
                      <td className="px-6 py-4 text-center align-middle font-mono font-bold text-blue-800">
                        {row.reserved_quantity} {row.unit}
                      </td>

                      {/* Center Aligned Damaged */}
                      <td className="px-6 py-4 text-center align-middle font-mono font-bold text-red-700">
                        {row.damaged_quantity} {row.unit}
                      </td>

                      {/* Center Aligned Stock Status Badge */}
                      <td className="px-6 py-4 text-center align-middle">
                        {renderStockStatusBadge(row.stock_status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION 12: BACKEND PAGINATION BAR */}
          <div className="p-4 bg-emerald-50/30 border-t border-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-emerald-950">
            <span className="text-emerald-800/70">
              Showing {paginatedData.items.length > 0 ? (paginatedData.page - 1) * paginatedData.page_size + 1 : 0} -{" "}
              {Math.min(paginatedData.page * paginatedData.page_size, paginatedData.total_records)} of {paginatedData.total_records} Records
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1 || loadingItems}
                onClick={() => fetchPaginatedItems(currentPage - 1)}
                className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-emerald-950">
                Page {paginatedData.page} of {paginatedData.total_pages}
              </span>
              <button
                disabled={currentPage >= paginatedData.total_pages || loadingItems}
                onClick={() => fetchPaginatedItems(currentPage + 1)}
                className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 10: CLEAN CARD VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingItems ? (
              [1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-5 bg-white rounded-3xl border border-emerald-950/10 h-44 animate-pulse" />
              ))
            ) : paginatedData.items.length === 0 ? (
              <div className="col-span-3 p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-xs font-semibold text-gray-500">
                No inventory data available for selected filter criteria.
              </div>
            ) : (
              paginatedData.items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-white rounded-3xl border border-emerald-950/10 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-emerald-950">{item.item_name}</h4>
                      <p className="text-[11px] font-bold text-emerald-700">{item.station_name}</p>
                      <span className="text-[10px] text-gray-500 font-semibold">{item.district_name}, {item.state_name}</span>
                    </div>
                    {renderStockStatusBadge(item.stock_status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-emerald-50/50 p-3 rounded-2xl text-center border border-emerald-950/5">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Available</span>
                      <strong className="text-xs font-black text-emerald-900">{item.available_quantity} {item.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Reserved</span>
                      <strong className="text-xs font-black text-blue-900">{item.reserved_quantity} {item.unit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Damaged</span>
                      <strong className="text-xs font-black text-red-900">{item.damaged_quantity} {item.unit}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 border-t border-emerald-950/5 pt-2">
                    <span>Min Stock Threshold: <strong className="text-amber-800">{item.minimum_stock}</strong></span>
                    <span>Total: <strong className="text-emerald-950">{item.total_quantity} {item.unit}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CARD VIEW PAGINATION BAR */}
          <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-emerald-950">
            <span className="text-emerald-800/70">
              Showing {paginatedData.items.length > 0 ? (paginatedData.page - 1) * paginatedData.page_size + 1 : 0} -{" "}
              {Math.min(paginatedData.page * paginatedData.page_size, paginatedData.total_records)} of {paginatedData.total_records} Records
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1 || loadingItems}
                onClick={() => fetchPaginatedItems(currentPage - 1)}
                className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-emerald-950">
                Page {paginatedData.page} of {paginatedData.total_pages}
              </span>
              <button
                disabled={currentPage >= paginatedData.total_pages || loadingItems}
                onClick={() => fetchPaginatedItems(currentPage + 1)}
                className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
