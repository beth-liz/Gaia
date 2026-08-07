import React, { useEffect, useState, useMemo } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { StationInventory, EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Send,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle,
  ShieldAlert,
  UserCheck,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface GuardUser {
  id: number;
  full_name: string;
  badge_number?: string;
  role: string;
  station_name?: string;
  equipment_count?: number;
  assignments_today?: number;
  current_workload?: number;
}

interface SelectedIssueItem {
  station_inventory_id: number;
  equipment_name: string;
  category: string;
  unit: string;
  available_stock: number;
  quantity: number;
  usage_type: "Temporary" | "Permanent";
  return_required: boolean;
  expected_return_date: string;
  purpose: string;
  remarks: string;
}

export const RFOIssueEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Wizard Step (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data Collections
  const [guards, setGuards] = useState<GuardUser[]>([]);
  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [guardAssignedGear, setGuardAssignedGear] = useState<EquipmentAssignment[]>([]);

  // Step 1: Selected Guard
  const [selectedGuardId, setSelectedGuardId] = useState<number>(0);
  const [guardSearchQuery, setGuardSearchQuery] = useState<string>("");

  // Step 3: Selected Equipment Items & Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>("");
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<number, SelectedIssueItem>>({});

  // Overall Mission Details
  const [missionName, setMissionName] = useState<string>("");
  const [overallRemarks, setOverallRemarks] = useState<string>("");

  // Officer Name
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
      const [stInv, guardsList] = await Promise.all([
        inventoryService.getMyStationInventory(),
        inventoryService.getForestGuards(),
      ]);
      setStationInventory(stInv);
      setGuards(guardsList);

      if (guardsList.length > 0 && selectedGuardId === 0) {
        setSelectedGuardId(guardsList[0].id);
        fetchGuardAssignments(guardsList[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load station guards or inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardAssignments = async (guardId: number) => {
    try {
      const asgns = await inventoryService.getGuardAssignments(guardId);
      setGuardAssignedGear(asgns.filter((a) => a.status === "ISSUED"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Guard Selection in Step 1
  const handleSelectGuard = (guardId: number) => {
    setSelectedGuardId(guardId);
    fetchGuardAssignments(guardId);
  };

  const selectedGuard = useMemo(() => {
    return guards.find((g) => g.id === selectedGuardId) || guards[0] || null;
  }, [guards, selectedGuardId]);

  // Filtered Guards for Step 1
  const filteredGuards = useMemo(() => {
    if (!guardSearchQuery.trim()) return guards;
    const term = guardSearchQuery.toLowerCase();
    return guards.filter(
      (g) =>
        g.full_name.toLowerCase().includes(term) ||
        (g.badge_number && g.badge_number.toLowerCase().includes(term)) ||
        (g.role && g.role.toLowerCase().includes(term))
    );
  }, [guards, guardSearchQuery]);

  // Categories list for Step 3
  const categoriesList = useMemo<string[]>(() => {
    const cats = Array.from(new Set(stationInventory.map((i) => i.category || "").filter(Boolean)));
    return ["ALL", ...cats];
  }, [stationInventory]);

  // Filtered Inventory for Step 3
  const filteredInventory = useMemo(() => {
    return stationInventory.filter((item) => {
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSearch =
        !equipmentSearchQuery ||
        (item.item_name || "").toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(equipmentSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [stationInventory, selectedCategory, equipmentSearchQuery]);

  // Toggle Item Selection in Step 3
  const handleToggleItemSelection = (item: StationInventory) => {
    setSelectedItemsMap((prev) => {
      const copy = { ...prev };
      if (copy[item.id]) {
        delete copy[item.id];
      } else {
        const defaultReturnDate = new Date();
        defaultReturnDate.setDate(defaultReturnDate.getDate() + 7);
        const returnDateStr = defaultReturnDate.toISOString().split("T")[0];

        copy[item.id] = {
          station_inventory_id: item.id,
          equipment_name: item.item_name || "Equipment",
          category: item.category || "General",
          unit: item.unit || "Units",
          available_stock: item.available_quantity,
          quantity: 1,
          usage_type: item.consumable ? "Permanent" : "Temporary",
          return_required: !item.consumable,
          expected_return_date: returnDateStr,
          purpose: "",
          remarks: "",
        };
      }
      return copy;
    });
  };

  // Update item selection field in Step 3
  const handleUpdateItemField = (itemId: number, field: keyof SelectedIssueItem, value: any) => {
    setSelectedItemsMap((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: value,
        },
      };
    });
  };

  const selectedItemsList = useMemo(() => {
    return Object.values(selectedItemsMap);
  }, [selectedItemsMap]);

  // Navigation handlers
  const handleNextFromStep1 = () => {
    if (!selectedGuard) {
      setError("Please select a Forest Guard to proceed.");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setError(null);
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    if (selectedItemsList.length === 0) {
      setError("Please select at least one equipment item to issue.");
      return;
    }

    // Validate quantities
    for (const item of selectedItemsList) {
      if (isNaN(item.quantity) || item.quantity <= 0) {
        setError(`Quantity for '${item.equipment_name}' must be a positive integer.`);
        return;
      }
      if (item.quantity > item.available_stock) {
        setError(
          `Quantity for '${item.equipment_name}' (${item.quantity}) exceeds available stock (${item.available_stock}).`
        );
        return;
      }
      if (item.usage_type === "Temporary" && !item.expected_return_date) {
        setError(`Expected Return Date is required for temporary equipment '${item.equipment_name}'.`);
        return;
      }
    }

    setError(null);
    setCurrentStep(4);
  };

  // Submit Final Step 4 Batch Issuance
  const handleConfirmBatchIssue = async () => {
    if (!selectedGuard) return;
    if (selectedItemsList.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.batchIssueEquipment({
        guard_id: selectedGuard.id,
        items: selectedItemsList.map((i) => ({
          station_inventory_id: i.station_inventory_id,
          quantity: i.quantity,
          usage_type: i.usage_type,
          expected_return_date: i.usage_type === "Temporary" && i.expected_return_date ? `${i.expected_return_date}T18:00:00` : undefined,
          purpose: i.purpose || missionName || undefined,
          remarks: i.remarks || overallRemarks || undefined,
        })),
        mission_name: missionName || undefined,
        overall_purpose: missionName || undefined,
        remarks: overallRemarks || undefined,
      });

      showToast("Equipment Issued Successfully", "success");
      fetchData();
      // Reset wizard
      setCurrentStep(1);
      setSelectedItemsMap({});
      setMissionName("");
      setOverallRemarks("");
    } catch (err: any) {
      setError(err.message || "Failed to issue equipment.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="text-sm font-medium text-emerald-950">Loading Forest Guards & Station Equipment Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Issue Equipment Wizard"
        subtitle="Step-by-step workflow to assign equipment, review current guard gear, set return dates, and log atomic stock dispatches."
        icon={Send}
        badge="Multi-Item Issue Wizard"
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
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="font-bold text-lg">×</button>
        </div>
      )}

      {/* WIZARD PROGRESS BAR HEADER */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-extrabold">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col items-center gap-1 ${
              currentStep === 1
                ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                : currentStep > 1
                ? "bg-emerald-100/70 text-emerald-950 border-emerald-300"
                : "bg-emerald-950/5 text-gray-500 border-emerald-950/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {currentStep > 1 ? <Check className="w-4 h-4 text-emerald-700 font-black" /> : <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">1</span>}
              <span>1. Choose Guard</span>
            </div>
            <span className="text-[10px] font-medium opacity-80 truncate hidden sm:block">Select Target Officer</span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => selectedGuard && setCurrentStep(2)}
            className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col items-center gap-1 ${
              currentStep === 2
                ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                : currentStep > 2
                ? "bg-emerald-100/70 text-emerald-950 border-emerald-300"
                : "bg-emerald-950/5 text-gray-500 border-emerald-950/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {currentStep > 2 ? <Check className="w-4 h-4 text-emerald-700 font-black" /> : <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">2</span>}
              <span>2. Current Gear</span>
            </div>
            <span className="text-[10px] font-medium opacity-80 truncate hidden sm:block">Review Assigned Items</span>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => selectedGuard && setCurrentStep(3)}
            className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col items-center gap-1 ${
              currentStep === 3
                ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                : currentStep > 3
                ? "bg-emerald-100/70 text-emerald-950 border-emerald-300"
                : "bg-emerald-950/5 text-gray-500 border-emerald-950/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {currentStep > 3 ? <Check className="w-4 h-4 text-emerald-700 font-black" /> : <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">3</span>}
              <span>3. Choose Equipment</span>
            </div>
            <span className="text-[10px] font-medium opacity-80 truncate hidden sm:block">Multi-Select & Quantities</span>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => selectedGuard && selectedItemsList.length > 0 && setCurrentStep(4)}
            className={`p-3 rounded-2xl cursor-pointer border transition-all flex flex-col items-center gap-1 ${
              currentStep === 4
                ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                : "bg-emerald-950/5 text-gray-500 border-emerald-950/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">4</span>
              <span>4. Review & Confirm</span>
            </div>
            <span className="text-[10px] font-medium opacity-80 truncate hidden sm:block">Summary & Execute</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHOOSE FOREST GUARD */}
      {currentStep === 1 && (
        <div className="space-y-4 bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-950/10 pb-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-700" />
                Step 1: Choose Forest Guard
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Select the Forest Guard or Beat Officer receiving equipment.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search guard by name or badge..."
                value={guardSearchQuery}
                onChange={(e) => setGuardSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>
          </div>

          {/* Guard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredGuards.map((g) => {
              const isSelected = selectedGuardId === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => handleSelectGuard(g.id)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all space-y-3 relative ${
                    isSelected
                      ? "bg-emerald-900 text-white border-emerald-950 shadow-lg ring-2 ring-emerald-800"
                      : "bg-white hover:bg-emerald-50/50 border-emerald-950/10 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${
                        isSelected ? "bg-amber-400 text-emerald-950" : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {g.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black truncate">{g.full_name}</h4>
                      <p className={`text-[11px] font-semibold ${isSelected ? "text-emerald-200" : "text-gray-500"}`}>
                        {g.role || "Forest Guard"}
                      </p>
                      {g.badge_number && (
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-amber-300" : "text-emerald-800"}`}>
                          Badge #{g.badge_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-extrabold pt-2 border-t border-emerald-950/10">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {g.station_name || "Assigned Station"}
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                      isSelected ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-900"
                    }`}>
                      {g.equipment_count || 0} Items Currently Issued
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-emerald-950/5">
            <button
              onClick={handleNextFromStep1}
              disabled={!selectedGuard}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              Next: Current Equipment <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CURRENT ASSIGNED EQUIPMENT (SEPARATE CARD) */}
      {currentStep === 2 && selectedGuard && (
        <div className="space-y-4 bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                Step 2: Currently Assigned Equipment for {selectedGuard.full_name}
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Review equipment currently issued to {selectedGuard.full_name} before issuing new gear.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black">
              {guardAssignedGear.length} Items Deployed
            </span>
          </div>

          {/* Current Assigned Equipment List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Usage Type</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {guardAssignedGear.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-emerald-50/20 transition-all">
                    <td className="px-4 py-3 font-extrabold text-emerald-950">
                      {asgn.item_name || "Equipment Item"} ({asgn.quantity} Units)
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{formatDate(asgn.issue_date)}</td>
                    <td className="px-4 py-3 font-mono text-amber-800">{formatDate(asgn.expected_return_date)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-lg text-[10px] font-black">
                        {asgn.assignment_type || "MISSION"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-black">
                        Good Condition
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-black">
                        ISSUED
                      </span>
                    </td>
                  </tr>
                ))}
                {guardAssignedGear.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium italic">
                      No equipment currently assigned to {selectedGuard.full_name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-emerald-950/5">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 1
            </button>
            <button
              onClick={handleNextFromStep2}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              Next: Choose Equipment <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE EQUIPMENT (MULTI-SELECTION GRID) */}
      {currentStep === 3 && (
        <div className="space-y-4 bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-950/10 pb-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                Step 3: Choose Equipment to Issue
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Select single or multiple equipment items, set quantities, usage types, and expected return dates.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search station inventory..."
                value={equipmentSearchQuery}
                onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-emerald-900 text-white shadow-xs"
                    : "bg-emerald-950/5 text-emerald-950 hover:bg-emerald-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Equipment Multi-Select Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredInventory.map((item) => {
              const selectedConfig = selectedItemsMap[item.id];
              const isChecked = !!selectedConfig;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all space-y-3 ${
                    isChecked
                      ? "bg-emerald-50/70 border-emerald-800 shadow-md ring-2 ring-emerald-800/40"
                      : "bg-white hover:bg-emerald-50/30 border-emerald-950/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItemSelection(item)}
                        className="w-5 h-5 text-emerald-900 focus:ring-emerald-800 rounded-md cursor-pointer"
                      />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">{item.item_name}</h4>
                        <span className="text-[10px] text-emerald-800 font-bold block">{item.category}</span>
                      </div>
                    </label>

                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-black block">
                        {item.available_quantity} {item.unit} Available
                      </span>
                    </div>
                  </div>

                  {/* Expanded Controls when checked */}
                  {isChecked && (
                    <div className="pt-3 border-t border-emerald-950/10 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-950 mb-1">
                            Quantity to Issue *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.available_quantity}
                            required
                            value={selectedConfig.quantity}
                            onChange={(e) =>
                              handleUpdateItemField(item.id, "quantity", parseInt(e.target.value) || 1)
                            }
                            className="w-full px-3 py-2 border border-emerald-950/10 rounded-xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-950 mb-1">
                            Usage Type *
                          </label>
                          <select
                            value={selectedConfig.usage_type}
                            onChange={(e) =>
                              handleUpdateItemField(item.id, "usage_type", e.target.value as any)
                            }
                            className="w-full px-3 py-2 border border-emerald-950/10 rounded-xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                          >
                            <option value="Temporary">Temporary (Returnable)</option>
                            <option value="Permanent">Permanent (Issued)</option>
                          </select>
                        </div>
                      </div>

                      {selectedConfig.usage_type === "Temporary" && (
                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-950 mb-1">
                            Expected Return Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={selectedConfig.expected_return_date}
                            onChange={(e) =>
                              handleUpdateItemField(item.id, "expected_return_date", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-emerald-950/10 rounded-xl bg-white text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-950 mb-1">
                            Purpose / Mission
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Monsoon Patrol Mission"
                            value={selectedConfig.purpose}
                            onChange={(e) => handleUpdateItemField(item.id, "purpose", e.target.value)}
                            className="w-full px-3 py-2 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-emerald-950 mb-1">
                            Remarks
                          </label>
                          <input
                            type="text"
                            placeholder="Voucher note..."
                            value={selectedConfig.remarks}
                            onChange={(e) => handleUpdateItemField(item.id, "remarks", e.target.value)}
                            className="w-full px-3 py-2 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-emerald-950/5">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 2
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-emerald-900">
                {selectedItemsList.length} Items Selected
              </span>
              <button
                onClick={handleNextFromStep3}
                disabled={selectedItemsList.length === 0}
                className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2"
              >
                Next: Review Summary <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {currentStep === 4 && selectedGuard && (
        <div className="space-y-4 bg-white rounded-3xl p-6 border border-emerald-950/10 shadow-xs">
          <div className="border-b border-emerald-950/10 pb-4">
            <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Step 4: Review & Confirm Equipment Issuance
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              Verify officer, guard, selected equipment, quantities, and return dates before executing transaction.
            </p>
          </div>

          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">Logging Officer</span>
              <strong className="text-xs font-extrabold text-emerald-950 block">{officerName}</strong>
              <span className="text-[11px] text-gray-500 font-semibold block">Range Forest Officer</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">Recipient Forest Guard</span>
              <strong className="text-xs font-extrabold text-emerald-950 block">{selectedGuard.full_name}</strong>
              <span className="text-[11px] text-emerald-800 font-semibold block">Badge #{selectedGuard.badge_number || "N/A"} • {selectedGuard.station_name || "Station"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">Overall Mission / Purpose</span>
              <input
                type="text"
                placeholder="Overall patrol mission name..."
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                className="w-full px-3 py-1.5 border border-emerald-950/10 rounded-xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          {/* Selected Equipment Table Summary */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Issued Qty</th>
                  <th className="px-4 py-3">Usage Type</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {selectedItemsList.map((i) => (
                  <tr key={i.station_inventory_id} className="hover:bg-emerald-50/20 transition-all">
                    <td className="px-4 py-3 font-extrabold text-emerald-950">{i.equipment_name}</td>
                    <td className="px-4 py-3">{i.category}</td>
                    <td className="px-4 py-3 font-mono font-black text-emerald-800">{i.quantity} {i.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                        i.usage_type === "Temporary" ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      }`}>
                        {i.usage_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{i.usage_type === "Temporary" ? formatDate(i.expected_return_date) : "N/A (Permanent)"}</td>
                    <td className="px-4 py-3 text-gray-500">{i.purpose || missionName || "Field Assignment"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-emerald-950/5">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 3
            </button>

            <button
              onClick={handleConfirmBatchIssue}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4 text-amber-300" />
              Confirm & Issue Equipment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
