import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryMaster } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Package,
  Plus,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Power,
  RefreshCw,
  Search,
  Loader2,
  ShieldAlert,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

export const AdminInventoryMasterPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [masterItems, setMasterItems] = useState<InventoryMaster[]>([]);

  // Search, Filter, Sort, Pagination states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"item_name" | "category" | "minimum_stock" | "created_at">("item_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryMaster | null>(null);
  const [itemConfirmToggle, setItemConfirmToggle] = useState<InventoryMaster | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Electronics",
    unit: "Units",
    minimum_stock: 5,
    description: "",
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

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
      const masters = await inventoryService.getMasterItems();
      setMasterItems(masters);
    } catch (err: any) {
      setError(err.message || "Failed to load master inventory items");
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
      is_active: true,
    });
    setFormError(null);
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
      is_active: item.is_active,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameClean = formData.item_name.trim();
    if (!nameClean) {
      setFormError("Item name is required.");
      return;
    }

    // Duplicate item name check (client side validation)
    const duplicate = masterItems.find(
      (item) =>
        item.item_name.toLowerCase() === nameClean.toLowerCase() &&
        (!editingItem || item.id !== editingItem.id)
    );
    if (duplicate) {
      setFormError(`An item named "${nameClean}" already exists in master catalog.`);
      return;
    }

    try {
      if (editingItem) {
        await inventoryService.updateMasterItem(editingItem.id, {
          item_name: nameClean,
          category: formData.category,
          unit: formData.unit,
          minimum_stock: formData.minimum_stock,
          description: formData.description,
          is_active: formData.is_active,
        });
        setSuccessMsg(`Inventory master item "${nameClean}" updated successfully.`);
      } else {
        await inventoryService.createMasterItem({
          item_name: nameClean,
          category: formData.category,
          unit: formData.unit,
          minimum_stock: formData.minimum_stock,
          description: formData.description,
        });
        setSuccessMsg(`Inventory master item "${nameClean}" created successfully.`);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save master item.");
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!itemConfirmToggle) return;
    try {
      await inventoryService.toggleMasterItemStatus(itemConfirmToggle.id);
      setSuccessMsg(
        `Item "${itemConfirmToggle.item_name}" has been ${
          itemConfirmToggle.is_active ? "disabled" : "enabled"
        }.`
      );
      setItemConfirmToggle(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to change item status.");
    }
  };

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    let result = masterItems.filter((item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && item.is_active) ||
        (selectedStatus === "DISABLED" && !item.is_active);

      return matchesSearch && matchesCat && matchesStatus;
    });

    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [masterItems, searchTerm, selectedCategory, selectedStatus, sortField, sortOrder]);

  // Pagination Math
  const totalPages = Math.ceil(processedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, currentPage, pageSize]);

  const toggleSort = (field: "item_name" | "category" | "minimum_stock" | "created_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Master Inventory Catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Master Catalog"
        subtitle="Manage global item definitions, unit metrics, minimum threshold alerts, and category classification."
        icon={Package}
        badge={`${masterItems.length} Defined Items`}
      />

      {/* Role Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider text-emerald-900 block mb-0.5">
            Admin Inventory Responsibilities
          </span>
          Admin maintains master catalog definitions and minimum alert thresholds. Admin <strong>does not manage station stock directly</strong>; stock quantities are managed by Range Forest Officers (RFOs) per station.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-800 font-bold text-lg">×</button>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-extrabold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          <button
            onClick={fetchData}
            className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Create Inventory Item
          </button>
        </div>
      </div>

      {/* Master Items Professional Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:bg-emerald-100/50" onClick={() => toggleSort("item_name")}>
                  <div className="flex items-center gap-1">
                    Item Name <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-emerald-100/50" onClick={() => toggleSort("category")}>
                  <div className="flex items-center gap-1">
                    Category <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-emerald-100/50" onClick={() => toggleSort("minimum_stock")}>
                  <div className="flex items-center gap-1">
                    Minimum Stock <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-emerald-100/50" onClick={() => toggleSort("created_at")}>
                  <div className="flex items-center gap-1">
                    Created Date <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div>{item.item_name}</div>
                      {item.description && (
                        <div className="text-[10px] text-emerald-800/60 font-normal truncate max-w-xs">{item.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-extrabold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-emerald-800/70">{item.unit}</td>
                  <td className="px-6 py-4 font-mono font-extrabold text-amber-700">
                    {item.minimum_stock}
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
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-[11px] border border-gray-200 transition-all inline-flex items-center gap-1"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => setItemConfirmToggle(item)}
                      className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] border transition-all inline-flex items-center gap-1 ${
                        item.is_active
                          ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                      title={item.is_active ? "Disable Item" : "Enable Item"}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {item.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No master inventory items match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-emerald-50/30 border-t border-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-emerald-950">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-emerald-950/10 bg-white font-extrabold"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="text-emerald-800/70">
              Showing {processedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(currentPage * pageSize, processedItems.length)} of {processedItems.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-emerald-950">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-xl border border-emerald-950/10 bg-white text-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-700" />
              {editingItem ? "Edit Inventory Master Definition" : "Create Inventory Master Definition"}
            </h3>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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
                  Minimum Stock Threshold (Low Stock Alert) *
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-900 rounded focus:ring-emerald-800"
                />
                <label htmlFor="is_active_check" className="text-xs font-extrabold text-emerald-950">
                  Item Definition Active
                </label>
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

      {/* Confirmation Dialog for Toggle Status */}
      {itemConfirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  Confirm Status Change
                </h3>
                <p className="text-xs text-emerald-800/70 font-medium">
                  {itemConfirmToggle.is_active
                    ? `Are you sure you want to disable "${itemConfirmToggle.item_name}"?`
                    : `Are you sure you want to re-enable "${itemConfirmToggle.item_name}"?`}
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-950 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              {itemConfirmToggle.is_active
                ? "Disabling this master definition will prevent Range Forest Officers from creating new stock additions for this item until re-enabled."
                : "Enabling this item will allow officers to resume stock logging for this item across monitoring stations."}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemConfirmToggle(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-md transition-all ${
                  itemConfirmToggle.is_active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-900 hover:bg-emerald-950"
                }`}
              >
                {itemConfirmToggle.is_active ? "Confirm Disable" : "Confirm Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
