import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { StationInventory } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Warehouse,
  PlusCircle,
  RefreshCw,
  Search,
  History as HistoryIcon,
  Send,
  Loader2,
  Building2,
  ShoppingCart,
  LayoutGrid,
  List,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

export const RFOStationStockPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [inventoryList, setInventoryList] = useState<StationInventory[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [hqControlledAssets, setHqControlledAssets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // VIEW MODE TOGGLE (DEFAULT: "card")
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [showHQRequestModal, setShowHQRequestModal] = useState<boolean>(false);
  const [showUpdateQtyModal, setShowUpdateQtyModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<StationInventory | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Add Local Stock Form State
  const [addStockForm, setAddStockForm] = useState({
    inventory_master_id: 0,
    quantity: 1,
    vendor_name: "",
    purchase_date: new Date().toISOString().split("T")[0],
    invoice_number: "",
    remarks: "",
  });

  // HQ Request Form State
  const [hqRequestForm, setHqRequestForm] = useState({
    inventory_master_id: 0,
    quantity: 1,
    priority: "MEDIUM",
    reason: "",
    remarks: "",
  });

  // Update Qty Form State
  const [updateQtyForm, setUpdateQtyForm] = useState({
    new_available_qty: 0,
    remarks: "Manual Stock Audit Adjustment",
  });

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
      const [inv, masters, hqAssets] = await Promise.all([
        inventoryService.getMyStationInventory(),
        inventoryService.getInventoryMasters(),
        inventoryService.getHQControlledAssets(),
      ]);
      setInventoryList(inv);
      setMasterCatalog(masters);
      setHqControlledAssets(hqAssets);
    } catch (err: any) {
      setError(err.message || "Failed to load station stock levels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Field helper methods to guarantee database binding without dummy fallbacks
  const getItemName = (item: StationInventory): string => {
    return item.equipment_name || item.item_name || item.master_item?.item_name || "Equipment";
  };

  const getCategoryName = (item: StationInventory): string => {
    return item.category_name || item.category || item.master_item?.category || "General Equipment";
  };

  // Strictly procurement-source based helper for HQ classification (No Category Filtering)
  const isHQItem = (item: StationInventory): boolean => {
    const procType = item.procurement_type || item.master_item?.category_rel?.procurement_type || "";
    if (procType === "ADMIN_ONLY") return true;

    const source = (item.supplier_source || item.supplier || item.master_item?.purchase_source || "").toUpperCase();
    if (source.includes("HQ") || source.includes("HEADQUARTER") || source.includes("ALLOCATION")) {
      return true;
    }

    return false;
  };

  const getSupplierSource = (item: StationInventory): string => {
    if (item.supplier_source && item.supplier_source.trim()) return item.supplier_source;
    if (item.supplier && item.supplier.trim()) return item.supplier;
    return isHQItem(item) ? "HQ Allocation" : "Station Purchase";
  };

  // Filtered List & Split into HQ vs Local Sections
  const safeList = useMemo(() => (Array.isArray(inventoryList) ? inventoryList : []), [inventoryList]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return safeList;
    const term = searchTerm.toLowerCase();
    return safeList.filter((item) => {
      const name = getItemName(item);
      const cat = getCategoryName(item);
      const supplier = getSupplierSource(item);
      return (
        name.toLowerCase().includes(term) ||
        cat.toLowerCase().includes(term) ||
        supplier.toLowerCase().includes(term)
      );
    });
  }, [safeList, searchTerm]);

  // Section 1: HQ Issued Equipment (Filtered STRICTLY by Procurement Source)
  const hqIssuedSection = useMemo(() => {
    return filteredItems.filter((item) => isHQItem(item));
  }, [filteredItems]);

  // Section 2: Local Purchase Items (Filtered STRICTLY by Procurement Source)
  const localPurchaseSection = useMemo(() => {
    return filteredItems.filter((item) => !isHQItem(item));
  }, [filteredItems]);

  // HQ Master Catalog Options for HQ Modal (HQ Controlled Only)
  const hqMasterOptions = useMemo(() => {
    return hqControlledAssets;
  }, [hqControlledAssets]);

  // Local Master Catalog Options for Add Stock Modal (Local Purchases Only)
  const localMasterOptions = useMemo(() => {
    return masterCatalog.filter((m) => {
      const procType = m.procurement_type || "LOCAL_ALLOWED";
      return procType !== "ADMIN_ONLY";
    });
  }, [masterCatalog]);

  const selectedHQAsset = useMemo(() => {
    return hqMasterOptions.find((m) => m.id === hqRequestForm.inventory_master_id) || null;
  }, [hqMasterOptions, hqRequestForm.inventory_master_id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase() : "AVAILABLE";
    if (s.includes("OUT OF STOCK")) {
      return (
        <span className="px-2.5 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[10px] font-black inline-block">
          Out of Stock
        </span>
      );
    } else if (s.includes("LOW STOCK") || s.includes("CRITICAL")) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-black inline-block">
          Low Stock
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

  // Submit Handlers
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockForm.inventory_master_id || addStockForm.quantity <= 0) {
      alert("Please select an equipment item and enter a valid quantity.");
      return;
    }
    setSubmitting(true);
    try {
      await inventoryService.addStationStock({
        inventory_master_id: addStockForm.inventory_master_id,
        quantity: addStockForm.quantity,
        procurement_source: "LOCAL_PURCHASE",
        vendor_name: addStockForm.vendor_name || "Station Local Vendor",
        purchase_date: addStockForm.purchase_date,
        invoice_number: addStockForm.invoice_number || undefined,
        remarks: addStockForm.remarks || "Station Local Purchase Stock Addition",
      });

      showToast("Stock Updated Successfully", "success");
      setShowAddStockModal(false);
      setAddStockForm({
        inventory_master_id: 0,
        quantity: 1,
        vendor_name: "",
        purchase_date: new Date().toISOString().split("T")[0],
        invoice_number: "",
        remarks: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add local stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHQRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hqRequestForm.inventory_master_id || hqRequestForm.quantity <= 0) {
      alert("Please select an HQ equipment item and enter a valid quantity.");
      return;
    }
    if (selectedHQAsset) {
      if (selectedHQAsset.total_quantity === 0) {
        alert("This item is currently Out of Stock at HQ.");
        return;
      }
      if (hqRequestForm.quantity > selectedHQAsset.total_quantity) {
        alert("Requested quantity cannot exceed the available HQ stock.");
        return;
      }
    }
    setSubmitting(true);
    try {
      await inventoryService.requestHQStock({
        inventory_master_id: hqRequestForm.inventory_master_id,
        quantity: hqRequestForm.quantity,
        priority: hqRequestForm.priority,
        reason: hqRequestForm.reason || "Station Patrol Requisition",
        remarks: hqRequestForm.remarks || undefined,
      });

      showToast("Request Submitted Successfully", "success");
      setShowHQRequestModal(false);
      setHqRequestForm({
        inventory_master_id: 0,
        quantity: 1,
        priority: "MEDIUM",
        reason: "",
        remarks: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to submit request to Headquarters.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await inventoryService.updateStockQuantity(selectedItem.id, {
        available_quantity: updateQtyForm.new_available_qty,
        remarks: updateQtyForm.remarks,
      });

      showToast("Stock Quantity Updated Successfully", "success");
      setShowUpdateQtyModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update stock quantity.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (item: StationInventory) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
    try {
      const logs = await inventoryService.getTransactionsFiltered({
        equipment_id: item.inventory_master_id,
      });
      setHistoryLogs(logs);
    } catch (err: any) {
      setHistoryLogs([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Station Inventory Stock...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Station Inventory Stock Portal"
        subtitle="Manage station equipment stock levels, issue local purchases, request HQ assets, and monitor availability."
        icon={Warehouse}
        badge={`${safeList.length} Station Items`}
      />

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

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* TOOLBAR, SEARCH & VIEW MODE TOGGLE SWITCH */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment, category, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        {/* View Mode Switch + Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* VIEW MODE TOGGLE SWITCH (Card View Default vs Table View) */}
          <div className="p-1 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === "card"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "text-emerald-950 hover:bg-emerald-100/60"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>◉ Card View</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "text-emerald-950 hover:bg-emerald-100/60"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>○ Table View</span>
            </button>
          </div>

          {/* Add Local Stock Button */}
          <button
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            Add Local Stock
          </button>

          {/* Request HQ Stock Button */}
          <button
            onClick={() => setShowHQRequestModal(true)}
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4 text-amber-300" />
            Request From HQ
          </button>

          <button
            onClick={fetchData}
            className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
            title="Refresh Stock List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 1: HEADQUARTERS ISSUED EQUIPMENT */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-950/5 border border-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-900 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-indigo-950">Section 1: Headquarters Issued Equipment</h3>
              <p className="text-xs font-semibold text-gray-500">
                HQ controlled assets. Procurement source: Headquarters Allocation.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 text-xs font-black">
            {hqIssuedSection.length} HQ Items
          </span>
        </div>

        {/* CARD VIEW MODE FOR HQ SECTION */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hqIssuedSection.map((item) => {
              const eqName = getItemName(item);
              const catName = getCategoryName(item);
              const supplierStr = getSupplierSource(item);
              const currStock = item.current_stock ?? (item.available_quantity + (item.issued_quantity || 0) + item.reserved_quantity + item.damaged_quantity);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-indigo-950/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 line-clamp-1">
                          {eqName}
                        </h4>
                        <span className="text-[11px] font-extrabold text-indigo-800">
                          {catName}
                        </span>
                      </div>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Current</span>
                        <span className="font-mono font-black text-xs text-emerald-950">{currStock}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Available</span>
                        <span className="font-mono font-black text-xs text-emerald-700">{item.available_quantity}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Min Level</span>
                        <span className="font-mono font-black text-xs text-amber-700">{item.minimum_stock}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                      <span className="text-gray-500">Source:</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-lg font-black text-[10px]">
                        {supplierStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Updated:</span>
                      <span>{formatDate(item.updated_at || item.last_updated)}</span>
                    </div>
                  </div>

                  {/* HQ Action Buttons (Request From HQ & History ONLY - NO Update Quantity) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-950/10">
                    <button
                      onClick={() => {
                        setHqRequestForm((prev) => ({
                          ...prev,
                          inventory_master_id: item.inventory_master_id,
                        }));
                        setShowHQRequestModal(true);
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" /> Request From HQ
                    </button>
                    <button
                      onClick={() => handleOpenHistory(item)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shrink-0"
                      title="View History"
                    >
                      <HistoryIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {hqIssuedSection.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-indigo-950/10 text-xs font-semibold text-gray-400 italic">
                No Headquarters issued equipment items found matching filter criteria.
              </div>
            )}
          </div>
        ) : (
          /* TABLE VIEW MODE FOR HQ SECTION */
          <div className="bg-white rounded-3xl border border-indigo-950/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-indigo-50/70 border-b border-indigo-950/10 text-indigo-950 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5 text-left align-middle">Equipment</th>
                    <th className="px-4 py-3.5 text-center align-middle">Category</th>
                    <th className="px-4 py-3.5 text-center align-middle">Current Stock</th>
                    <th className="px-4 py-3.5 text-center align-middle">Available</th>
                    <th className="px-4 py-3.5 text-center align-middle">Min Stock</th>
                    <th className="px-4 py-3.5 text-center align-middle">Status</th>
                    <th className="px-4 py-3.5 text-center align-middle">Source</th>
                    <th className="px-4 py-3.5 text-center align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-950/5 text-emerald-950 text-xs font-semibold">
                  {hqIssuedSection.map((item) => {
                    const eqName = getItemName(item);
                    const catName = getCategoryName(item);
                    const supplierStr = getSupplierSource(item);
                    const currStock = item.current_stock ?? (item.available_quantity + (item.issued_quantity || 0) + item.reserved_quantity + item.damaged_quantity);

                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/30 transition-all">
                        <td className="px-4 py-3.5 text-left align-middle font-extrabold text-emerald-950">
                          {eqName}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-bold text-indigo-900">
                          {catName}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                          {currStock} {item.unit || "Units"}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-700">
                          {item.available_quantity}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-amber-700">
                          {item.minimum_stock}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-lg text-[10px] font-black">
                            {supplierStr}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setHqRequestForm((prev) => ({
                                  ...prev,
                                  inventory_master_id: item.inventory_master_id,
                                }));
                                setShowHQRequestModal(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1"
                            >
                              <Send className="w-3 h-3 text-amber-300" /> Request HQ
                            </button>
                            <button
                              onClick={() => handleOpenHistory(item)}
                              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                              title="History"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LOCAL PURCHASE ITEMS */}
      <div className="space-y-4 pt-4">
        <div className="p-4 rounded-2xl bg-emerald-950/5 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-900 text-white shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-950">Section 2: Local Purchase Items</h3>
              <p className="text-xs font-semibold text-gray-500">
                Locally purchased station equipment. Procurement source: Station / Local Purchase.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black">
            {localPurchaseSection.length} Local Items
          </span>
        </div>

        {/* CARD VIEW MODE FOR LOCAL SECTION */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localPurchaseSection.map((item) => {
              const eqName = getItemName(item);
              const catName = getCategoryName(item);
              const supplierStr = getSupplierSource(item);
              const currStock = item.current_stock ?? (item.available_quantity + (item.issued_quantity || 0) + item.reserved_quantity + item.damaged_quantity);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 line-clamp-1">
                          {eqName}
                        </h4>
                        <span className="text-[11px] font-extrabold text-emerald-800">
                          {catName}
                        </span>
                      </div>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Current</span>
                        <span className="font-mono font-black text-xs text-emerald-950">{currStock}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Available</span>
                        <span className="font-mono font-black text-xs text-emerald-700">{item.available_quantity}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-500 block">Min Level</span>
                        <span className="font-mono font-black text-xs text-amber-700">{item.minimum_stock}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                      <span className="text-gray-500">Source:</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg font-black text-[10px]">
                        {supplierStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Updated:</span>
                      <span>{formatDate(item.updated_at || item.last_updated)}</span>
                    </div>
                  </div>

                  {/* Local Action Buttons (Update Quantity & History ONLY - NO HQ Request) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-950/10">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setUpdateQtyForm({
                          new_available_qty: item.available_quantity,
                          remarks: "Local Purchase Quantity Update",
                        });
                        setShowUpdateQtyModal(true);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-amber-300" /> Update Quantity
                    </button>
                    <button
                      onClick={() => handleOpenHistory(item)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all shrink-0"
                      title="View History"
                    >
                      <HistoryIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {localPurchaseSection.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-emerald-950/10 text-xs font-semibold text-gray-400 italic">
                No local purchase items found matching filter criteria.
              </div>
            )}
          </div>
        ) : (
          /* TABLE VIEW MODE FOR LOCAL SECTION */
          <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-emerald-50/70 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5 text-left align-middle">Equipment</th>
                    <th className="px-4 py-3.5 text-center align-middle">Category</th>
                    <th className="px-4 py-3.5 text-center align-middle">Current Stock</th>
                    <th className="px-4 py-3.5 text-center align-middle">Available</th>
                    <th className="px-4 py-3.5 text-center align-middle">Min Stock</th>
                    <th className="px-4 py-3.5 text-center align-middle">Status</th>
                    <th className="px-4 py-3.5 text-center align-middle">Source</th>
                    <th className="px-4 py-3.5 text-center align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                  {localPurchaseSection.map((item) => {
                    const eqName = getItemName(item);
                    const catName = getCategoryName(item);
                    const supplierStr = getSupplierSource(item);
                    const currStock = item.current_stock ?? (item.available_quantity + (item.issued_quantity || 0) + item.reserved_quantity + item.damaged_quantity);

                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                        <td className="px-4 py-3.5 text-left align-middle font-extrabold text-emerald-950">
                          {eqName}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-bold text-emerald-900">
                          {catName}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                          {currStock} {item.unit || "Units"}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-emerald-700">
                          {item.available_quantity}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle font-mono font-black text-amber-700">
                          {item.minimum_stock}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-black">
                            {supplierStr}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setUpdateQtyForm({
                                  new_available_qty: item.available_quantity,
                                  remarks: "Local Purchase Quantity Update",
                                });
                                setShowUpdateQtyModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3 text-amber-300" /> Update Qty
                            </button>
                            <button
                              onClick={() => handleOpenHistory(item)}
                              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                              title="History"
                            >
                              <HistoryIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD LOCAL STOCK POPUP (SIMPLIFIED - LOCAL PURCHASES ONLY) */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-700" /> Add Local Purchase Stock
                </h3>
                <p className="text-xs font-semibold text-gray-500">Record station local purchases for consumable equipment.</p>
              </div>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Equipment Item *</label>
                <select
                  required
                  value={addStockForm.inventory_master_id}
                  onChange={(e) => setAddStockForm({ ...addStockForm, inventory_master_id: Number(e.target.value) })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value={0}>-- Select Local Equipment Item --</option>
                  {localMasterOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} ({m.category} • {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Quantity Purchased *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={addStockForm.quantity}
                    onChange={(e) => setAddStockForm({ ...addStockForm, quantity: Number(e.target.value) })}
                    className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-mono font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kerala Forest Cooperative"
                    value={addStockForm.vendor_name}
                    onChange={(e) => setAddStockForm({ ...addStockForm, vendor_name: e.target.value })}
                    className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={addStockForm.purchase_date}
                    onChange={(e) => setAddStockForm({ ...addStockForm, purchase_date: e.target.value })}
                    className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Invoice Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-88"
                    value={addStockForm.invoice_number}
                    onChange={(e) => setAddStockForm({ ...addStockForm, invoice_number: e.target.value })}
                    className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Local procurement notes..."
                  value={addStockForm.remarks}
                  onChange={(e) => setAddStockForm({ ...addStockForm, remarks: e.target.value })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Local Purchase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST STOCK FROM HQ POPUP (HQ CONTROLLED ITEMS ONLY) */}
      {showHQRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-700" /> Request Equipment From Headquarters
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  Submit requisition to HQ for restricted equipment (GPS, Radio, Binoculars, Drone, Camera, Night Vision).
                </p>
              </div>
              <button onClick={() => setShowHQRequestModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleHQRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-indigo-950 uppercase mb-1">HQ Equipment Item *</label>
                <select
                  required
                  value={hqRequestForm.inventory_master_id}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, inventory_master_id: Number(e.target.value) })}
                  className="w-full p-3 border border-indigo-950/10 rounded-2xl bg-white text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-800"
                >
                  <option value={0}>-- Select HQ Controlled Asset --</option>
                  {hqMasterOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} — {m.category_name || m.category} (Available: {m.total_quantity} {m.unit || "u"})
                    </option>
                  ))}
                </select>
                {hqMasterOptions.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-extrabold mt-1">
                    No HQ-controlled equipment is currently available.
                  </p>
                )}
              </div>

              {selectedHQAsset && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[11px] space-y-1 text-indigo-950 font-bold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span>{selectedHQAsset.category_name || selectedHQAsset.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available at HQ:</span>
                    <span className={selectedHQAsset.total_quantity === 0 ? "text-red-600 font-extrabold" : ""}>
                      {selectedHQAsset.total_quantity} {selectedHQAsset.unit || "units"}
                    </span>
                  </div>
                  {selectedHQAsset.total_quantity === 0 && (
                    <p className="text-[10px] text-red-600 font-extrabold italic pt-1 border-t border-red-100">
                      ⚠️ Out of Stock at HQ. Requisition is currently unavailable.
                    </p>
                  )}
                  {hqRequestForm.quantity > selectedHQAsset.total_quantity && selectedHQAsset.total_quantity > 0 && (
                    <p className="text-[10px] text-red-600 font-extrabold italic pt-1 border-t border-red-100">
                      ⚠️ Requested quantity cannot exceed the available HQ stock.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-indigo-950 uppercase mb-1">Requested Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={hqRequestForm.quantity}
                    onChange={(e) => setHqRequestForm({ ...hqRequestForm, quantity: Number(e.target.value) })}
                    className="w-full p-3 border border-indigo-950/10 rounded-2xl bg-white text-xs font-mono font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-indigo-950 uppercase mb-1">Priority *</label>
                  <select
                    value={hqRequestForm.priority}
                    onChange={(e) => setHqRequestForm({ ...hqRequestForm, priority: e.target.value })}
                    className="w-full p-3 border border-indigo-950/10 rounded-2xl bg-white text-xs font-extrabold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-indigo-950 uppercase mb-1">Requisition Purpose / Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patrol Unit Monsoon Surveillance"
                  value={hqRequestForm.reason}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, reason: e.target.value })}
                  className="w-full p-3 border border-indigo-950/10 rounded-2xl bg-white text-xs font-semibold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-indigo-950 uppercase mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional station requirements..."
                  value={hqRequestForm.remarks}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, remarks: e.target.value })}
                  className="w-full p-3 border border-indigo-950/10 rounded-2xl bg-white text-xs font-semibold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-indigo-950/10">
                <button
                  type="button"
                  onClick={() => setShowHQRequestModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !hqRequestForm.inventory_master_id ||
                    (selectedHQAsset && (selectedHQAsset.total_quantity === 0 || hqRequestForm.quantity > selectedHQAsset.total_quantity))
                  }
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Requisition to HQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPDATE QUANTITY POPUP */}
      {showUpdateQtyModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-700" /> Update Available Quantity
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  {getItemName(selectedItem)} ({getCategoryName(selectedItem)})
                </p>
              </div>
              <button onClick={() => setShowUpdateQtyModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleUpdateQtySubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <div className="text-xs font-extrabold text-emerald-950">
                  Current Available Quantity: <span className="font-mono font-black text-emerald-700">{selectedItem.available_quantity} {selectedItem.unit || "Units"}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-semibold">
                  Min Stock Threshold: {selectedItem.minimum_stock}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">New Available Quantity *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={updateQtyForm.new_available_qty}
                  onChange={(e) => setUpdateQtyForm({ ...updateQtyForm, new_available_qty: Number(e.target.value) })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-mono font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">Update Remarks / Reason *</label>
                <input
                  type="text"
                  required
                  value={updateQtyForm.remarks}
                  onChange={(e) => setUpdateQtyForm({ ...updateQtyForm, remarks: e.target.value })}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowUpdateQtyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Quantity Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MOVEMENT HISTORY DRAWER */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-emerald-700" /> Stock Transaction History
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  {getItemName(selectedItem)} ({getCategoryName(selectedItem)})
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {historyLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-950">{log.transaction_type}</span>
                    <p className="text-[11px] text-gray-600 font-semibold">{log.remarks || "No remarks"}</p>
                    <span className="font-mono text-[10px] text-gray-400">{formatDate(log.created_at)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-900 text-sm">
                      {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                    </span>
                    <span className="block text-[10px] text-gray-500 font-bold">Qty After: {log.quantity_after}</span>
                  </div>
                </div>
              ))}

              {historyLogs.length === 0 && (
                <div className="p-8 text-center text-xs font-semibold text-gray-400 italic">
                  No movement transactions recorded for this item.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
