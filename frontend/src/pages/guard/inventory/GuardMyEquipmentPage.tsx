import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment, KitMaster } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ShieldCheck,
  RefreshCw,
  QrCode,
  AlertCircle,
  Loader2,
  Tag,
  Layers,
} from "lucide-react";

export const GuardMyEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [kits, setKits] = useState<KitMaster[]>([]);

  // Refill Modal State
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [selectedKit, setSelectedKit] = useState<KitMaster | null>(null);
  const [refillRemarks, setRefillRemarks] = useState<string>("");
  const [submittingRefill, setSubmittingRefill] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const asgns = await inventoryService.getMyAssignments();
      setAssignments(asgns);
      setKits([]);
    } catch (err: any) {
      setError(err.message || "Failed to load assigned equipment and kits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRefillModal = (kit: KitMaster) => {
    setSelectedKit(kit);
    setRefillRemarks("");
    setShowRefillModal(true);
  };

  const handleSubmitRefillRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit) return;

    setSubmittingRefill(true);
    try {
      await inventoryService.inspectKit(selectedKit.id, {
        missing_components: "Requested Kit Refill by Guard",
        remarks: refillRemarks,
      });
      alert("Refill request submitted to Range Forest Officer successfully!");
      setShowRefillModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to submit refill request.");
    } finally {
      setSubmittingRefill(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading My Equipment & Kits...</p>
      </div>
    );
  }

  // Filter sections
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeKits = Array.isArray(kits) ? kits : [];

  const personalItems = safeAssignments.filter((a) => a.assignment_type === "PERSONAL" || a.status?.toUpperCase() === "ISSUED");
  const consumableItems = safeAssignments.filter((a) => a.item_usage_type === "CONSUMABLE" || a.status?.toUpperCase() === "CONSUMED");

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="My Issued Equipment & Kits"
        subtitle="View gear permanently or temporarily assigned to you, request kit refills, and track assignment history."
        icon={ShieldCheck}
        badge="Forest Guard Inventory"
      />

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {/* SECTION 1: PERSONAL & SAFETY EQUIPMENT */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Personal & Safety Equipment</h3>
        </div>

        {personalItems.length === 0 ? (
          <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 text-xs font-medium text-gray-500">
            No personal gear currently assigned to you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-emerald-950/10 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">{item.item_name || `Equipment #${item.id}`}</h4>
                    <span className="text-[11px] font-bold text-emerald-700">Qty: {item.quantity} {item.unit || "units"}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-600 border-t border-emerald-950/5 pt-2">
                  <div className="flex justify-between">
                    <span>Assigned Date:</span>
                    <strong className="text-emerald-950">{item.issue_date ? new Date(item.issue_date).toLocaleDateString() : "N/A"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Required:</span>
                    <strong className={item.assignment_type === "PERSONAL" ? "text-purple-700 font-bold" : "text-emerald-700 font-bold"}>
                      {item.assignment_type === "PERSONAL" ? "No (Permanent)" : "Yes"}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {item.status || "ISSUED"}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">ID #{item.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: REFILLABLE KITS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Refillable Kits</h3>
        </div>

        {safeKits.length === 0 ? (
          <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 text-xs font-medium text-gray-500">
            No refillable kits assigned to your monitoring station.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeKits.map((kit) => (
              <div key={kit.id} className="bg-white rounded-3xl border border-emerald-950/10 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">{kit.kit_name || kit.kit_number || `Kit #${kit.id}`}</h4>
                    <p className="text-[11px] font-medium text-gray-500">Status: <strong className={kit.current_status === "Available" ? "text-emerald-700" : "text-amber-700"}>{kit.current_status || "Available"}</strong></p>
                  </div>
                  <button
                    onClick={() => handleOpenRefillModal(kit)}
                    className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    Request Refill
                  </button>
                </div>

                {/* Kit Items List */}
                <div className="space-y-1.5 border-t border-emerald-950/5 pt-3">
                  <div className="text-[11px] font-bold text-emerald-950 uppercase">Kit Component Breakdown:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(kit.kit_items || []).map((ki) => (
                      <div key={ki.id} className="p-2 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                        <span className="font-semibold text-gray-800">{ki.item_name}</span>
                        <span className="font-bold text-emerald-900">{ki.current_quantity} / {ki.required_quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: CONSUMABLES */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Consumables Issued</h3>
        </div>

        {consumableItems.length === 0 ? (
          <div className="p-4 bg-white rounded-3xl border border-emerald-950/10 text-xs font-medium text-gray-500">
            No consumable items currently issued to you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {consumableItems.map((item) => (
              <div key={item.id} className="p-4 bg-white rounded-3xl border border-emerald-950/10 shadow-xs flex justify-between items-center">
                <div>
                  <div className="text-xs font-black text-emerald-950">{item.item_name || `Consumable #${item.id}`}</div>
                  <div className="text-[11px] font-semibold text-gray-500">Qty: {item.quantity} {item.unit || "units"}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                  CONSUMED
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REFILL REQUEST MODAL */}
      {showRefillModal && selectedKit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-emerald-950 uppercase tracking-wider">Request Kit Refill: {selectedKit.kit_name || selectedKit.kit_number || `Kit #${selectedKit.id}`}</h3>

            <form onSubmit={handleSubmitRefillRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-emerald-950 uppercase">Current Components:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(selectedKit.kit_items || []).map((ki) => (
                    <div key={ki.id} className="p-2.5 bg-emerald-50 rounded-xl text-xs flex justify-between items-center">
                      <span className="font-bold text-emerald-950">{ki.item_name}</span>
                      <span className="text-emerald-800 font-extrabold">Current: {ki.current_quantity} (Required: {ki.required_quantity})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Remarks / Missing Items Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify which items need replenishment..."
                  value={refillRemarks}
                  onChange={(e) => setRefillRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/15 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefill}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
                >
                  {submittingRefill ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-amber-300" />}
                  Submit Refill Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
