import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { KitMaster } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import { InventoryErrorCard } from "@/components/common/InventoryErrorCard";
import {
  Layers,
  RotateCcw,
  Loader2,
  RefreshCw,
  Search,
  ClipboardList,
} from "lucide-react";

export const RFORefillableKitsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kits, setKits] = useState<KitMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals
  const [selectedKit, setSelectedKit] = useState<KitMaster | null>(null);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);

  const [missingInput, setMissingInput] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [refillItemsInput, setRefillItemsInput] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getStationKits();
      setKits(data);
    } catch (err: any) {
      setError(err.message || "Failed to load station refillable kits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit) return;
    try {
      await inventoryService.inspectKit(selectedKit.id, {
        missing_components: missingInput,
        remarks: remarksInput,
      });

      setShowInspectModal(false);
      setSelectedKit(null);
      setMissingInput("");
      setRemarksInput("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to log kit inspection");
    }
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit) return;
    try {
      await inventoryService.refillKit(selectedKit.id, {
        items_refilled: refillItemsInput,
        remarks: remarksInput,
      });

      setShowRefillModal(false);
      setSelectedKit(null);
      setRefillItemsInput("");
      setRemarksInput("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to log kit refill");
    }
  };

  const filteredKits = kits.filter(
    (k) =>
      !searchTerm ||
      k.kit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.item_name && k.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Station Refillable Kits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refillable Kit Inspection & Replenishment Portal"
        subtitle="Manage First Aid Kits, Snake Bite Kits, and Emergency Boxes. Inspect missing components and execute refills."
        icon={Layers}
        badge={`${kits.length} Kits Registered`}
      />

      {error && (
        <InventoryErrorCard
          title="Kit Telemetry Error"
          message={error}
          onRetry={fetchData}
        />
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search kit number or type..."
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

      {/* Kit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredKits.map((kit) => {
          const isNeedsRefill = kit.current_status === "Needs Refill";
          return (
            <div
              key={kit.id}
              className={`p-6 rounded-3xl bg-white border shadow-xs space-y-4 transition-all ${
                isNeedsRefill ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-950/10"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-700" />
                    {kit.kit_number}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-800/70">{kit.item_name}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black ${
                    kit.current_status === "Available"
                      ? "bg-emerald-100 text-emerald-900"
                      : isNeedsRefill
                      ? "bg-amber-100 text-amber-950 border border-amber-300"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {kit.current_status}
                </span>
              </div>

              {/* Components List */}
              <div className="space-y-2 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-950/5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">Kit Components Breakdown</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-emerald-950">
                  {(kit.kit_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-emerald-950/5">
                      <span>{item.item_name}</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {item.current_quantity} / {item.required_quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800/70 pt-1">
                <span>Last Refilled: {kit.last_refilled_date ? new Date(kit.last_refilled_date).toLocaleDateString() : "Never"}</span>
                {(kit.inspections || []).length > 0 && (
                  <span>Inspections Logged: {kit.inspections.length}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedKit(kit);
                    setShowInspectModal(true);
                  }}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  <ClipboardList className="w-4 h-4 text-emerald-800" /> Inspect Kit
                </button>

                <button
                  onClick={() => {
                    setSelectedKit(kit);
                    setShowRefillModal(true);
                  }}
                  className="px-3.5 py-2 bg-purple-900 hover:bg-purple-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-purple-300" /> Execute Refill
                </button>
              </div>
            </div>
          );
        })}
        {filteredKits.length === 0 && (
          <div className="col-span-2 p-8 text-center text-emerald-800/60 font-medium bg-white rounded-3xl border border-emerald-950/10">
            No refillable kits registered for your monitoring station.
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {showInspectModal && selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-700" />
              Inspect {selectedKit.kit_number}
            </h3>

            <form onSubmit={handleInspectSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Missing Components (If any)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bandages missing (2 packs), Antiseptic bottle empty"
                  value={missingInput}
                  onChange={(e) => setMissingInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  Note: If missing components are specified, kit status will automatically change to "Needs Refill".
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Inspection Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Physical inspection notes..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {showRefillModal && selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-700" />
              Refill {selectedKit.kit_number}
            </h3>

            <form onSubmit={handleRefillSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Replenished Items Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replenished 5 Bandage packs, 1 Antiseptic bottle"
                  value={refillItemsInput}
                  onChange={(e) => setRefillItemsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Refill Voucher / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Refill supplier or stock voucher reference..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white text-xs font-extrabold rounded-xl shadow-md"
                >
                  Confirm & Restore Available Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
