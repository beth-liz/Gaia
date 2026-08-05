import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import { api } from "@/services/api";
import type { StationInventory, EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Send,
  Calendar,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Layers,
} from "lucide-react";

interface GuardItem {
  id: number;
  full_name: string;
  badge_number?: string;
}

export const RFOIssueEquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [guards, setGuards] = useState<GuardItem[]>([]);
  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [assignedGear, setAssignedGear] = useState<EquipmentAssignment[]>([]);

  // Step state
  const [guardId, setGuardId] = useState<number>(0);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Form Fields
  const [quantity, setQuantity] = useState<number>(1);
  const [assignmentType, setAssignmentType] = useState<string>("MISSION"); // PERSONAL, MISSION
  const [itemUsageType, setItemUsageType] = useState<string>("RETURNABLE"); // RETURNABLE, CONSUMABLE
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stInv, guardsList, allAsgns] = await Promise.all([
        inventoryService.getMyStationInventory(),
        api.getStationGuards(),
        inventoryService.getStationAssignments(),
      ]);
      setStationInventory(stInv);
      setGuards(guardsList);

      if (guardsList.length > 0) {
        setGuardId(guardsList[0].id);
        const guardAsgns = allAsgns.filter((a) => a.guard_id === guardsList[0].id && a.status === "ISSUED");
        setAssignedGear(guardAsgns);
      }
      if (stInv.length > 0) setSelectedInventoryId(stInv[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to load station guards or inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGuardChange = async (newGuardId: number) => {
    setGuardId(newGuardId);
    try {
      const allAsgns = await inventoryService.getStationAssignments();
      const guardAsgns = allAsgns.filter((a) => a.guard_id === newGuardId && a.status === "ISSUED");
      setAssignedGear(guardAsgns);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedItem = stationInventory.find((i) => i.id === selectedInventoryId);

  // Filtered inventory list
  const filteredInventory = stationInventory.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      (item.item_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.item_code && item.item_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(stationInventory.map((i) => i.category)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId || !selectedInventoryId) {
      setError("Please select both a Forest Guard and Equipment item.");
      return;
    }

    if (selectedItem && quantity > selectedItem.available_quantity) {
      setError(`Cannot issue ${quantity} units! Only ${selectedItem.available_quantity} units available in stock.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.directIssueEquipment({
        guard_id: guardId,
        station_inventory_id: selectedInventoryId,
        quantity,
        assignment_type: assignmentType,
        item_usage_type: itemUsageType,
        expected_return_date: expectedReturnDate || undefined,
        purpose,
        remarks,
      });

      alert("Equipment issued successfully! Notification sent to Forest Guard.");
      navigate("/officer/inventory/assigned");
    } catch (err: any) {
      setError(err.message || "Failed to issue equipment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Issue Equipment Workflow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Issue Equipment to Forest Guard"
        subtitle="Interactive 4-step allocation workflow with guard history, inventory search, and personal vs mission assignments."
        icon={Send}
        badge="Forest Dept Workflow"
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

      {/* STEP 1: CHOOSE FOREST GUARD */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white font-black text-xs flex items-center justify-center">1</div>
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Step 1: Choose Forest Guard (Assigned Station Only)</h3>
        </div>

        <div>
          <select
            value={guardId}
            onChange={(e) => handleGuardChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-emerald-950/15 rounded-2xl bg-emerald-950/5 text-sm font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
          >
            {guards.map((g) => (
              <option key={g.id} value={g.id}>
                {g.full_name} {g.badge_number ? `(Badge: ${g.badge_number})` : ""}
              </option>
            ))}
            {guards.length === 0 && <option value={0}>No Forest Guards assigned to your monitoring station</option>}
          </select>
        </div>

        {/* STEP 2: ALREADY ASSIGNED EQUIPMENT PANEL */}
        <div className="pt-3 border-t border-emerald-950/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Step 2: Currently Assigned Equipment for Selected Guard ({assignedGear.length} Items)
            </h4>
          </div>

          {assignedGear.length === 0 ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-500 text-center">
              No active equipment currently assigned to this guard.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignedGear.map((asgn) => (
                <div key={asgn.id} className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-extrabold text-emerald-950">{asgn.item_name}</div>
                    <div className="text-[11px] text-emerald-800/80 font-medium">Qty: {asgn.quantity} {asgn.unit || "units"} | Issued: {new Date(asgn.issue_date).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${asgn.assignment_type === "PERSONAL" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                    {asgn.assignment_type || "MISSION"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 & 4: AVAILABLE EQUIPMENT & CONFIGURATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 3: AVAILABLE EQUIPMENT SEARCH */}
        <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900 text-white font-black text-xs flex items-center justify-center">3</div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Step 3: Select Available Equipment</h3>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-950/40 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search equipment by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Radio / Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {filteredInventory.map((item) => {
              const isSelected = item.id === selectedInventoryId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedInventoryId(item.id);
                    setItemUsageType(item.item_usage_type || "RETURNABLE");
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? "border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-600/30" : "border-emerald-950/10 hover:bg-gray-50"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                      <span>{item.item_name}</span>
                    </div>
                    <div className="text-[11px] font-medium text-emerald-800/80">
                      Available: <strong className="text-emerald-900">{item.available_quantity} {item.unit}</strong> | Cat: {item.category}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${item.item_usage_type === "CONSUMABLE" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                    {item.item_usage_type || "RETURNABLE"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 4: ISSUE DETAILS & SUBMIT */}
        <div className="bg-white rounded-3xl border border-emerald-950/10 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900 text-white font-black text-xs flex items-center justify-center">4</div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Step 4: Configure Issue Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                Issue Quantity *
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem?.available_quantity || 999}
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                Assignment Type *
              </label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value)}
                className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
              >
                <option value="MISSION">MISSION (Temporary - Returns later)</option>
                <option value="PERSONAL">PERSONAL (Permanent - Helmet, Uniform, Boots)</option>
              </select>
            </div>

            {/* Usage Type */}
            <div>
              <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                Usage Type *
              </label>
              <select
                value={itemUsageType}
                onChange={(e) => setItemUsageType(e.target.value)}
                className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none"
              >
                <option value="RETURNABLE">RETURNABLE (Must be returned)</option>
                <option value="CONSUMABLE">CONSUMABLE (Deducts stock directly)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purpose / Mission */}
            <div>
              <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                Mission / Patrol Sector Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 4 Tiger Tracking Mission"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Expected Return Date ({itemUsageType === "CONSUMABLE" ? "N/A for Consumables" : "Optional"})
              </label>
              <input
                type="date"
                disabled={itemUsageType === "CONSUMABLE" || assignmentType === "PERSONAL"}
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Operational Remarks */}
          <div>
            <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
              Operational Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Additional authorization or serial number notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-emerald-950/10">
            <button
              type="button"
              onClick={() => navigate("/officer/inventory/dashboard")}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || guards.length === 0 || !selectedItem}
              className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />}
              Confirm & Issue Equipment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
