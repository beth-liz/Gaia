import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import { RotateCcw, AlertCircle, Loader2, Send } from "lucide-react";

export const GuardReturnEquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [condition, setCondition] = useState<string>("Good");
  const [reason, setReason] = useState<string>("Normal Return");
  const [remarks, setRemarks] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const asgns = await inventoryService.getMyAssignments();
      const returnable = asgns.filter((a) => a.status === "ISSUED" && a.item_usage_type !== "CONSUMABLE");
      setAssignments(returnable);
      if (returnable.length > 0) setSelectedAssignmentId(returnable[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to load active assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) {
      setError("Please select equipment to return.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.submitReturn({
        equipment_assignment_id: selectedAssignmentId,
        condition,
        reason,
        remarks,
      });

      alert("Equipment return submitted to Range Forest Officer for verification!");
      navigate("/guard/inventory/my-equipment");
    } catch (err: any) {
      setError(err.message || "Failed to submit equipment return.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Return Form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Return Issued Equipment"
        subtitle="Submit return requests for verification by Range Forest Officer upon mission completion or gear replacement."
        icon={RotateCcw}
        badge="Forest Guard Return"
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

      <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Equipment Selection */}
          <div>
            <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
              Select Equipment to Return *
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
            >
              {assignments.map((asgn) => (
                <option key={asgn.id} value={asgn.id}>
                  {asgn.item_name} (Qty: {asgn.quantity} | Issued: {new Date(asgn.issue_date).toLocaleDateString()})
                </option>
              ))}
              {assignments.length === 0 && <option value={0}>No active returnable equipment issued to you</option>}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
              Return Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
            >
              <option value="Normal Return">Normal Return (Mission Completed)</option>
              <option value="Damaged">Damaged (Needs Maintenance/Repair)</option>
              <option value="Lost">Lost (Gear Lost in Field Duty)</option>
              <option value="Consumed">Consumed (Partially Consumed)</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
              Equipment Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
            >
              <option value="Excellent">Excellent (Like New)</option>
              <option value="Good">Good (Working Condition)</option>
              <option value="Repair Needed">Repair Needed (Minor Wear/Tear)</option>
              <option value="Broken">Broken (Major Damage)</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
              Operational Remarks
            </label>
            <textarea
              rows={3}
              placeholder="State any field observations, damage notes, or serial number details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
            <button
              type="button"
              onClick={() => navigate("/guard/inventory/my-equipment")}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || assignments.length === 0}
              className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />}
              Submit Equipment Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
