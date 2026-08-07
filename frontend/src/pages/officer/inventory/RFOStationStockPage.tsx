import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { StationInventory, InventoryMaster } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Warehouse,
  Plus,
  Edit2,
  History,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Building2,
  ShieldAlert,
  CheckCircle,
  Send,
  X,
  Lock,
  User,
} from "lucide-react";

export const RFOStationStockPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<InventoryMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Officer Name from Local Storage or Default
  const officerName = useMemo(() => {
    try {
      const stored = localStorage.getItem("gaia_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.full_name || parsed.username || "Range Forest Officer";
      }
    } catch (e) {
      // fallback
    }
    return "Range Forest Officer";
  }, []);

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [showHQRequestModal, setShowHQRequestModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StationInventory | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Add Stock Form State
  const [addStockForm, setAddStockForm] = useState({
    inventory_master_id: 0,
    quantity: 1,
    procurement_source: "LOCAL_PURCHASE" as "LOCAL_PURCHASE" | "HQ_ALLOCATION",
    vendor_name: "",
    invoice_number: "",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_cost: "",
    gst_tax: "",
    allocation_reference: "",
    received_date: new Date().toISOString().split("T")[0],
    admin_dispatch_number: "",
    remarks: "",
  });
  const [addStockError, setAddStockError] = useState<string | null>(null);

  // HQ Request Form State
  const [hqRequestForm, setHqRequestForm] = useState({
    inventory_master_id: 0,
    quantity: 5,
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    reason: "",
    expected_date: "",
    remarks: "",
  });
  const [hqRequestError, setHqRequestError] = useState<string | null>(null);

  // Update Qty Form State
  const [updateQtyForm, setUpdateQtyForm] = useState({
    available_quantity: 0,
    remarks: "",
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
      const [stStock, masters] = await Promise.all([
        inventoryService.getMyStationInventory(),
        inventoryService.getMasterItems({ active_only: true }),
      ]);
      setStationInventory(stStock);
      setMasterCatalog(masters);

      if (masters.length > 0 && addStockForm.inventory_master_id === 0) {
        setAddStockForm((prev) => ({ ...prev, inventory_master_id: masters[0].id }));
        setHqRequestForm((prev) => ({ ...prev, inventory_master_id: masters[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Currently Selected Master Item & Selected Station Inventory Context
  const selectedMasterItem = useMemo(() => {
    return masterCatalog.find((m) => m.id === addStockForm.inventory_master_id) || masterCatalog[0] || null;
  }, [masterCatalog, addStockForm.inventory_master_id]);

  const selectedItemStockContext = useMemo(() => {
    if (!selectedMasterItem) return null;
    const existing = stationInventory.find((s) => s.inventory_master_id === selectedMasterItem.id);

    const available = existing ? existing.available_quantity : 0;
    const reserved = existing ? existing.reserved_quantity : 0;
    const issued = existing ? (existing.issued_quantity || 0) : 0;
    const damaged = existing ? existing.damaged_quantity : 0;

    // Mathematical Stock Invariant: Current Stock = Available + Issued + Reserved + Damaged
    const calculatedCurrentStock = available + reserved + issued + damaged;
    const minStock = existing?.minimum_stock || selectedMasterItem.minimum_stock || 0;
    const maxCapacity = existing?.maximum_capacity || (minStock > 0 ? minStock * 5 : Math.max(calculatedCurrentStock + 50, 100));

    return {
      available_quantity: available,
      reserved_quantity: reserved,
      issued_quantity: issued,
      damaged_quantity: damaged,
      current_stock: calculatedCurrentStock,
      minimum_stock: minStock,
      maximum_capacity: maxCapacity,
      category: selectedMasterItem.category || selectedMasterItem.category_name || "General",
      procurement_type: selectedMasterItem.procurement_type || "LOCAL_ALLOWED",
      unit: selectedMasterItem.unit,
    };
  }, [selectedMasterItem, stationInventory]);

  // Handle Equipment Selection in Add Stock Modal
  const handleSelectMasterItem = (masterId: number) => {
    const matched = masterCatalog.find((m) => m.id === masterId);
    const procType = matched?.procurement_type || "LOCAL_ALLOWED";
    setAddStockForm((prev) => ({
      ...prev,
      inventory_master_id: masterId,
      procurement_source: procType === "ADMIN_ONLY" ? "HQ_ALLOCATION" : "LOCAL_PURCHASE",
    }));
    setAddStockError(null);
  };

  // Submit Stock Addition
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStockError(null);

    const qty = Number(addStockForm.quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      setAddStockError("Quantity must be a positive integer greater than zero.");
      return;
    }

    // Capacity Validation: Current Stock + Add Qty cannot exceed Maximum Capacity
    if (selectedItemStockContext) {
      const projectedStock = selectedItemStockContext.current_stock + qty;
      if (projectedStock > selectedItemStockContext.maximum_capacity) {
        setAddStockError(
          `Stock addition of ${qty} ${selectedItemStockContext.unit} exceeds the maximum station capacity (${selectedItemStockContext.maximum_capacity} ${selectedItemStockContext.unit}). Current stock: ${selectedItemStockContext.current_stock}.`
        );
        return;
      }
    }

    const isAdminOnly = selectedItemStockContext?.procurement_type === "ADMIN_ONLY";

    if (isAdminOnly) {
      setAddStockError("This equipment category is restricted to Headquarters allocation. Local purchase is prohibited.");
      return;
    }

    if (addStockForm.procurement_source === "HQ_ALLOCATION") {
      if (!addStockForm.allocation_reference.trim()) {
        setAddStockError("Allocation Reference Number is required for Headquarters Allocation.");
        return;
      }
    } else {
      if (!addStockForm.vendor_name.trim()) {
        setAddStockError("Supplier / Vendor Name is required for Local Purchase.");
        return;
      }
      if (!addStockForm.invoice_number.trim()) {
        setAddStockError("Invoice Number is required for Local Purchase.");
        return;
      }
      if (!addStockForm.purchase_date) {
        setAddStockError("Purchase Date is required for Local Purchase.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await inventoryService.addStockToStation({
        inventory_master_id: addStockForm.inventory_master_id,
        quantity: qty,
        procurement_source: addStockForm.procurement_source,
        vendor_name: addStockForm.vendor_name.trim() || undefined,
        invoice_number: addStockForm.invoice_number.trim() || undefined,
        purchase_date: addStockForm.purchase_date || undefined,
        purchase_cost: addStockForm.purchase_cost ? parseFloat(addStockForm.purchase_cost) : undefined,
        gst_tax: addStockForm.gst_tax ? parseFloat(addStockForm.gst_tax) : undefined,
        allocation_reference: addStockForm.allocation_reference.trim() || undefined,
        received_date: addStockForm.received_date || undefined,
        admin_dispatch_number: addStockForm.admin_dispatch_number.trim() || undefined,
        remarks: addStockForm.remarks.trim() || undefined,
      });

      showToast("Inventory Updated Successfully", "success");
      setShowAddStockModal(false);
      fetchData();
    } catch (err: any) {
      setAddStockError(err.message || "Failed to add stock.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Headquarters Stock Request
  const handleHQRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHqRequestError(null);

    const qty = Number(hqRequestForm.quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      setHqRequestError("Requested quantity must be a positive integer.");
      return;
    }

    if (!hqRequestForm.reason.trim()) {
      setHqRequestError("Requirement reason is required.");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.requestHQStock({
        inventory_master_id: hqRequestForm.inventory_master_id,
        quantity: qty,
        priority: hqRequestForm.priority,
        reason: hqRequestForm.reason.trim(),
        expected_date: hqRequestForm.expected_date || undefined,
        remarks: hqRequestForm.remarks.trim() || undefined,
      });

      showToast("Inventory Updated Successfully", "success");
      setShowHQRequestModal(false);
      fetchData();
    } catch (err: any) {
      setHqRequestError(err.message || "Failed to submit stock request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    try {
      await inventoryService.updateStockQuantity(
        selectedStockItem.id,
        updateQtyForm.available_quantity,
        updateQtyForm.remarks
      );
      showToast("Inventory Updated Successfully", "success");
      setShowUpdateModal(false);
      setSelectedStockItem(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to update stock quantity.", "error");
    }
  };

  const filteredItems = stationInventory.filter(
    (item) =>
      !searchTerm ||
      (item.item_name && item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplier_source && item.supplier_source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <p className="text-sm font-medium text-emerald-950">Loading Station Inventory Stock...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Station Inventory Stock"
        subtitle="Manage live station stock, monitor current stock invariants, enforce category procurement rules, and track maximum capacity limits."
        icon={Warehouse}
        badge="Station Stock Telemetry"
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

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment, category, supplier source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
          <button
            onClick={fetchData}
            className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setShowHQRequestModal(true);
              setHqRequestError(null);
            }}
            className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Building2 className="w-4 h-4 text-blue-300" />
            Request Stock From HQ
          </button>

          <button
            onClick={() => {
              setShowAddStockModal(true);
              setAddStockError(null);
            }}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Add Stock
          </button>
        </div>
      </div>

      {/* SECTION 1: SPACIOUS, UNCONGESTED TABLE WITH MIN-WIDTH & NO-WRAP */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1350px]">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-4 text-left align-middle">Equipment Name</th>
                <th className="px-4 py-4 text-center align-middle">Current Stock</th>
                <th className="px-3 py-4 text-center align-middle">Available</th>
                <th className="px-3 py-4 text-center align-middle">Reserved</th>
                <th className="px-3 py-4 text-center align-middle">Issued</th>
                <th className="px-3 py-4 text-center align-middle">Damaged</th>
                <th className="px-3.5 py-4 text-center align-middle">Min Stock</th>
                <th className="px-3.5 py-4 text-center align-middle">Max Capacity</th>
                <th className="px-3.5 py-4 text-center align-middle">Reorder Level</th>
                <th className="px-4 py-4 text-center align-middle">Status</th>
                <th className="px-4 py-4 text-center align-middle">Last Updated</th>
                <th className="px-4 py-4 text-center align-middle">Supplier / Source</th>
                <th className="px-5 py-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredItems.map((item) => {
                const masterMatch = masterCatalog.find((m) => m.id === item.inventory_master_id);
                const procType = item.procurement_type || masterMatch?.procurement_type || "LOCAL_ALLOWED";

                const avail = item.available_quantity || 0;
                const reserved = item.reserved_quantity || 0;
                const issued = item.issued_quantity || 0;
                const damaged = item.damaged_quantity || 0;
                // Mathematical Invariant: Current Stock = Available + Issued + Reserved + Damaged
                const calculatedCurrentStock = avail + reserved + issued + damaged;
                const maxCap = item.maximum_capacity || (item.minimum_stock > 0 ? item.minimum_stock * 5 : 100);

                return (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                    {/* Left Aligned Equipment Name & Category */}
                    <td className="px-5 py-4 text-left align-middle font-extrabold text-emerald-950 whitespace-nowrap">
                      <div className="text-xs font-extrabold text-emerald-950">{item.item_name}</div>
                      <span className="text-[10px] text-emerald-800/70 font-bold block mt-0.5">
                        {item.category}
                      </span>
                    </td>

                    {/* Center Aligned Current Stock */}
                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      <span className="font-mono font-black text-xs text-emerald-950">{calculatedCurrentStock}</span>{" "}
                      <span className="text-[10px] text-gray-500 font-semibold">{item.unit}</span>
                    </td>

                    {/* Center Aligned Available */}
                    <td className="px-3 py-4 text-center align-middle font-mono text-emerald-700 font-extrabold whitespace-nowrap">
                      {avail}
                    </td>

                    {/* Center Aligned Reserved */}
                    <td className="px-3 py-4 text-center align-middle font-mono text-blue-700 font-extrabold whitespace-nowrap">
                      {reserved}
                    </td>

                    {/* Center Aligned Issued */}
                    <td className="px-3 py-4 text-center align-middle font-mono text-purple-900 font-extrabold whitespace-nowrap">
                      {issued}
                    </td>

                    {/* Center Aligned Damaged */}
                    <td className="px-3 py-4 text-center align-middle font-mono text-red-600 font-extrabold whitespace-nowrap">
                      {damaged}
                    </td>

                    {/* Center Aligned Minimum Stock */}
                    <td className="px-3.5 py-4 text-center align-middle font-mono text-amber-700 font-extrabold whitespace-nowrap">
                      {item.minimum_stock}
                    </td>

                    {/* Center Aligned Maximum Capacity */}
                    <td className="px-3.5 py-4 text-center align-middle font-mono text-gray-700 font-extrabold whitespace-nowrap">
                      {maxCap}
                    </td>

                    {/* Center Aligned Reorder Level */}
                    <td className="px-3.5 py-4 text-center align-middle font-mono text-emerald-900 font-bold whitespace-nowrap">
                      {item.reorder_level || 5}
                    </td>

                    {/* Center Aligned Status */}
                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      {avail === 0 ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" /> Out of Stock
                        </span>
                      ) : avail <= item.minimum_stock ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black">
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* Center Aligned Last Updated */}
                    <td className="px-4 py-4 text-center align-middle font-mono text-[11px] text-gray-500 font-bold whitespace-nowrap">
                      {formatDate(item.last_updated)}
                    </td>

                    {/* Center Aligned Supplier Source */}
                    <td className="px-4 py-4 text-center align-middle font-extrabold text-[11px] text-emerald-900 whitespace-nowrap">
                      {item.supplier_source || "HQ Allocation"}
                    </td>

                    {/* Center Aligned Actions */}
                    <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {procType === "ADMIN_ONLY" ? (
                          <button
                            onClick={() => {
                              setHqRequestForm((prev) => ({
                                ...prev,
                                inventory_master_id: item.inventory_master_id,
                              }));
                              setShowHQRequestModal(true);
                              setHqRequestError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-black text-[11px] border border-blue-300 transition-all inline-flex items-center gap-1.5 shrink-0"
                          >
                            <Building2 className="w-3.5 h-3.5 text-blue-700" /> Request from HQ
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStockItem(item);
                              setUpdateQtyForm({
                                available_quantity: item.available_quantity,
                                remarks: "",
                              });
                              setShowUpdateModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-[11px] border border-gray-200 transition-all inline-flex items-center gap-1.5 shrink-0"
                            title="Update Quantity"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Update Qty
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/officer/inventory/history?equipment_id=${item.inventory_master_id}`)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-200 transition-all inline-flex items-center gap-1.5 shrink-0"
                          title="View History"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No station inventory items found. Click "Add Stock" to log local purchases or receive HQ allocations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 & 4: REDESIGNED ADD STOCK MODAL WITH CATEGORY PROCUREMENT RULES */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                Add Stock to Station
              </h3>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Officer Name */}
            <div className="p-3 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" /> Logging Officer:
              </span>
              <strong className="text-emerald-900 font-black">{officerName}</strong>
            </div>

            {addStockError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{addStockError}</span>
              </div>
            )}

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              {/* Equipment Selector */}
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Select Equipment Item *
                </label>
                <select
                  value={addStockForm.inventory_master_id}
                  onChange={(e) => handleSelectMasterItem(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                >
                  {masterCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} ({m.category || m.category_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* CURRENT STOCK CONTEXT CARD WITH MAXIMUM CAPACITY */}
              {selectedItemStockContext && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                    <span>Stock Telemetry & Capacity</span>
                    {selectedItemStockContext.procurement_type === "ADMIN_ONLY" ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-700" /> ADMIN_ONLY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> LOCAL_ALLOWED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Current Stock</span>
                      <strong className="text-emerald-950 font-extrabold">{selectedItemStockContext.current_stock}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Available</span>
                      <strong className="text-emerald-800 font-extrabold">{selectedItemStockContext.available_quantity}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Min Stock</span>
                      <strong className="text-amber-800 font-extrabold">{selectedItemStockContext.minimum_stock}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-gray-500 uppercase block font-semibold">Max Capacity</span>
                      <strong className="text-gray-900 font-extrabold">{selectedItemStockContext.maximum_capacity}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-950 pt-1">
                    <span>Category: <strong>{selectedItemStockContext.category}</strong></span>
                    <span>Unit: <strong>{selectedItemStockContext.unit}</strong></span>
                  </div>
                </div>
              )}

              {/* Quantity to Add with Capacity Check */}
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
                {selectedItemStockContext &&
                  selectedItemStockContext.current_stock + addStockForm.quantity >
                    selectedItemStockContext.maximum_capacity && (
                    <p className="text-[11px] text-red-700 font-extrabold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      Warning: Adding {addStockForm.quantity} units will exceed maximum station capacity ({selectedItemStockContext.maximum_capacity} units).
                    </p>
                  )}
              </div>

              {/* CATEGORY PURCHASE SOURCE LOGIC */}
              {selectedItemStockContext?.procurement_type === "ADMIN_ONLY" ? (
                /* HQ CONTROLLED CATEGORY: DISABLE LOCAL PURCHASE COMPLETELY */
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                    <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>HQ Controlled Category (Local Purchase Disabled)</span>
                  </div>
                  <p className="text-[11px] text-purple-900 font-extrabold leading-relaxed">
                    This equipment must be requested from Headquarters. Local purchases are strictly prohibited for HQ-controlled categories (Electronics, Surveillance, Optics, Tactical Equipment).
                  </p>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStockModal(false);
                        setHqRequestForm((prev) => ({
                          ...prev,
                          inventory_master_id: addStockForm.inventory_master_id,
                        }));
                        setShowHQRequestModal(true);
                      }}
                      className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-blue-300" />
                      Request from HQ
                    </button>
                  </div>
                </div>
              ) : (
                /* LOCALLY PURCHASABLE CATEGORY */
                <div className="space-y-3 pt-1">
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider">
                    Purchase Source / Type *
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                        addStockForm.procurement_source === "LOCAL_PURCHASE"
                          ? "bg-emerald-100/70 border-emerald-800 text-emerald-950 font-black shadow-xs"
                          : "bg-emerald-950/5 border-emerald-950/10 text-gray-600 font-semibold"
                      }`}
                    >
                      <input
                        type="radio"
                        name="procurement_source"
                        value="LOCAL_PURCHASE"
                        checked={addStockForm.procurement_source === "LOCAL_PURCHASE"}
                        onChange={() => setAddStockForm({ ...addStockForm, procurement_source: "LOCAL_PURCHASE" })}
                        className="w-4 h-4 text-emerald-900 focus:ring-emerald-800"
                      />
                      <span className="text-xs">Local Purchase</span>
                    </label>

                    <label
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                        addStockForm.procurement_source === "HQ_ALLOCATION"
                          ? "bg-emerald-100/70 border-emerald-800 text-emerald-950 font-black shadow-xs"
                          : "bg-emerald-950/5 border-emerald-950/10 text-gray-600 font-semibold"
                      }`}
                    >
                      <input
                        type="radio"
                        name="procurement_source"
                        value="HQ_ALLOCATION"
                        checked={addStockForm.procurement_source === "HQ_ALLOCATION"}
                        onChange={() => setAddStockForm({ ...addStockForm, procurement_source: "HQ_ALLOCATION" })}
                        className="w-4 h-4 text-emerald-900 focus:ring-emerald-800"
                      />
                      <span className="text-xs">Headquarters Allocation</span>
                    </label>
                  </div>

                  {addStockForm.procurement_source === "LOCAL_PURCHASE" ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                          Supplier / Vendor Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kerala Forest Medical Depot"
                          value={addStockForm.vendor_name}
                          onChange={(e) => setAddStockForm({ ...addStockForm, vendor_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            Invoice Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. INV-2026-8801"
                            value={addStockForm.invoice_number}
                            onChange={(e) => setAddStockForm({ ...addStockForm, invoice_number: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            Purchase Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={addStockForm.purchase_date}
                            onChange={(e) => setAddStockForm({ ...addStockForm, purchase_date: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            Purchase Cost (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 2500"
                            value={addStockForm.purchase_cost}
                            onChange={(e) => setAddStockForm({ ...addStockForm, purchase_cost: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            GST / Tax (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 450"
                            value={addStockForm.gst_tax}
                            onChange={(e) => setAddStockForm({ ...addStockForm, gst_tax: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                          Allocation Reference Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HQ-ALLOC-2026-901"
                          value={addStockForm.allocation_reference}
                          onChange={(e) => setAddStockForm({ ...addStockForm, allocation_reference: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            Received Date
                          </label>
                          <input
                            type="date"
                            value={addStockForm.received_date}
                            onChange={(e) => setAddStockForm({ ...addStockForm, received_date: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                            Admin Dispatch # (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. DISP-404"
                            value={addStockForm.admin_dispatch_number}
                            onChange={(e) => setAddStockForm({ ...addStockForm, admin_dispatch_number: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Remarks / Voucher Note
                </label>
                <input
                  type="text"
                  placeholder="Voucher notes, condition report..."
                  value={addStockForm.remarks}
                  onChange={(e) => setAddStockForm({ ...addStockForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>

                {selectedItemStockContext?.procurement_type !== "ADMIN_ONLY" && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm & Log Stock
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST STOCK FROM HEADQUARTERS MODAL */}
      {showHQRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                Request Stock From Headquarters
              </h3>
              <button onClick={() => setShowHQRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {hqRequestError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 shadow-xs">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{hqRequestError}</span>
              </div>
            )}

            <form onSubmit={handleHQRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Equipment Item *
                </label>
                <select
                  value={hqRequestForm.inventory_master_id}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, inventory_master_id: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                >
                  {masterCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} ({m.category || m.category_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Requested Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={hqRequestForm.quantity}
                    onChange={(e) => setHqRequestForm({ ...hqRequestForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                    Priority *
                  </label>
                  <select
                    value={hqRequestForm.priority}
                    onChange={(e) => setHqRequestForm({ ...hqRequestForm, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Reason for Requirement *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Field requirement for Wayanad sanctuary anti-poaching team..."
                  value={hqRequestForm.reason}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Expected Requirement Date
                </label>
                <input
                  type="date"
                  value={hqRequestForm.expected_date}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, expected_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="Additional comments..."
                  value={hqRequestForm.remarks}
                  onChange={(e) => setHqRequestForm({ ...hqRequestForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowHQRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE QUANTITY MODAL */}
      {showUpdateModal && selectedStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-700" />
              Update Quantity for {selectedStockItem.item_name}
            </h3>

            <form onSubmit={handleUpdateQtySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  New Available Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={updateQtyForm.available_quantity}
                  onChange={(e) =>
                    setUpdateQtyForm({ ...updateQtyForm, available_quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Reason for Adjustment / Update Remarks *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory count correction"
                  value={updateQtyForm.remarks}
                  onChange={(e) => setUpdateQtyForm({ ...updateQtyForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
