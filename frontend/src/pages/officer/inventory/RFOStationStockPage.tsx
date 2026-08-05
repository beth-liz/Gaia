import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export const RFOStationStockPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<InventoryMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StationInventory | null>(null);

  // Forms
  const [addStockForm, setAddStockForm] = useState({
    inventory_master_id: 0,
    quantity: 1,
    supplier: "",
    remarks: "",
  });

  const [updateQtyForm, setUpdateQtyForm] = useState({
    available_quantity: 0,
    remarks: "",
  });

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

      if (masters.length > 0) {
        setAddStockForm((prev) => ({ ...prev, inventory_master_id: masters[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load station stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryService.addStockToStation(addStockForm);
      setShowAddStockModal(false);
      setAddStockForm({
        inventory_master_id: masterCatalog[0]?.id || 0,
        quantity: 1,
        supplier: "",
        remarks: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add stock");
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
      setShowUpdateModal(false);
      setSelectedStockItem(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update stock quantity");
    }
  };

  const filteredItems = stationInventory.filter(
    (item) =>
      !searchTerm ||
      (item.item_name && item.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Station Inventory Table...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Inventory Stock"
        subtitle="Manage live stock quantities, log stock additions from suppliers, and track minimum alert thresholds."
        icon={Warehouse}
        badge="Assigned Station Stock"
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment or category..."
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
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Station Stock Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Available</th>
                <th className="px-6 py-4">Reserved</th>
                <th className="px-6 py-4">Damaged</th>
                <th className="px-6 py-4">Current Quantity</th>
                <th className="px-6 py-4">Minimum Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                  <td className="px-6 py-4 font-extrabold text-emerald-950">{item.item_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-extrabold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-emerald-700 font-extrabold">{item.available_quantity}</td>
                  <td className="px-6 py-4 font-mono text-blue-700 font-extrabold">{item.reserved_quantity}</td>
                  <td className="px-6 py-4 font-mono text-red-600 font-extrabold">{item.damaged_quantity}</td>
                  <td className="px-6 py-4 font-mono font-extrabold">{item.current_quantity} {item.unit}</td>
                  <td className="px-6 py-4 font-mono text-amber-700 font-extrabold">{item.minimum_stock}</td>
                  <td className="px-6 py-4">
                    {item.status === "In Stock" && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black">
                        In Stock
                      </span>
                    )}
                    {item.status === "Low Stock" && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" /> Low Stock
                      </span>
                    )}
                    {item.status === "Out of Stock" && (
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" /> Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStockItem(item);
                        setUpdateQtyForm({
                          available_quantity: item.available_quantity,
                          remarks: "",
                        });
                        setShowUpdateModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-[11px] border border-gray-200 transition-all inline-flex items-center gap-1"
                      title="Update Quantity"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Update Qty
                    </button>

                    <button
                      onClick={() => navigate(`/officer/inventory/history?equipment_id=${item.inventory_master_id}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-200 transition-all inline-flex items-center gap-1"
                      title="View Transaction History"
                    >
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No station inventory items found. Click "Add Stock" to add master catalog equipment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-700" />
              Add Stock to Station
            </h3>

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Select Equipment Item *
                </label>
                <select
                  value={addStockForm.inventory_master_id}
                  onChange={(e) =>
                    setAddStockForm({ ...addStockForm, inventory_master_id: parseInt(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                >
                  {masterCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Supplier / Vendor Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kerala Forest Central Depot / Wildcraft Supplies"
                  value={addStockForm.supplier}
                  onChange={(e) => setAddStockForm({ ...addStockForm, supplier: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Remarks / Voucher Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly allocation batch #402"
                  value={addStockForm.remarks}
                  onChange={(e) => setAddStockForm({ ...addStockForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  Confirm & Log Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Quantity Modal */}
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
                  Reason for Adjustment *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason for stock count adjustment..."
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
                  Update & Log Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
