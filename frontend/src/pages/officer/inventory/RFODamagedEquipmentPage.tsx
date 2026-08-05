import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { StationInventory } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ShieldAlert,
  Wrench,
  RefreshCw,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";

export const RFODamagedEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stationItems, setStationItems] = useState<StationInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal
  const [selectedItem, setSelectedItem] = useState<StationInventory | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [damagedAction, setDamagedAction] = useState<"REPAIR" | "REPLACE" | "DISCARD">("REPAIR");
  const [actionQty, setActionQty] = useState<number>(1);
  const [remarks, setRemarks] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await inventoryService.getMyStationInventory();
      setStationItems(items);
    } catch (err: any) {
      setError(err.message || "Failed to load station damaged equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await inventoryService.handleDamagedAction(selectedItem.id, {
        action: damagedAction,
        quantity: actionQty,
        remarks,
      });

      setShowActionModal(false);
      setSelectedItem(null);
      setRemarks("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to process damaged equipment action");
    }
  };

  const damagedItems = stationItems.filter((i) => i.damaged_quantity > 0);
  const filteredItems = damagedItems.filter(
    (i) =>
      !searchTerm ||
      (i.item_name && i.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.category && i.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Damaged Stock Telemetry...</p>
      </div>
    );
  }

  const totalDamagedCount = stationItems.reduce((acc, i) => acc + i.damaged_quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Damaged Equipment Management"
        subtitle="Process damaged gear write-offs, log repair restorations, and track replacement deliveries."
        icon={ShieldAlert}
        badge={`${totalDamagedCount} Damaged Units Stocked`}
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
            placeholder="Search damaged equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Damaged Stock Table */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                <th className="px-6 py-4">Equipment</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Damaged Quantity</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 font-semibold">
                  <td className="px-6 py-4 font-extrabold text-emerald-950">{item.item_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-extrabold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-red-600">
                    {item.damaged_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-800/70">{item.current_quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                    {new Date(item.last_updated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDamagedAction("REPAIR");
                        setActionQty(item.damaged_quantity);
                        setShowActionModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-300" /> Repair
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDamagedAction("REPLACE");
                        setActionQty(item.damaged_quantity);
                        setShowActionModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Replace
                    </button>

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDamagedAction("DISCARD");
                        setActionQty(item.damaged_quantity);
                        setShowActionModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Discard
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                    No damaged equipment currently recorded for your station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Damaged Gear Action - {selectedItem.item_name}
            </h3>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Action Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDamagedAction("REPAIR")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      damagedAction === "REPAIR"
                        ? "bg-emerald-900 text-amber-300 border-emerald-950"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Repair
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamagedAction("REPLACE")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      damagedAction === "REPLACE"
                        ? "bg-blue-700 text-white border-blue-800"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamagedAction("DISCARD")}
                    className={`py-2 px-2 text-xs font-black rounded-xl border transition-all ${
                      damagedAction === "DISCARD"
                        ? "bg-red-600 text-white border-red-700"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    Discard
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.damaged_quantity}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Action Remarks / Technical Assessment
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    damagedAction === "REPAIR"
                      ? "Note repair details or service center voucher..."
                      : damagedAction === "REPLACE"
                      ? "Note replacement delivery order reference..."
                      : "Note write-off reason / condemnation certificate reference..."
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-md ${
                    damagedAction === "REPAIR"
                      ? "bg-emerald-900 hover:bg-emerald-950"
                      : damagedAction === "REPLACE"
                      ? "bg-blue-700 hover:bg-blue-800"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm & Execute Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
