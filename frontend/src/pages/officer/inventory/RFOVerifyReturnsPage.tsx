import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { CheckCircle2, AlertCircle, Loader2, Wrench, Trash2 } from "lucide-react";

export const RFOVerifyReturnsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [returnsList, setReturnsList] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getStationReturns();
      setReturnsList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load station return submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (returnId: number, action: string) => {
    try {
      await inventoryService.verifyReturn(returnId, { action });
      alert(`Return ${action.toLowerCase()} processed successfully!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to verify return submission.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Equipment Returns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Verify Equipment Returns"
        subtitle="Review returned field gear, inspect condition, and execute Accept Return, Send Repair, or Write Off actions."
        icon={CheckCircle2}
        badge="RFO Verification"
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

      <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-950/5 text-emerald-950 font-black uppercase text-[10px] tracking-wider border-b border-emerald-950/10">
              <tr>
                <th className="px-5 py-3.5">Guard</th>
                <th className="px-5 py-3.5">Equipment</th>
                <th className="px-5 py-3.5">Condition</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 font-semibold text-emerald-950">
              {returnsList.map((ret) => (
                <tr key={ret.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold">{ret.guard_name || `Guard #${ret.guard_id}`}</td>
                  <td className="px-5 py-3.5">{ret.item_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${ret.condition === "Excellent" || ret.condition === "Good" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                      {ret.condition}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{ret.reason}</td>
                  <td className="px-5 py-3.5 text-gray-500">{new Date(ret.submitted_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${ret.status === "Pending Verification" ? "bg-amber-100 text-amber-900" : ret.status === "ACCEPT" ? "bg-emerald-100 text-emerald-900" : "bg-blue-100 text-blue-900"}`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {ret.status === "Pending Verification" ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleVerify(ret.id, "ACCEPT")}
                          className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-[10px] font-black uppercase shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-amber-300" /> Accept
                        </button>
                        <button
                          onClick={() => handleVerify(ret.id, "REPAIR")}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase shadow-xs flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" /> Repair
                        </button>
                        <button
                          onClick={() => handleVerify(ret.id, "WRITE_OFF")}
                          className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[10px] font-black uppercase shadow-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Write Off
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-bold text-[10px]">Verified</span>
                    )}
                  </td>
                </tr>
              ))}
              {returnsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500 font-medium">
                    No return submissions pending verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
