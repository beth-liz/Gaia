import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type {
  InventoryMaster,
  StationInventory,
  InventoryTransaction,
  InventorySummaryReport,
} from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Package,
  Plus,
  Edit2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  History,
  Info,
  Power,
  RefreshCw,
  Search,
  Building2,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export const AdminInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"catalog" | "stations" | "transactions">("catalog");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [masterItems, setMasterItems] = useState<InventoryMaster[]>([]);
  const [stationInventories, setStationInventories] = useState<StationInventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [summaryReport, setSummaryReport] = useState<InventorySummaryReport | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal State for Master Item Creation / Edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryMaster | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Electronics",
    unit: "Units",
    minimum_stock: 5,
    description: "",
  });

  const categories = [
    "Electronics",
    "Surveillance",
    "Optics",
    "Lighting",
    "Vehicles",
    "Medical",
    "Protection",
    "Tactical",
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [masters, stations, txs, summary] = await Promise.all([
        inventoryService.getMasterItems(),
        inventoryService.getAllStationsInventory(),
        inventoryService.getTransactions(),
        inventoryService.getSummaryReport(),
      ]);
      setMasterItems(masters);
      setStationInventories(stations);
      setTransactions(txs);
      setSummaryReport(summary);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      item_name: "",
      category: "Electronics",
      unit: "Units",
      minimum_stock: 5,
      description: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: InventoryMaster) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      unit: item.unit,
      minimum_stock: item.minimum_stock,
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSaveMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryService.updateMasterItem(editingItem.id, formData);
      } else {
        await inventoryService.createMasterItem(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save item definition");
    }
  };

  const handleToggleStatus = async (item: InventoryMaster) => {
    try {
      await inventoryService.toggleMasterItemStatus(item.id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const filteredMasterItems = masterItems.filter((item) => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Inventory Master Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Master Catalog & Monitoring"
        subtitle="Global item definitions, station stock monitoring, and audit log tracking."
        icon={Package}
        badge={`${masterItems.length} Master Items`}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {/* Role Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider text-emerald-900 block mb-0.5">
            Role Architecture Enforcement
          </span>
          As System Administrator, you define global inventory items, set alert thresholds, and audit cross-station transactions. Station stock counts and equipment assignments are directly managed by assigned Range Forest Officers (RFOs).
        </div>
      </div>

      {/* Telemetry Summary Overview */}
      {summaryReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-900 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Master Catalog</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_master_items}</h3>
              <p className="text-[11px] font-semibold text-emerald-700">{summaryReport.total_stations} Stations Linked</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-900 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Total Stock Units</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_items_in_stock}</h3>
              <p className="text-[11px] font-semibold text-blue-800">{summaryReport.total_items_reserved} Reserved / Issued</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-900 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Stock Alerts</p>
              <h3 className="text-2xl font-black text-emerald-950">
                {summaryReport.low_stock_items_count + summaryReport.out_of_stock_items_count}
              </h3>
              <p className="text-[11px] font-semibold text-amber-700">
                {summaryReport.low_stock_items_count} Low Stock, {summaryReport.out_of_stock_items_count} Out
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-900 shrink-0">
              <History className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Damaged Equipment</p>
              <h3 className="text-2xl font-black text-emerald-950">{summaryReport.total_items_damaged}</h3>
              <p className="text-[11px] font-semibold text-red-700">Flagged for writeoff/repair</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-emerald-950/10 gap-2 pb-1">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
            activeTab === "catalog"
              ? "bg-emerald-900 text-amber-300 shadow-md"
              : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
          }`}
        >
          <Package className="w-4 h-4" />
          Master Catalog
        </button>

        <button
          onClick={() => setActiveTab("stations")}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
            activeTab === "stations"
              ? "bg-emerald-900 text-amber-300 shadow-md"
              : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Station Inventories
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
            activeTab === "transactions"
              ? "bg-emerald-900 text-amber-300 shadow-md"
              : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
          }`}
        >
          <History className="w-4 h-4" />
          Audit Log
        </button>
      </div>

      {/* Tab 1: Master Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
                <input
                  type="text"
                  placeholder="Search item or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={fetchData}
                className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                Add Master Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Min Stock</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                  {filteredMasterItems.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                      <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-700" />
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-extrabold">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-800/70">{item.unit}</td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-700">
                        {item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 text-emerald-800/70 text-[11px] max-w-xs truncate">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-700" /> Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                            <Power className="w-3 h-3 text-gray-500" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-[11px] border border-gray-200 transition-all inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] border transition-all inline-flex items-center gap-1 ${
                            item.is_active
                              ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {item.is_active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMasterItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                        No inventory master items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Station Inventories */}
      {activeTab === "stations" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-950/10 flex justify-between items-center">
            <h3 className="font-extrabold text-emerald-950 flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Monitoring Stations Stock Levels
            </h3>
            <span className="text-xs text-emerald-800/70 font-semibold">Live PostgreSQL Stock Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/30 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Station Name</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Total Stock</th>
                  <th className="px-6 py-4">Available</th>
                  <th className="px-6 py-4">Reserved (Issued)</th>
                  <th className="px-6 py-4">Damaged</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {stationInventories.map((st) => (
                  <tr key={st.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{st.station_name}</td>
                    <td className="px-6 py-4 font-bold">{st.item_name}</td>
                    <td className="px-6 py-4 font-mono font-extrabold">{st.current_quantity} {st.unit}</td>
                    <td className="px-6 py-4 font-mono text-emerald-700 font-extrabold">{st.available_quantity}</td>
                    <td className="px-6 py-4 font-mono text-blue-700 font-extrabold">{st.reserved_quantity}</td>
                    <td className="px-6 py-4 font-mono text-red-600 font-extrabold">{st.damaged_quantity}</td>
                    <td className="px-6 py-4">
                      {st.status === "In Stock" && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black">
                          In Stock
                        </span>
                      )}
                      {st.status === "Low Stock" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Low Stock
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

      {/* Tab 3: Transactions Audit Log */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-950/10 flex justify-between items-center">
            <h3 className="font-extrabold text-emerald-950 flex items-center gap-2 text-sm">
              <History className="w-4 h-4 text-emerald-700" />
              Immutable Inventory Audit Log
            </h3>
            <span className="text-xs text-emerald-800/70 font-semibold">Automatic System Transaction Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/30 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Station</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold">{tx.station_name || "N/A"}</td>
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{tx.item_name || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                          tx.transaction_type === "STOCK_ADDED"
                            ? "bg-emerald-100 text-emerald-900"
                            : tx.transaction_type === "ISSUED"
                            ? "bg-blue-100 text-blue-900"
                            : tx.transaction_type === "RETURNED"
                            ? "bg-purple-100 text-purple-900"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black">{tx.quantity}</td>
                    <td className="px-6 py-4 text-xs font-bold">{tx.performer_name || `User #${tx.performed_by}`}</td>
                    <td className="px-6 py-4 text-xs text-emerald-800/70">{tx.assignee_name || "-"}</td>
                    <td className="px-6 py-4 text-[11px] text-emerald-800/70 max-w-xs truncate">{tx.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Master Item Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-700" />
              {editingItem ? "Edit Item Definition" : "Create Master Inventory Item"}
            </h3>

            <form onSubmit={handleSaveMasterItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPS Device, Drone, Walkie Talkie"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Units, Kits, Sets"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Minimum Stock Threshold (Low Stock Alert)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed specifications or equipment usage guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  {editingItem ? "Save Changes" : "Create Master Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
