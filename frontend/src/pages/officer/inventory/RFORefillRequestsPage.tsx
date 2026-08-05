import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { RefreshCw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export const RFORefillRequestsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kits, setKits] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getStationKits();
      setKits(data.filter((k: any) => k.current_status === "Needs Refill" || k.current_status === "Available"));
    } catch (err: any) {
      setError(err.message || "Failed to load kit refill requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefillKit = async (kitId: number, kitNumber: string) => {
    try {
      await inventoryService.refillKit(kitId, {
        items_refilled: "Complete Kit Replenishment & Verification",
        remarks: "Approved by Range Forest Officer",
      });
      alert(`Kit ${kitNumber} refilled successfully!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to refill kit.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Refill Requests Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Kit Refill Requests & Inspection"
        subtitle="Approve guard kit refill requests, inspect missing component breakdowns, and replenish kit items."
        icon={RefreshCw}
        badge="Refill Management"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kits.map((kit) => (
          <div key={kit.id} className="bg-white rounded-3xl border border-emerald-950/10 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-emerald-950">{kit.kit_name || kit.kit_number}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  kit.current_status === "Needs Refill" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                }`}>
                  {kit.current_status}
                </span>
              </div>
              <button
                onClick={() => handleRefillKit(kit.id, kit.kit_number)}
                className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                Approve Refill
              </button>
            </div>

            <div className="space-y-1.5 border-t border-emerald-950/5 pt-3">
              <div className="text-[11px] font-bold text-emerald-950 uppercase">Component Status:</div>
              <div className="grid grid-cols-2 gap-2">
                {kit.kit_items.map((ki: any) => (
                  <div key={ki.id} className="p-2 bg-gray-50 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{ki.item_name}</span>
                    <span className="font-bold text-emerald-900">{ki.current_quantity} / {ki.required_quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {kits.length === 0 && (
          <div className="col-span-2 p-8 bg-white rounded-3xl border border-emerald-950/10 text-center text-gray-500 font-medium">
            No kits requiring inspection or refill.
          </div>
        )}
      </div>
    </div>
  );
};
