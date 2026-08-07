import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { InventoryMaster, InventoryCategory } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Power,
  RefreshCw,
  Search,
  Loader2,
  ShieldAlert,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
} from "lucide-react";

interface SummaryMetrics {
  total_items: number;
  active_items: number;
  disabled_items: number;
  categories_counts: Record<string, number>;
}

export const AdminInventoryMasterPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  const [masterItems, setMasterItems] = useState<InventoryMaster[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);

  // Search, Filter, Sort, Pagination states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"item_name" | "category" | "minimum_stock" | "created_at">("item_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryMaster | null>(null);
  const [itemConfirmToggle, setItemConfirmToggle] = useState<InventoryMaster | null>(null);
  const [itemConfirmDelete, setItemConfirmDelete] = useState<InventoryMaster | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    item_name: "",
    category_id: 0,
    category: "",
    unit: "Units",
    minimum_stock: 5,
    description: "",
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mastersRes, catsRes, summaryRes] = await Promise.all([
        inventoryService.getMasterItems(),
        inventoryService.getCategories(),
        inventoryService.getMasterSummary().catch(() => null),
      ]);
      setMasterItems(mastersRes);
      setCategories(catsRes);
      if (summaryRes) {
        setSummary(summaryRes);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Server error")) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(msg || "Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const defaultCat = categories.length > 0 ? categories[0] : null;
    setFormData({
      item_name: "",
      category_id: defaultCat ? defaultCat.id : 0,
      category: defaultCat ? defaultCat.name : "Electronics",
      unit: "Units",
      minimum_stock: 5,
      description: "",
      is_active: true,
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (item: InventoryMaster) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category_id: item.category_id || 0,
      category: item.category || "Electronics",
      unit: item.unit,
      minimum_stock: item.minimum_stock,
      description: item.description || "",
      is_active: item.is_active,
    });
    setFormError(null);
    setShowFormModal(true);
  };

  const handleSaveMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameClean = formData.item_name.trim();
    if (!nameClean) {
      setFormError("Item name is required and cannot be empty.");
      return;
    }

    if (!formData.category_id && !formData.category) {
      setFormError("Category is required.");
      return;
    }

    if (!formData.unit || !formData.unit.trim()) {
      setFormError("Unit is required.");
      return;
    }

    if (formData.minimum_stock <= 0) {
      setFormError("Minimum stock threshold must be greater than zero.");
      return;
    }

    try {
      if (editingItem) {
        await inventoryService.updateMasterItem(editingItem.id, {
          item_name: nameClean,
          category_id: formData.category_id || undefined,
          category: formData.category,
          unit: formData.unit.trim(),
          minimum_stock: formData.minimum_stock,
          description: formData.description.trim(),
          is_active: formData.is_active,
        });
        showToast("✅ Inventory item updated successfully.", "success");
      } else {
        await inventoryService.createMasterItem({
          item_name: nameClean,
          category_id: formData.category_id || undefined,
          category: formData.category,
          unit: formData.unit.trim(),
          minimum_stock: formData.minimum_stock,
          description: formData.description.trim(),
        });
        showToast("✅ Inventory item created successfully.", "success");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already exists") || msg.includes("Conflict") || msg.includes("409")) {
        setFormError("Inventory item already exists.");
      } else if (msg.includes("Failed to fetch")) {
        setFormError("Unable to connect to the server. Please try again.");
      } else {
        setFormError(msg || "Failed to save master item definition.");
      }
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!itemConfirmToggle) return;
    try {
      const isCurrentlyActive = itemConfirmToggle.is_active;
      await inventoryService.toggleMasterItemStatus(itemConfirmToggle.id);
      if (isCurrentlyActive) {
        showToast("✅ Item disabled successfully.", "success");
      } else {
        showToast("✅ Item enabled successfully.", "success");
      }
      setItemConfirmToggle(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Unable to connect to the server. Please try again.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemConfirmDelete) return;
    setDeleting(true);
    try {
      await inventoryService.deleteMasterItem(itemConfirmDelete.id);
      showToast("✅ Inventory item permanently deleted.", "success");
      setItemConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already in use") || msg.includes("referenced")) {
        showToast("This inventory item is already in use and cannot be deleted.", "error");
      } else {
        showToast(msg || "Unable to connect to the server. Please try again.", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    let result = (masterItems || []).filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.item_name.toLowerCase().includes(term) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.unit && item.unit.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term));
      
      const matchesCat =
        selectedCategory === "ALL" ||
        item.category === selectedCategory ||
        item.category_name === selectedCategory;

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory Master Catalog"
        subtitle="Maintain global item definitions, unit standards, threshold alert criteria, and DB category definitions."
        icon={Package}
        badge={`${masterItems.length} Master Catalog Definitions`}
      />

      {/* Role Responsibilities Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-extrabold uppercase tracking-wider text-emerald-900 block mb-0.5">
            Admin Inventory Master Scope
          </span>
          Admin is strictly responsible for maintaining <strong>Master Item Definitions</strong> and minimum alert thresholds. Stock quantities per station are managed independently by Range Forest Officers (RFOs).
        </div>
      </div>

      {/* Global Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg transition-all ${
            toastMsg.type === "success"
              ? "bg-emerald-900 text-white border-emerald-950"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white hover:opacity-80 font-black text-base ml-4">
            ×
          </button>
        </div>
      )}

      {/* Page Level Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {/* SECTION 2: DYNAMIC SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-gray-500">Total Items</span>
          <div className="text-2xl font-black text-emerald-950 mt-1">{summary?.total_items ?? masterItems.length}</div>
          <span className="text-[10px] text-emerald-700 font-bold mt-1">Master Definitions</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-emerald-800">Active Items</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {summary?.active_items ?? masterItems.filter((i) => i.is_active).length}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1">Available for Stocking</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-gray-400">Disabled Items</span>
          <div className="text-2xl font-black text-gray-600 mt-1">
            {summary?.disabled_items ?? masterItems.filter((i) => !i.is_active).length}
          </div>
          <span className="text-[10px] text-gray-400 font-bold mt-1">Inactive Definitions</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-purple-900">Refillable Kits</span>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {(summary as any)?.refillable_kits ??
              masterItems.filter((i) => {
                const c = (i.category || i.category_name || "").toLowerCase();
                return c.includes("refill") || c.includes("kit") || i.requires_refill || i.is_refillable || i.item_type === "KIT";
              }).length}
          </div>
          <span className="text-[10px] text-purple-700 font-bold mt-1">Emergency Kits</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-amber-800">Consumables</span>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {(summary as any)?.consumables ??
              masterItems.filter((i) => {
                const c = (i.category || i.category_name || "").toLowerCase();
                return c.includes("consumable") || i.consumable || i.item_type === "CONSUMABLE" || i.item_usage_type === "CONSUMABLE";
              }).length}
          </div>
          <span className="text-[10px] text-amber-700 font-bold mt-1">Expending Stock</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-950/10 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-blue-800">Electronics / Tech</span>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {(summary as any)?.electronics ??
              masterItems.filter((i) => {
                const c = (i.category || i.category_name || "").toLowerCase();
                return ["electronic", "surveillance", "communication", "optics", "lighting", "tech", "device", "asset"].some(k => c.includes(k));
              }).length}
          </div>
          <span className="text-[10px] text-blue-700 font-bold mt-1">Field Devices</span>
        </div>
      </div>

      {/* SECTION 13 & 14: SEARCH, FILTERS & ACTION TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
            <input
              type="text"
              placeholder="Search item, category, unit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
            />
          </div>

          {/* Dynamic DB Category Filter */}
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
              <option key={c.id} value={c.name}>
                {c.name}
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

      {/* SECTION 1 & 3: MASTER ITEMS TABLE WITH PERFECT ALIGNMENT & DD MMM YYYY DATE */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th
                  className="px-6 py-4 text-left align-middle cursor-pointer hover:bg-emerald-100/50"
                  onClick={() => toggleSort("item_name")}
                >
                  <div className="flex items-center gap-1">
                    Item Name <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-center align-middle cursor-pointer hover:bg-emerald-100/50"
                  onClick={() => toggleSort("category")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Category <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center align-middle">Unit</th>
                <th
                  className="px-6 py-4 text-center align-middle cursor-pointer hover:bg-emerald-100/50"
                  onClick={() => toggleSort("minimum_stock")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Minimum Stock <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center align-middle">Status</th>
                <th
                  className="px-6 py-4 text-center align-middle cursor-pointer hover:bg-emerald-100/50"
                  onClick={() => toggleSort("created_at")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Created Date <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                  {/* Left Aligned Item Name & Subtitle */}
                  <td className="px-6 py-4 text-left align-middle font-extrabold text-emerald-950 flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div className="text-emerald-950 font-black">{item.item_name}</div>
                      {item.description ? (
                        <div className="text-[10px] text-emerald-800/60 font-normal truncate max-w-xs">{item.description}</div>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-normal italic">No description provided</div>
                      )}
                    </div>
                  </td>

                  {/* Centered Category & Procurement Rule */}
                  <td className="px-6 py-4 text-center align-middle">
                    <div className="flex flex-col items-center gap-1">
                      <span className="px-3 py-1 bg-emerald-100/70 text-emerald-950 rounded-xl text-[11px] font-black inline-block">
                        {item.category || item.category_name || "Unassigned"}
                      </span>
                      {item.procurement_type === "ADMIN_ONLY" ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-black inline-block">
                          ADMIN_ONLY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-black inline-block">
                          LOCAL_ALLOWED
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Centered Unit */}
                  <td className="px-6 py-4 text-center align-middle font-bold text-emerald-900">
                    {item.unit}
                  </td>

                  {/* Centered Minimum Stock */}
                  <td className="px-6 py-4 text-center align-middle font-mono font-black text-amber-700">
                    {item.minimum_stock}
                  </td>

                  {/* Centered Status */}
                  <td className="px-6 py-4 text-center align-middle">
                    {item.is_active ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                        <Power className="w-3 h-3 text-gray-500" /> Disabled
                      </span>
                    )}
                  </td>

                  {/* Centered Created Date DD MMM YYYY */}
                  <td className="px-6 py-4 text-center align-middle text-[11px] font-mono text-emerald-800/70 font-bold">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Centered Action Buttons */}
                  <td className="px-6 py-4 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-[11px] border border-gray-200 transition-all inline-flex items-center gap-1"
                        title="Edit Item Definition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-800" /> Edit
                      </button>

                      {/* Disable / Enable Button */}
                      <button
                        onClick={() => setItemConfirmToggle(item)}
                        className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] border transition-all inline-flex items-center gap-1 ${
                          item.is_active
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                        title={item.is_active ? "Disable Item" : "Enable Item"}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {item.is_active ? "Disable" : "Enable"}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setItemConfirmDelete(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-[11px] transition-all inline-flex items-center gap-1"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete
                      </button>
                    </div>
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

      {/* SECTION 5: CREATE / EDIT MASTER ITEM MODAL WITH INLINE VALIDATION */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                {editingItem ? "Edit Master Definition" : "Create Inventory Item"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
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
                  placeholder="e.g. GPS Device, Drone, Machete, Flashlight"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Dynamic DB Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id || formData.category}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matchedCat = categories.find((c) => String(c.id) === selectedVal || c.name === selectedVal);
                      if (matchedCat) {
                        setFormData({
                          ...formData,
                          category_id: matchedCat.id,
                          category: matchedCat.name,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          category: selectedVal,
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                    placeholder="e.g. Units, Sets, Kits, Boxes"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Minimum Stock Alert Threshold *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
                <p className="text-[10px] text-gray-500 font-medium mt-1">Must be greater than 0.</p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Technical specifications, field handling instructions..."
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
                <label htmlFor="is_active_check" className="text-xs font-extrabold text-emerald-950 cursor-pointer">
                  Item Active (Available for Station Stocking)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  {editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 9: GAIA CONFIRMATION DIALOG FOR DISABLE / ENABLE */}
      {itemConfirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl shrink-0 ${itemConfirmToggle.is_active ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  {itemConfirmToggle.is_active ? "Disable Inventory Item?" : "Enable Inventory Item?"}
                </h3>
                <p className="text-xs text-emerald-800/70 font-medium">
                  Item: <strong>{itemConfirmToggle.item_name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-950 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 leading-relaxed font-medium">
              This item will become unavailable for future inventory operations but existing records will remain.
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
                className={`px-5 py-2 text-white text-xs font-extrabold rounded-xl shadow-md transition-all ${
                  itemConfirmToggle.is_active ? "bg-amber-800 hover:bg-amber-900" : "bg-emerald-900 hover:bg-emerald-950"
                }`}
              >
                {itemConfirmToggle.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8 & 9: GAIA CONFIRMATION DIALOG FOR DELETE */}
      {itemConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  Delete Inventory Item?
                </h3>
                <p className="text-xs text-emerald-800/70 font-medium">
                  Item: <strong>{itemConfirmDelete.item_name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-red-950 bg-red-50 p-3.5 rounded-2xl border border-red-200 leading-relaxed font-medium">
              This action permanently removes this inventory item. This cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setItemConfirmDelete(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
