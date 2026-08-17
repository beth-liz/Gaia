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
  Lock,
  Radio,
  HeartPulse,
  Compass,
  Tent,
  Eye,
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

  // Controlled Step Progress (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [step1Completed, setStep1Completed] = useState<boolean>(false);
  const [step2Completed, setStep2Completed] = useState<boolean>(false);
  const [step3Completed, setStep3Completed] = useState<boolean>(false);

  // Data Collections
  const [guards, setGuards] = useState<GuardUser[]>([]);
  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [guardAssignedGear, setGuardAssignedGear] = useState<EquipmentAssignment[]>([]);

  // Step 1: Selected Guard (Default 0 = None Selected)
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
    } catch (err: any) {
      setError(err.message || "Failed to load station guards or inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuardAssignments = async (guardId: number) => {
    try {
      const asgns = await inventoryService.getGuardAssignments(guardId);
      setGuardAssignedGear(
        asgns.filter((a) => {
          const s = (a.status || "").toUpperCase();
          return s === "ISSUED" || s === "ACTIVE" || s === "ASSIGNED" || s === "PENDING_RETURN";
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // STEP 1 HANDLER: SELECT FOREST GUARD (KEEPS USER ON STEP 1 WITH CONFIRMATION & CONTINUE BUTTON)
  const handleSelectGuardCard = (guard: GuardUser) => {
    setError(null);
    setSelectedGuardId(guard.id);
    fetchGuardAssignments(guard.id);
    setStep1Completed(true);
  };

  const handleStep1Continue = () => {
    if (!selectedGuardId) {
      setError("Please select a Forest Guard to proceed.");
      return;
    }
    setError(null);
    setMaxUnlockedStep((prev) => Math.max(prev, 2));
    setCurrentStep(2); // Navigate to Step 2 on explicit button click
  };

  const selectedGuard = useMemo(() => {
    return guards.find((g) => g.id === selectedGuardId) || null;
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

  // STEP 2 HANDLER: CONTINUE FROM CURRENT GEAR -> UNLOCK & NAVIGATE TO STEP 3
  const handleNextFromStep2 = () => {
    setError(null);
    setStep2Completed(true);
    setMaxUnlockedStep((prev) => Math.max(prev, 3));
    setCurrentStep(3); // Automatically navigate to Step 3
  };

  // STEP 3 HANDLER: CONTINUE FROM CHOOSE EQUIPMENT -> UNLOCK & NAVIGATE TO STEP 4
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
        setError(`Please select an expected return date for temporary item '${item.equipment_name}'.`);
        return;
      }
    }

    setError(null);
    setStep3Completed(true);
    setMaxUnlockedStep((prev) => Math.max(prev, 4));

    // Autofill default mission name if empty
    if (!missionName.trim() && selectedGuard) {
      const todayStr = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
      setMissionName(`Field Operations & Patrol Duty (${todayStr})`);
    }

    setCurrentStep(4); // Automatically navigate to Step 4
  };

  // STEP 4 HANDLER: CONFIRM & SUBMIT DIRECT ISSUANCE TO POSTGRESQL
  const handleSubmitIssuance = async () => {
    if (!selectedGuard) {
      setError("No Forest Guard selected. Please select a Forest Guard in Step 1.");
      return;
    }

    if (selectedItemsList.length === 0) {
      setError("No equipment items selected for issuance. Please select equipment in Step 3.");
      return;
    }

    if (!missionName.trim()) {
      setError("Operation / Mission Name is required. Please specify an operation or mission title before confirming issuance.");
      return;
    }

    // Validate each selected item before sending request
    for (const item of selectedItemsList) {
      if (isNaN(item.quantity) || item.quantity <= 0) {
        setError(`Invalid quantity (${item.quantity}) for '${item.equipment_name}'. Quantity must be a positive integer.`);
        return;
      }
      if (item.quantity > item.available_stock) {
        setError(
          `Requested quantity (${item.quantity}) for '${item.equipment_name}' exceeds available station stock (${item.available_stock}).`
        );
        return;
      }
      if (item.usage_type === "Temporary" && !item.expected_return_date) {
        setError(`Expected return date is required for temporary equipment '${item.equipment_name}'.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      // Loop over items and issue each sequentially
      for (const item of selectedItemsList) {
        await inventoryService.directIssueEquipment({
          guard_id: selectedGuard.id,
          station_inventory_id: item.station_inventory_id,
          quantity: item.quantity,
          assignment_type: "MISSION",
          purpose: item.purpose || missionName || "Field Patrol Operation",
          item_usage_type: item.usage_type === "Permanent" ? "CONSUMABLE" : "RETURNABLE",
          expected_return_date: item.usage_type === "Temporary" ? item.expected_return_date : undefined,
          remarks: item.remarks || overallRemarks || undefined,
        });
      }

      showToast(`Successfully issued ${selectedItemsList.length} item(s) to ${selectedGuard.full_name}!`, "success");

      // Reset wizard cleanly to Step 1
      setSelectedGuardId(0);
      setSelectedItemsMap({});
      setMissionName("");
      setOverallRemarks("");
      setStep1Completed(false);
      setStep2Completed(false);
      setStep3Completed(false);
      setMaxUnlockedStep(1);
      setCurrentStep(1);

      // Refresh background inventory
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to complete equipment issuance.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // Safe Header Step Click Handler
  const handleHeaderStepClick = (stepNumber: number) => {
    if (stepNumber <= maxUnlockedStep) {
      setError(null);
      setCurrentStep(stepNumber);
    }
  };

  // Requirement 3: Professional Category Badge Renderer with icons & subtle Gaia colors
  const renderCategoryBadge = (category: string) => {
    const cat = (category || "").toUpperCase();
    if (cat.includes("COMMUNICATION")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-blue-50/90 text-blue-900 border border-blue-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <Radio className="w-3 h-3 text-blue-600" /> {category}
        </span>
      );
    } else if (cat.includes("MEDICAL")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-rose-50/90 text-rose-950 border border-rose-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <HeartPulse className="w-3 h-3 text-rose-600" /> {category}
        </span>
      );
    } else if (cat.includes("SAFETY")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-amber-50/90 text-amber-950 border border-amber-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-600" /> {category}
        </span>
      );
    } else if (cat.includes("NAVIGATION") || cat.includes("ELECTRONIC")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-indigo-50/90 text-indigo-950 border border-indigo-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <Compass className="w-3 h-3 text-indigo-600" /> {category}
        </span>
      );
    } else if (cat.includes("CAMPING") || cat.includes("CONSUMABLE")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-emerald-50/90 text-emerald-950 border border-emerald-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <Tent className="w-3 h-3 text-emerald-700" /> {category}
        </span>
      );
    } else if (cat.includes("SURVEILLANCE") || cat.includes("OPTIC") || cat.includes("RESCUE")) {
      return (
        <span className="px-2.5 py-1 rounded-xl bg-purple-50/90 text-purple-950 border border-purple-200 text-[10px] font-extrabold inline-flex items-center gap-1">
          <Eye className="w-3 h-3 text-purple-600" /> {category}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 text-[10px] font-extrabold inline-flex items-center gap-1">
        <Package className="w-3 h-3 text-gray-600" /> {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Issue Equipment Wizard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-all duration-300 ease-in-out">
      <PageHeader
        title="Issue Equipment Wizard"
        subtitle="Step-by-step guided workflow to assign equipment, review current guard gear, set return dates, and log atomic stock dispatches."
        icon={Send}
        badge="Multi-Item Issue Wizard"
      />

      {/* Global Toast Notification */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg transition-all duration-300 ${
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
          <button onClick={() => setToastMsg(null)} className="text-white hover:opacity-80 font-black text-base ml-4 font-bold cursor-pointer">
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
          <button onClick={() => setError(null)} className="font-bold text-lg cursor-pointer">×</button>
        </div>
      )}

      {/* WIZARD PROGRESS BAR HEADER (REQUIREMENTS 4, 5, 6: ENHANCED VISIBILITY, HIGHLIGHT & COMPLETED STATES) */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
        <div className="grid grid-cols-4 gap-3 text-center text-xs font-extrabold">
          {/* Step 1: Select Forest Guard */}
          <div
            onClick={() => handleHeaderStepClick(1)}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 ${
              currentStep === 1
                ? "bg-white text-emerald-950 border-2 border-emerald-800 shadow-md ring-2 ring-emerald-600/20 scale-[1.02] cursor-pointer"
                : step1Completed
                ? "bg-emerald-50/90 text-emerald-950 border border-emerald-400 cursor-pointer"
                : "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {step1Completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">
                  1
                </span>
              )}
              <span className="font-extrabold">1. Choose Guard</span>
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate hidden sm:block">Select Target Officer</span>
          </div>

          {/* Step 2: Current Gear */}
          <div
            onClick={() => handleHeaderStepClick(2)}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 ${
              maxUnlockedStep < 2
                ? "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-not-allowed"
                : currentStep === 2
                ? "bg-white text-emerald-950 border-2 border-emerald-800 shadow-md ring-2 ring-emerald-600/20 scale-[1.02] cursor-pointer"
                : step2Completed
                ? "bg-emerald-50/90 text-emerald-950 border border-emerald-400 cursor-pointer"
                : "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {maxUnlockedStep < 2 ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : step2Completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">
                  2
                </span>
              )}
              <span className="font-extrabold">2. Current Gear</span>
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate hidden sm:block">Review Assigned Items</span>
          </div>

          {/* Step 3: Choose Equipment */}
          <div
            onClick={() => handleHeaderStepClick(3)}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 ${
              maxUnlockedStep < 3
                ? "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-not-allowed"
                : currentStep === 3
                ? "bg-white text-emerald-950 border-2 border-emerald-800 shadow-md ring-2 ring-emerald-600/20 scale-[1.02] cursor-pointer"
                : step3Completed
                ? "bg-emerald-50/90 text-emerald-950 border border-emerald-400 cursor-pointer"
                : "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {maxUnlockedStep < 3 ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : step3Completed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">
                  3
                </span>
              )}
              <span className="font-extrabold">3. Choose Equipment</span>
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate hidden sm:block">Multi-Select & Quantities</span>
          </div>

          {/* Step 4: Review & Confirm */}
          <div
            onClick={() => handleHeaderStepClick(4)}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 ${
              maxUnlockedStep < 4
                ? "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-not-allowed"
                : currentStep === 4
                ? "bg-white text-emerald-950 border-2 border-emerald-800 shadow-md ring-2 ring-emerald-600/20 scale-[1.02] cursor-pointer"
                : "bg-gray-100/90 text-gray-700 border border-gray-300 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {maxUnlockedStep < 4 ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">
                  4
                </span>
              )}
              <span className="font-extrabold">4. Review & Confirm</span>
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate hidden sm:block">Atomic Dispatch & Summary</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SELECT FOREST GUARD (PREFERRED OPTION: CONFIRMATION + CONTINUE BUTTON) */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-700" /> Step 1: Select Target Forest Guard
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Choose the officer who will be issued station equipment.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search by guard name or badge ID..."
                value={guardSearchQuery}
                onChange={(e) => setGuardSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>
          </div>

          {/* GUARD CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredGuards.map((guard) => {
              const isSelected = selectedGuardId === guard.id;
              return (
                <div
                  key={guard.id}
                  onClick={() => handleSelectGuardCard(guard)}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-emerald-950 text-white border-emerald-950 shadow-md ring-4 ring-emerald-600/30 scale-[1.01]"
                      : "bg-white border-emerald-950/10 hover:border-emerald-700 shadow-xs hover:scale-[1.005]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`text-sm font-black ${isSelected ? "text-white" : "text-emerald-950"}`}>
                          {guard.full_name}
                        </h4>
                        <span className={`text-[11px] font-mono font-extrabold ${isSelected ? "text-emerald-300" : "text-emerald-800"}`}>
                          {guard.badge_number || `FG-${guard.id}`}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                        isSelected ? "bg-amber-400 text-emerald-950" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {guard.role}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs font-semibold space-y-1 ${
                      isSelected ? "bg-emerald-900/80 border border-emerald-800" : "bg-emerald-50/60 border border-emerald-100"
                    }`}>
                      <div className="flex justify-between">
                        <span className="opacity-75">Station:</span>
                        <span className="font-extrabold">{guard.station_name || "Muthanga Range Office"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Active Gear Items:</span>
                        <span className="font-mono font-black">{guard.equipment_count || 0} Units</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <span className={`text-xs font-extrabold flex items-center gap-1 ${
                      isSelected ? "text-amber-300" : "text-emerald-800"
                    }`}>
                      {isSelected ? "Selected ✓" : "Click to Select →"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredGuards.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-emerald-950/10 text-xs font-semibold text-gray-400 italic">
                No Forest Guards found matching your search query.
              </div>
            )}
          </div>

          {/* STEP 1 PREFERRED OPTION: CONFIRMATION CALLOUT & CONTINUE BUTTON */}
          {selectedGuard && (
            <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-lg border border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Guard Selected Successfully</h4>
                  <p className="text-xs text-emerald-300 font-semibold">
                    {selectedGuard.full_name} ({selectedGuard.badge_number || `FG-${selectedGuard.id}`}) • {selectedGuard.station_name || "Muthanga Range Office"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleStep1Continue}
                className="w-full sm:w-auto px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-2xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Review Current Gear</span>
                <ArrowRight className="w-4 h-4 text-emerald-950 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: CURRENT GEAR REVIEW */}
      {/* ========================================================================= */}
      {currentStep === 2 && selectedGuard && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" /> Step 2: Currently Assigned Gear for {selectedGuard.full_name}
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Review gear already issued to {selectedGuard.full_name} ({selectedGuard.badge_number || `FG-${selectedGuard.id}`}) before assigning new items.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Change Guard
              </button>
              <button
                onClick={handleNextFromStep2}
                className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-xs transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Choose Equipment</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>

          {/* ACTIVE GEAR TABLE */}
          <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5 text-left align-middle">Equipment Item</th>
                    <th className="px-4 py-3.5 text-center align-middle">Category</th>
                    <th className="px-3 py-3.5 text-center align-middle">Quantity Issued</th>
                    <th className="px-4 py-3.5 text-center align-middle">Issue Date</th>
                    <th className="px-4 py-3.5 text-center align-middle">Assignment Type</th>
                    <th className="px-4 py-3.5 text-center align-middle">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                  {guardAssignedGear.map((asgn) => (
                    <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all">
                      <td className="px-4 py-3.5 text-left align-middle font-black text-emerald-950">
                        {asgn.item_name || "Equipment Item"}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        {renderCategoryBadge(asgn.category || "General")}
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle font-mono font-black text-emerald-950">
                        {asgn.quantity} {asgn.unit || "Units"}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                        {asgn.issue_date ? new Date(asgn.issue_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-lg text-[10px] font-black">
                          {asgn.assignment_type || "MISSION"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black">
                          {asgn.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {guardAssignedGear.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs font-semibold text-gray-400 italic">
                        No active equipment currently assigned to {selectedGuard.full_name}. Ready for new stock allocation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 1
            </button>
            <button
              onClick={handleNextFromStep2}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Choose Equipment</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CHOOSE EQUIPMENT & QUANTITIES (FIXED GRID EXPANSION BUG WITH items-start) */}
      {/* ========================================================================= */}
      {currentStep === 3 && selectedGuard && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" /> Step 3: Select Equipment & Set Quantities
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Select equipment from station inventory to issue to {selectedGuard.full_name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Step 2
              </button>
              <button
                onClick={handleNextFromStep3}
                className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-xs transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Review ({selectedItemsList.length})</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>

          {/* FILTERING BAR FOR STEP 3 */}
          <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
              <input
                type="text"
                placeholder="Search equipment item or category..."
                value={equipmentSearchQuery}
                onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-900 text-white shadow-xs"
                      : "bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* INVENTORY MASONRY COLUMNS (PREVENTS EMPTY SPACE IN OTHER COLUMNS WHEN A CARD EXPANDS) */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredInventory.map((item) => {
              const isSelected = !!selectedItemsMap[item.id];
              const selectedConfig = selectedItemsMap[item.id];

              return (
                <div key={item.id} className="break-inside-avoid inline-block w-full">
                  <div
                    className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "bg-emerald-950 text-white border-emerald-950 shadow-md ring-4 ring-emerald-600/30"
                        : "bg-white border-emerald-950/10 hover:border-emerald-700 shadow-xs"
                    }`}
                  >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItemSelection(item)}
                          className="w-5 h-5 accent-amber-400 rounded-lg cursor-pointer shrink-0"
                        />
                        <div>
                          <h4 className={`text-sm font-black ${isSelected ? "text-white" : "text-emerald-950"}`}>
                            {item.item_name}
                          </h4>
                          <div className="mt-1">
                            {renderCategoryBadge(item.category || "General")}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black shrink-0 ${
                        item.available_quantity > item.minimum_stock
                          ? isSelected ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {item.available_quantity} {item.unit || "Units"} Avail
                      </span>
                    </div>

                    {/* EXPANDABLE CONFIG CONTAINER ONLY ON SELECTED CARD (SMOOTH TRANSITION) */}
                    {isSelected && selectedConfig && (
                      <div className="p-3.5 rounded-2xl bg-emerald-900/90 border border-emerald-800 space-y-3 text-xs animate-in fade-in-50 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-emerald-300 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={item.available_quantity}
                              value={selectedConfig.quantity}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, "quantity", Number(e.target.value))
                              }
                              className="w-full p-2 border border-emerald-700 rounded-xl bg-emerald-950 text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-emerald-300 mb-1">
                              Usage Type *
                            </label>
                            <select
                              value={selectedConfig.usage_type}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, "usage_type", e.target.value)
                              }
                              className="w-full p-2 border border-emerald-700 rounded-xl bg-emerald-950 text-white font-extrabold text-xs outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              <option value="Temporary">Temporary (Returnable)</option>
                              <option value="Permanent">Permanent (Consumable)</option>
                            </select>
                          </div>
                        </div>

                        {selectedConfig.usage_type === "Temporary" && (
                          <div>
                            <label className="block text-[10px] font-black uppercase text-emerald-300 mb-1">
                              Expected Return Date *
                            </label>
                            <input
                              type="date"
                              value={selectedConfig.expected_return_date}
                              onChange={(e) =>
                                handleUpdateItemField(item.id, "expected_return_date", e.target.value)
                              }
                              className="w-full p-2 border border-emerald-700 rounded-xl bg-emerald-950 text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleItemSelection(item)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-amber-400 text-emerald-950 hover:bg-amber-300"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-950/10"
                    }`}
                  >
                    {isSelected ? "Selected ✓" : "Select Equipment +"}
                  </button>
                </div>
              </div>
            );
            })}

            {filteredInventory.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-emerald-950/10 text-xs font-semibold text-gray-400 italic">
                No station inventory items found matching your query.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 2
            </button>
            <button
              onClick={handleNextFromStep3}
              className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Review ({selectedItemsList.length})</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & CONFIRM DISPATCH */}
      {/* ========================================================================= */}
      {currentStep === 4 && selectedGuard && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" /> Step 4: Final Review & Confirm Issuance
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Review issuance summary, mission details, and confirm atomic inventory dispatch.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Step 3
            </button>
          </div>

          {/* GUARD & ISSUING OFFICER CALLOUT SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Guard Callout */}
            <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-md space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                Recipient Forest Guard
              </span>
              <h4 className="text-base font-black">{selectedGuard.full_name}</h4>
              <div className="text-xs font-mono text-emerald-300 space-y-0.5">
                <p>Badge ID: {selectedGuard.badge_number || `FG-${selectedGuard.id}`}</p>
                <p>Station: {selectedGuard.station_name || "Muthanga Range Office"}</p>
              </div>
            </div>

            {/* Issuing Officer Callout */}
            <div className="p-5 rounded-3xl bg-indigo-950 text-white shadow-md space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-300 block tracking-wider">
                Issuing Officer Authority
              </span>
              <h4 className="text-base font-black">{officerName}</h4>
              <div className="text-xs font-mono text-indigo-200 space-y-0.5">
                <p>Role: Range Forest Officer</p>
                <p>Dispatch Mode: Direct Station Allocation</p>
              </div>
            </div>
          </div>

          {/* MISSION & OVERALL REMARKS INPUT */}
          <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              Operation & Mission Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">
                  Operation / Mission Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Anti-Poaching Patrol Phase II"
                  value={missionName}
                  onChange={(e) => {
                    setMissionName(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full p-3 border rounded-2xl bg-white text-xs font-semibold outline-none transition-all ${
                    !missionName.trim() && error
                      ? "border-red-500 bg-red-50/50 text-red-950 ring-2 ring-red-600/30"
                      : "border-emerald-950/10 text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  }`}
                />
                {!missionName.trim() && (
                  <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Operation / Mission Name is required for log dispatch.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">
                  Overall Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional dispatch notes for audit log..."
                  value={overallRemarks}
                  onChange={(e) => setOverallRemarks(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* SELECTED ITEMS REVIEW TABLE */}
          <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs space-y-3 p-5">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
              Selected Equipment Items ({selectedItemsList.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 text-left align-middle">Equipment</th>
                    <th className="px-4 py-3 text-center align-middle">Category</th>
                    <th className="px-3 py-3 text-center align-middle">Issue Qty</th>
                    <th className="px-4 py-3 text-center align-middle">Usage Type</th>
                    <th className="px-4 py-3 text-center align-middle">Expected Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                  {selectedItemsList.map((item) => (
                    <tr key={item.station_inventory_id} className="hover:bg-emerald-50/30 transition-all">
                      <td className="px-4 py-3 text-left align-middle font-black text-emerald-950">
                        {item.equipment_name}
                      </td>
                      <td className="px-4 py-3 text-center align-middle font-bold text-gray-600">
                        {renderCategoryBadge(item.category)}
                      </td>
                      <td className="px-3 py-3 text-center align-middle font-mono font-black text-emerald-950">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                          item.usage_type === "Temporary" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                        }`}>
                          {item.usage_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle font-mono text-gray-600">
                        {item.usage_type === "Temporary" ? item.expected_return_date : "N/A (Permanent)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINAL SUBMIT BUTTON */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {error}
              </span>
              <button onClick={() => setError(null)} className="font-bold text-lg cursor-pointer">×</button>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
            >
              Back to Step 3
            </button>

            <button
              onClick={handleSubmitIssuance}
              disabled={submitting}
              className="px-8 py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Processing Stock Dispatch...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Confirm & Issue Equipment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
