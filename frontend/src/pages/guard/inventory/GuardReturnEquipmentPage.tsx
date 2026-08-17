import React, { useEffect, useState, useMemo, useCallback } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  RotateCcw,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Tag,
  AlertTriangle,
  CheckCircle,
  Camera,
  User,
  Info,
  Clock,
  Briefcase,
} from "lucide-react";

export const GuardReturnEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // Modal State
  const [selectedItem, setSelectedItem] = useState<EquipmentAssignment | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form Fields
  const [condition, setCondition] = useState("Good");
  const [reason, setReason] = useState("Work Completed");
  const [remarks, setRemarks] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [returnDestination, setReturnDestination] = useState("STATION");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getMyAssignments();
      // Filter out consumables
      const reusable = (data || []).filter(
        (a) =>
          ![
            "MEDICAL SUPPLIES",
            "MEDICAL",
            "FUEL",
            "BATTERIES",
            "FOOD",
            "STATIONERY",
            "CLEANING MATERIALS",
            "CONSUMABLE",
            "CONSUMABLES",
          ].includes((a.category || "").toUpperCase()) && a.item_usage_type !== "CONSUMABLE"
      );
      setAssignments(reusable);
    } catch (err: any) {
      setError(err.message || "Failed to load assigned equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(assignments.map((a) => a.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [assignments]);

  // Check if an item is a Head Officer return request
  const isHeadOfficerRequest = useCallback((item: EquipmentAssignment) => {
    const statusUpper = (item.status || "").toUpperCase();
    return statusUpper === "RETURN_REQUESTED" || (item.remarks || "").toLowerCase().includes("requested by");
  }, []);

  // Check if an item is pending return
  const isPendingReturn = useCallback((item: EquipmentAssignment) => {
    const statusUpper = (item.status || "").toUpperCase();
    return [
      "PENDING_RETURN",
      "PENDING HEAD OFFICER VERIFICATION",
      "PENDING VERIFICATION",
      "REPORTED LOST",
      "PENDING INSPECTION",
    ].includes(statusUpper);
  }, []);

  // Check if an item is overdue
  const isOverdue = useCallback((item: EquipmentAssignment) => {
    if (!item.expected_return_date || isPendingReturn(item) || (item.status || "").toUpperCase() === "RETURNED") return false;
    return new Date(item.expected_return_date) < new Date();
  }, [isPendingReturn]);

  // Form validations
  const isRemarksRequired = useMemo(() => {
    const condUpper = condition.toUpperCase();
    return condUpper === "LOST" || condUpper.includes("DAMAGE") || condUpper.includes("BROKEN");
  }, [condition]);

  const handleOpenReturnModal = (item: EquipmentAssignment) => {
    setSelectedItem(item);
    setCondition("Good");
    setReason(isHeadOfficerRequest(item) ? "Requested by Head Officer" : "Work Completed");
    setRemarks("");
    setPhoto(null);
    setPhotoPreview(null);
    setReturnDestination("STATION");
    setShowFormModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRemarksRequired && !remarks.trim()) {
      setError("Remarks are mandatory for damaged or lost equipment.");
      return;
    }
    setError(null);
    setShowConfirmModal(true);
  };

  const handleExecuteReturn = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setError(null);
    try {
      await inventoryService.submitReturn({
        equipment_assignment_id: selectedItem.id,
        condition,
        reason,
        remarks,
        photos: photoPreview || undefined,
        return_destination: returnDestination,
      });

      setSuccessMsg(`Return request for "${selectedItem.item_name}" submitted successfully!`);
      setShowConfirmModal(false);
      setShowFormModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit return request.");
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter(isPendingReturn).length;
    const headRequests = assignments.filter((a) => isHeadOfficerRequest(a) && !isPendingReturn(a)).length;
    const overdue = assignments.filter(isOverdue).length;

    return { total, pending, headRequests, overdue };
  }, [assignments, isPendingReturn, isHeadOfficerRequest, isOverdue]);

  // Filter logic
  const filteredMyRequests = useMemo(() => {
    return assignments.filter((item) => {
      // Must NOT be a Head Officer request (unless we filter by request source)
      const isHO = isHeadOfficerRequest(item);
      if (sourceFilter === "HO" && !isHO) return false;
      if (sourceFilter === "MY" && isHO) return false;
      if (sourceFilter === "ALL" && isHO) return false; // In separate sections, but if filtering is applied:

      // Search term
      const search = searchTerm.toLowerCase().trim();
      if (search) {
        const name = (item.item_name || "").toLowerCase();
        const id = String(item.id);
        const cat = (item.category || "").toLowerCase();
        if (!name.includes(search) && !id.includes(search) && !cat.includes(search)) return false;
      }

      // Category
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

      // Usage type
      if (usageFilter !== "ALL" && item.assignment_type !== usageFilter) return false;

      // Status filter
      const statusUpper = (item.status || "").toUpperCase();
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && !isPendingReturn(item)) return false;
        if (statusFilter === "ACTIVE" && (isPendingReturn(item) || statusUpper === "RETURNED")) return false;
        if (statusFilter === "RETURNED" && statusUpper !== "RETURNED") return false;
      }

      // Exclude item if it is in head officer request section
      return !isHO;
    });
  }, [assignments, searchTerm, categoryFilter, usageFilter, statusFilter, sourceFilter, isHeadOfficerRequest, isPendingReturn]);

  const filteredHORequests = useMemo(() => {
    return assignments.filter((item) => {
      const isHO = isHeadOfficerRequest(item);
      if (!isHO) return false;

      // Search term
      const search = searchTerm.toLowerCase().trim();
      if (search) {
        const name = (item.item_name || "").toLowerCase();
        const id = String(item.id);
        const cat = (item.category || "").toLowerCase();
        if (!name.includes(search) && !id.includes(search) && !cat.includes(search)) return false;
      }

      // Category
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

      // Usage type
      if (usageFilter !== "ALL" && item.assignment_type !== usageFilter) return false;

      return true;
    });
  }, [assignments, searchTerm, categoryFilter, usageFilter, isHeadOfficerRequest]);

  const getPriorityBadge = (item: EquipmentAssignment) => {
    if (isOverdue(item)) {
      return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-red-100 text-red-800 border border-red-200">Urgent</span>;
    }
    const daysLeft = item.expected_return_date
      ? Math.ceil((new Date(item.expected_return_date).getTime() - Date.now()) / 86400000)
      : null;
    if (daysLeft !== null && daysLeft <= 3) {
      return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-orange-100 text-orange-800 border border-orange-200">High Priority</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-blue-100 text-blue-800 border border-blue-200">Normal</span>;
  };

  const getStatusBadge = (item: EquipmentAssignment) => {
    const status = (item.status || "").toUpperCase();
    if (status === "REPORTED LOST") {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-red-50 text-red-700 border border-red-200">Reported Lost</span>;
    }
    if (status === "PENDING INSPECTION") {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending Inspection</span>;
    }
    if (isPendingReturn(item)) {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-yellow-50 text-amber-600 border border-amber-200">Pending Verification</span>;
    }
    if (status === "RETURNED") {
      return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Returned</span>;
    }
    return <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">Active / Issued</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Return Management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Return Equipment"
        subtitle="Manage your voluntary returns and verify request requests from the Head Range Forest Officer."
        icon={RotateCcw}
        badge="Guard Portal"
      />

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg cursor-pointer">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <Briefcase className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Assigned</p>
            <h4 className="text-lg font-black text-emerald-950">{metrics.total}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pending Returns</p>
            <h4 className="text-lg font-black text-emerald-950">{metrics.pending}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">HO Requests</p>
            <h4 className="text-lg font-black text-emerald-950">{metrics.headRequests}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Overdue Returns</p>
            <h4 className="text-lg font-black text-emerald-950">{metrics.overdue}</h4>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-950/10 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-emerald-950/40" />
            <input
              type="text"
              placeholder="Search by equipment name, ID, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-emerald-950/10 rounded-2xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 placeholder-emerald-950/40 outline-none focus:border-emerald-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 border border-emerald-950/10 rounded-2xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-3.5 w-3.5 h-3.5 text-emerald-950/40 pointer-events-none" />
            </div>

            {/* Usage Type Filter */}
            <div className="relative">
              <select
                value={usageFilter}
                onChange={(e) => setUsageFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 border border-emerald-950/10 rounded-2xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Usages</option>
                <option value="PERSONAL">Personal</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
              <Tag className="absolute right-3 top-3.5 w-3.5 h-3.5 text-emerald-950/40 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 border border-emerald-950/10 rounded-2xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending Return</option>
                <option value="RETURNED">Returned</option>
              </select>
              <Clock className="absolute right-3 top-3.5 w-3.5 h-3.5 text-emerald-950/40 pointer-events-none" />
            </div>

            {/* Request Source Filter */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 border border-emerald-950/10 rounded-2xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Sources</option>
                <option value="MY">My Requests</option>
                <option value="HO">HO Requests</option>
              </select>
              <User className="absolute right-3 top-3.5 w-3.5 h-3.5 text-emerald-950/40 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MY RETURN REQUESTS */}
      {(sourceFilter === "ALL" || sourceFilter === "MY") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-emerald-950 uppercase tracking-wider">My Return Requests (Voluntary)</h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredMyRequests.length} Items</span>
          </div>

          {filteredMyRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-emerald-950/10 text-center space-y-2">
              <Info className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-semibold">No voluntary returnable assignments found matching filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyRequests.map((item) => {
                const pending = isPendingReturn(item);
                const overdue = isOverdue(item);
                return (
                  <div key={item.id} className="bg-white rounded-3xl border border-emerald-950/10 shadow-xs flex flex-col justify-between overflow-hidden relative">
                    {overdue && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">{item.item_name}</h4>
                          <span className="text-[9px] font-bold text-gray-400">ID: #{item.id} | Qty: {item.quantity}</span>
                        </div>
                        {getStatusBadge(item)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-950/5 text-[10px]">
                        <div>
                          <span className="text-gray-400 font-bold block">Assigned Date</span>
                          <span className="text-emerald-950 font-extrabold">
                            {item.issue_date ? new Date(item.issue_date).toLocaleDateString("en-IN") : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block">Usage Type</span>
                          <span className="text-emerald-950 font-extrabold capitalize">{item.assignment_type || "Temporary"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block">Expected Return</span>
                          <span className={`font-extrabold ${overdue ? "text-red-600" : "text-emerald-950"}`}>
                            {item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString("en-IN") : "Permanent"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block">Current Condition</span>
                          <span className="text-emerald-950 font-extrabold capitalize">{item.condition || "Good"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-950/5 border-t border-emerald-950/10 flex justify-end">
                      {!pending && (item.status || "").toUpperCase() !== "RETURNED" ? (
                        <button
                          onClick={() => handleOpenReturnModal(item)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-xl flex items-center gap-1 cursor-pointer border border-amber-600 shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Return Equipment
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-gray-400 italic">No actions available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RETURN REQUESTS FROM HEAD OFFICER */}
      {(sourceFilter === "ALL" || sourceFilter === "HO") && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-t border-emerald-950/10 pt-6">
            <h2 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Return Requests From Head Officer
            </h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredHORequests.length} Items</span>
          </div>

          {filteredHORequests.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-emerald-950/10 text-center space-y-2">
              <Info className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-semibold">No pending return requests from your Range Forest Officer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHORequests.map((item) => {
                const pending = isPendingReturn(item);
                return (
                  <div key={item.id} className="bg-white rounded-3xl border border-amber-200 shadow-xs flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">{item.item_name}</h4>
                          <span className="text-[9px] font-bold text-gray-400">ID: #{item.id} | Qty: {item.quantity}</span>
                        </div>
                        {getPriorityBadge(item)}
                      </div>

                      <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-[10px] space-y-1 text-amber-900">
                        <div className="flex justify-between"><span className="font-bold">Requested By:</span><span className="font-extrabold">{item.issuer_name || "Head Officer"}</span></div>
                        <div className="flex justify-between"><span className="font-bold">Deadline:</span><span className="font-extrabold text-red-600">{item.expected_return_date ? new Date(item.expected_return_date).toLocaleDateString("en-IN") : "Immediate"}</span></div>
                        <div className="pt-1.5 border-t border-amber-200/50 font-bold block text-gray-600">
                          Reason: <span className="font-normal italic text-gray-700">"{item.remarks || "No reason specified."}"</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/30 border-t border-amber-100 flex justify-between items-center">
                      {pending ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-yellow-50 text-amber-600 border border-amber-200">Pending Verification</span>
                      ) : (
                        <>
                          <span className="text-[10px] font-extrabold text-amber-700">Action Required</span>
                          <button
                            onClick={() => handleOpenReturnModal(item)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-xl flex items-center gap-1 cursor-pointer border border-amber-600 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return Equipment
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RETURN EQUIPMENT FORM MODAL ── */}
      {showFormModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-800 animate-spin-once" /> Return Issued Equipment
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">×</button>
            </div>

            <form onSubmit={handleFormSubmitClick} className="space-y-4">
              {/* Equipment Information (Read-only) */}
              <div className="bg-emerald-950/5 border border-emerald-950/10 p-3.5 rounded-2xl text-[10px] space-y-2">
                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">Equipment Details (Read-Only)</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-bold text-emerald-950">
                  <div className="flex justify-between border-b border-emerald-950/5 pb-1">
                    <span className="text-gray-400">Name:</span>
                    <span>{selectedItem.item_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-950/5 pb-1">
                    <span className="text-gray-400">ID:</span>
                    <span>#{selectedItem.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-950/5 pb-1">
                    <span className="text-gray-400">Category:</span>
                    <span>{selectedItem.category || "General"}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-950/5 pb-1">
                    <span className="text-gray-400">Assigned:</span>
                    <span>{selectedItem.issue_date ? new Date(selectedItem.issue_date).toLocaleDateString("en-IN") : "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-950/5 pb-1">
                    <span className="text-gray-400">Usage Type:</span>
                    <span className="capitalize">{selectedItem.assignment_type || "Temporary"}</span>
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Return Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Minor Damage">Minor Damage</option>
                  <option value="Major Damage">Major Damage</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Return Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
                >
                  <option value="Work Completed">Work Completed</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Equipment No Longer Needed">Equipment No Longer Needed</option>
                  <option value="Requested by Head Officer">Requested by Head Officer</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Lost">Lost</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Return Destination */}
              <div>
                <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Return Destination *
                </label>
                <select
                  value={returnDestination}
                  onChange={(e) => setReturnDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 outline-none appearance-none cursor-pointer"
                >
                  <option value="STATION">Station Inventory</option>
                  <option value="HQ">Central Headquarters Inventory</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Remarks {isRemarksRequired ? "*" : "(Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    isRemarksRequired
                      ? "Explain what happened, detail of damage, or loss circumstance (Required)..."
                      : "Any additional notes..."
                  }
                  className="w-full px-3.5 py-2 border border-emerald-950/15 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 outline-none resize-none"
                />
              </div>

              {/* Upload Photos */}
              {(condition.toUpperCase() === "LOST" || condition.toUpperCase().includes("DAMAGE")) && (
                <div className="space-y-2 border-t border-emerald-950/5 pt-3">
                  <label className="block text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                    Upload Photos (Optional Evidence)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 border border-emerald-950/15 bg-white text-emerald-950 text-xs font-extrabold rounded-xl hover:bg-emerald-50 cursor-pointer flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      Choose Photo
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {photo && <span className="text-[10px] text-emerald-900 font-semibold">{photo.name}</span>}
                  </div>
                  {photoPreview && (
                    <div className="relative w-28 h-20 border border-emerald-950/10 rounded-xl overflow-hidden shadow-xs mt-1">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-amber-600"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-emerald-950">Confirm Return Submission</h3>
                <p className="text-[10px] text-gray-400 font-bold">Please review before sending.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              Are you sure you want to submit this return request for <strong>{selectedItem.item_name}</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                disabled={submitting}
              >
                No, Review
              </button>
              <button
                onClick={handleExecuteReturn}
                disabled={submitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-amber-600"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
