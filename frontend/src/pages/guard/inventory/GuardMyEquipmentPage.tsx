import React, { useEffect, useState, useMemo, useCallback } from "react";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
  Search,
  RotateCcw,
  Eye,
  LayoutGrid,
  List,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Tag,
  User,
  Calendar,
  ChevronDown,
  Shield,
  Binoculars,
  Radio,
  MapPin,
  Camera,
  Tent,
  Trash2,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const CONSUMABLE_CATS = [
  "MEDICAL SUPPLIES", "MEDICAL", "FUEL", "BATTERIES", "FOOD",
  "STATIONERY", "CLEANING MATERIALS", "CONSUMABLE", "CONSUMABLES",
];

function isConsumable(a: EquipmentAssignment) {
  return (
    CONSUMABLE_CATS.includes((a.category || "").toUpperCase()) ||
    a.item_usage_type === "CONSUMABLE"
  );
}

function isPermanent(a: EquipmentAssignment) {
  return (
    a.assignment_type === "PERSONAL" ||
    a.assignment_type === "PERMANENT" ||
    !a.expected_return_date
  );
}

function isOverdue(a: EquipmentAssignment) {
  if (!a.expected_return_date) return false;
  return new Date(a.expected_return_date) < new Date();
}

function isDueSoon(a: EquipmentAssignment) {
  if (!a.expected_return_date) return false;
  const diff = (new Date(a.expected_return_date).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function returnDaysText(a: EquipmentAssignment): string | null {
  if (!a.expected_return_date) return null;
  const diff = Math.ceil((new Date(a.expected_return_date).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  return `${diff}d remaining`;
}

// Category icon map
function CategoryIcon({ category, className }: { category?: string; className?: string }) {
  const cat = (category || "").toUpperCase();
  const cls = className || "w-5 h-5";
  if (cat.includes("COMMUN") || cat.includes("RADIO")) return <Radio className={cls} />;
  if (cat.includes("NAV") || cat.includes("GPS")) return <MapPin className={cls} />;
  if (cat.includes("OPTIC") || cat.includes("BINO")) return <Binoculars className={cls} />;
  if (cat.includes("SURV") || cat.includes("CAM")) return <Camera className={cls} />;
  if (cat.includes("CAMP") || cat.includes("SLEEP")) return <Tent className={cls} />;
  if (cat.includes("SAFETY") || cat.includes("HELMET")) return <Shield className={cls} />;
  return <Package className={cls} />;
}

// Condition badge
function ConditionBadge({ condition }: { condition?: string }) {
  const c = (condition || "Good").toLowerCase();
  if (c === "excellent") return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Excellent</span>;
  if (c === "good") return <span className="px-2.5 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Good</span>;
  if (c.includes("inspect") || c === "fair") return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Needs Inspection</span>;
  if (c.includes("damage") || c === "poor") return <span className="px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Damaged</span>;
  return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-[10px] font-black">{condition || "Good"}</span>;
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ISSUED" || s === "ACTIVE" || s === "ASSIGNED")
    return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Active</span>;
  if (s === "PENDING_RETURN" || s === "RETURN_REQUESTED")
    return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>Pending Return</span>;
  if (s === "RETURNED")
    return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-[10px] font-black inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Returned</span>;
  return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black">{status}</span>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────

export const GuardMyEquipmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const dismissItem = useCallback((id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  // View mode
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [selectedItem, setSelectedItem] = useState<EquipmentAssignment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState<EquipmentAssignment | null>(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [dismissConfirmItem, setDismissConfirmItem] = useState<EquipmentAssignment | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getMyAssignments();
      // Only show reusable (non-consumable) active items
      const reusable = (data || []).filter((a) => !isConsumable(a));
      setAssignments(reusable);
    } catch (err: any) {
      setError(err.message || "Failed to load assigned equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Derived categories for filter dropdown ──
  const availableCategories = useMemo(() => {
    const cats = new Set(assignments.map((a) => a.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [assignments]);

  // ── Filtered list (excluding dismissed returned items) ──
  const filtered = useMemo(() => {
    let list = assignments.filter((a) => !dismissedIds.has(a.id));
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(
        (a) =>
          (a.item_name || "").toLowerCase().includes(term) ||
          String(a.id).includes(term) ||
          (a.category || "").toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== "ALL") {
      list = list.filter((a) => (a.category || "").toUpperCase() === categoryFilter.toUpperCase());
    }
    if (usageFilter === "PERSONAL") list = list.filter((a) => isPermanent(a));
    if (usageFilter === "TEMPORARY") list = list.filter((a) => !isPermanent(a));
    if (statusFilter === "ACTIVE") list = list.filter((a) => ["ISSUED", "ACTIVE", "ASSIGNED"].includes((a.status || "").toUpperCase()));
    if (statusFilter === "PENDING") list = list.filter((a) => ["PENDING_RETURN", "RETURN_REQUESTED"].includes((a.status || "").toUpperCase()));
    if (statusFilter === "RETURNED") list = list.filter((a) => (a.status || "").toUpperCase() === "RETURNED");
    return list;
  }, [assignments, searchTerm, categoryFilter, usageFilter, statusFilter]);

  // ── Summary metrics ──
  const totalAssigned = assignments.length;
  const personalCount = assignments.filter(isPermanent).length;
  const temporaryCount = assignments.filter((a) => !isPermanent(a)).length;
  const dueSoonCount = assignments.filter((a) => !isPermanent(a) && (isOverdue(a) || isDueSoon(a))).length;

  // ── Return handler ──
  const handleRequestReturn = async () => {
    if (!returnItem) return;
    setSubmittingReturn(true);
    try {
      await inventoryService.submitReturn({
        equipment_assignment_id: returnItem.id,
        condition: returnItem.condition || "Good",
        reason: "Normal Return",
        remarks: "Return requested from My Equipment dashboard",
      });
      showToast(`Return request for "${returnItem.item_name}" submitted successfully.`, "success");
      setShowReturnModal(false);
      setReturnItem(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit return request.", "error");
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin" />
        <p className="text-sm font-semibold text-emerald-950">Loading your equipment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950">My Assigned Equipment</h1>
              <p className="text-xs font-medium text-gray-500">Personal equipment dashboard — view, track and manage gear assigned to you.</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-white border border-emerald-950/10 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="font-black text-lg">×</button>
        </div>
      )}

      {/* ── GLOBAL TOAST ── */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg ${toastMsg.type === "success" ? "bg-emerald-900 text-white" : "bg-red-600 text-white"}`}>
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="font-black text-lg">×</button>
        </div>
      )}

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Assigned", value: totalAssigned, sub: "Reusable Items",
            icon: Package, bg: "bg-emerald-50/80", border: "border-emerald-200/80",
            iconBg: "bg-emerald-900", iconText: "text-amber-300", textColor: "text-emerald-950", subColor: "text-emerald-700",
          },
          {
            label: "Personal Equipment", value: personalCount, sub: "Permanently Yours",
            icon: User, bg: "bg-yellow-50/80", border: "border-amber-100/80",
            iconBg: "bg-amber-800", iconText: "text-amber-200", textColor: "text-amber-900", subColor: "text-amber-600",
          },
          {
            label: "Temporary Equipment", value: temporaryCount, sub: "Must Be Returned",
            icon: Clock, bg: "bg-blue-50/80", border: "border-blue-200/80",
            iconBg: "bg-blue-900", iconText: "text-white", textColor: "text-blue-950", subColor: "text-blue-700",
          },
          {
            label: "Due / Overdue", value: dueSoonCount, sub: "Needs Attention",
            icon: AlertTriangle,
            bg: dueSoonCount > 0 ? "bg-amber-50/80" : "bg-gray-50/80",
            border: dueSoonCount > 0 ? "border-amber-200/80" : "border-gray-200/80",
            iconBg: dueSoonCount > 0 ? "bg-amber-900" : "bg-gray-700",
            iconText: "text-white", textColor: dueSoonCount > 0 ? "text-amber-950" : "text-gray-700",
            subColor: dueSoonCount > 0 ? "text-amber-700" : "text-gray-500",
          },
        ].map(({ label, value, sub, icon: Icon, bg, border, iconBg, iconText, textColor, subColor }) => (
          <div key={label} className={`p-5 rounded-3xl ${bg} border ${border} shadow-xs flex items-center justify-between`}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${subColor}`}>{label}</span>
              <span className={`text-3xl font-black mt-1 block ${textColor}`}>{value}</span>
              <span className={`text-[10px] font-bold mt-1 block ${subColor}`}>{sub}</span>
            </div>
            <div className={`p-3 rounded-2xl ${iconBg} shadow-xs`}>
              <Icon className={`w-6 h-6 ${iconText}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS + VIEW TOGGLE ── */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 p-4 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment name, ID, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer appearance-none"
          >
            <option value="ALL">All Categories</option>
            {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-emerald-800 pointer-events-none" />
        </div>

        {/* Usage filter */}
        <div className="relative">
          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer appearance-none"
          >
            <option value="ALL">All Types</option>
            <option value="PERSONAL">Personal</option>
            <option value="TEMPORARY">Temporary</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-emerald-800 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-7 py-2 text-xs font-bold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 cursor-pointer appearance-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending Return</option>
            <option value="RETURNED">Returned</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-emerald-800 pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-emerald-950/10 overflow-hidden ml-auto shrink-0">
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 text-xs flex items-center gap-1 transition-all cursor-pointer ${viewMode === "card" ? "bg-emerald-900 text-white" : "bg-white text-emerald-900 hover:bg-emerald-50"}`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 text-xs flex items-center gap-1 transition-all cursor-pointer ${viewMode === "table" ? "bg-emerald-900 text-white" : "bg-white text-emerald-900 hover:bg-emerald-50"}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-emerald-950/10 shadow-xs gap-4">
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
            <ShieldCheck className="w-12 h-12 text-emerald-300" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-black text-emerald-950 mb-1">
              {assignments.length === 0 ? "No Equipment Assigned Yet" : "No Matching Equipment"}
            </h3>
            <p className="text-xs font-medium text-gray-500 max-w-sm">
              {assignments.length === 0
                ? "No equipment has been assigned to you yet. Your Range Forest Officer will issue gear before field operations."
                : "No equipment matches your current search and filter criteria. Try adjusting the filters."}
            </p>
          </div>
          {assignments.length > 0 && (
            <button
              onClick={() => { setSearchTerm(""); setCategoryFilter("ALL"); setUsageFilter("ALL"); setStatusFilter("ALL"); }}
              className="px-4 py-2 bg-emerald-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-950"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {viewMode === "card" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const permanent = isPermanent(item);
            const overdue = isOverdue(item);
            const dueSoon = isDueSoon(item);
            const pendingReturn = ["PENDING_RETURN", "RETURN_REQUESTED"].includes((item.status || "").toUpperCase());
            const daysText = returnDaysText(item);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border shadow-xs flex flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${overdue ? "border-red-200" : dueSoon ? "border-amber-200" : "border-emerald-950/10"}`}
              >
                {/* Top colour strip */}
                <div className={`h-1.5 w-full ${permanent ? "bg-amber-400" : overdue ? "bg-red-500" : dueSoon ? "bg-amber-400" : "bg-emerald-600"}`} />

                {/* Card Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${permanent ? "bg-yellow-50 border border-amber-100" : "bg-emerald-50 border border-emerald-200"}`}>
                      <CategoryIcon category={item.category} className={`w-5 h-5 ${permanent ? "text-amber-600" : "text-emerald-700"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-emerald-950 leading-tight truncate" title={item.item_name}>
                        {item.item_name || `Equipment #${item.id}`}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400">#{item.id} · {item.category || "General"}</span>
                    </div>
                  </div>

                  {/* Usage type + condition badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${permanent ? "bg-yellow-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                      {permanent ? "Personal" : "Temporary"}
                    </span>
                    <ConditionBadge condition={item.condition} />
                  </div>

                  {/* Key dates */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Assigned</span>
                      <strong className="text-emerald-950 font-bold">{formatDate(item.issue_date)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Return By</span>
                      {permanent ? (
                        <strong className="text-amber-600 font-black">Permanent</strong>
                      ) : (
                        <strong className={`font-bold ${overdue ? "text-red-700" : dueSoon ? "text-amber-700" : "text-emerald-950"}`}>
                          {formatDate(item.expected_return_date)}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* Due indicator */}
                  {!permanent && daysText && (
                    <div className={`text-center text-[10px] font-black px-2.5 py-1 rounded-xl ${overdue ? "bg-red-50 text-red-800 border border-red-200" : dueSoon ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
                      {overdue ? "⚠️ " : "🕒 "}{daysText}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-950/5">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] font-bold text-gray-400">Qty: {item.quantity} {item.unit || "u"}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
                    className="flex-1 py-2 text-[10px] font-black text-emerald-900 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  {!permanent && !pendingReturn && (
                    <button
                      onClick={() => { setReturnItem(item); setShowReturnModal(true); }}
                      className="flex-1 py-2 text-[10px] font-black text-white bg-amber-500 hover:bg-amber-600 border border-amber-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Request Return
                    </button>
                  )}

                  {permanent && (
                    <div className="flex-1 py-2 text-[10px] font-bold text-amber-600 bg-yellow-50 border border-amber-100 rounded-xl flex items-center justify-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Permanent
                    </div>
                  )}

                  {pendingReturn && (
                    <div className="flex-1 py-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Return Pending
                    </div>
                  )}

                  {(item.status || "").toUpperCase() === "RETURNED" && (
                    <button
                      onClick={() => setDismissConfirmItem(item)}
                      className="p-2 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-all cursor-pointer"
                      title="Dismiss from view"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && filtered.length > 0 && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                  <th className="px-5 py-3.5 text-left align-middle w-[26%]">Equipment</th>
                  <th className="px-4 py-3.5 text-center align-middle w-[11%]">Type</th>
                  <th className="px-4 py-3.5 text-center align-middle w-[13%]">Assigned Date</th>
                  <th className="px-4 py-3.5 text-center align-middle w-[13%]">Return By</th>
                  <th className="px-3 py-3.5 text-center align-middle w-[10%]">Condition</th>
                  <th className="px-3 py-3.5 text-center align-middle w-[10%]">Status</th>
                  <th className="px-4 py-3.5 text-center align-middle w-[17%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {filtered.map((item) => {
                  const permanent = isPermanent(item);
                  const overdue = isOverdue(item);
                  const pendingReturn = ["PENDING_RETURN", "RETURN_REQUESTED"].includes((item.status || "").toUpperCase());
                  const daysText = returnDaysText(item);

                  return (
                    <tr key={item.id} className={`hover:bg-emerald-50/30 transition-all whitespace-nowrap ${overdue ? "bg-red-50/20" : ""}`}>
                      <td className="px-5 py-3.5 text-left align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-xl shrink-0 ${permanent ? "bg-yellow-50 border border-amber-100" : "bg-emerald-50 border border-emerald-200"}`}>
                            <CategoryIcon category={item.category} className={`w-3.5 h-3.5 ${permanent ? "text-amber-600" : "text-emerald-700"}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-emerald-950 truncate max-w-[180px]" title={item.item_name}>{item.item_name || `Equipment #${item.id}`}</div>
                            <div className="text-[10px] font-medium text-gray-400">#{item.id} · {item.category || "General"} · Qty {item.quantity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${permanent ? "bg-yellow-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                          {permanent ? "Personal" : "Temporary"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle font-mono text-gray-600 text-[11px]">
                        {formatDate(item.issue_date)}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle text-[11px]">
                        {permanent ? (
                          <span className="font-black text-amber-600">Permanent</span>
                        ) : (
                          <div>
                            <div className={`font-mono font-bold ${overdue ? "text-red-700" : "text-gray-700"}`}>{formatDate(item.expected_return_date)}</div>
                            {daysText && (
                              <div className={`text-[10px] font-black ${overdue ? "text-red-600" : "text-amber-600"}`}>{daysText}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle">
                        <ConditionBadge condition={item.condition} />
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!permanent && !pendingReturn && (
                            <button
                              onClick={() => { setReturnItem(item); setShowReturnModal(true); }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-lg flex items-center gap-1 cursor-pointer border border-amber-600"
                            >
                              <RotateCcw className="w-3 h-3" /> Return
                            </button>
                          )}
                          {pendingReturn && (
                            <span className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black rounded-lg flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {permanent && (
                            <span className="px-2.5 py-1.5 bg-yellow-50 text-amber-600 border border-amber-100 text-[10px] font-black rounded-lg flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Permanent
                            </span>
                          )}
                          {(item.status || "").toUpperCase() === "RETURNED" && (
                            <button
                              onClick={() => setDismissConfirmItem(item)}
                              className="p-1.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                              title="Dismiss from view"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <CategoryIcon category={selectedItem.category} className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">{selectedItem.item_name || `Equipment #${selectedItem.id}`}</h3>
                  <span className="text-[10px] font-medium text-gray-400">Assignment #{selectedItem.id}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">×</button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                ["Equipment Name", selectedItem.item_name || "—"],
                ["Assignment ID", `#${selectedItem.id}`],
                ["Category", selectedItem.category || "—"],
                ["Quantity", `${selectedItem.quantity} ${selectedItem.unit || "Units"}`],
                ["Assigned By", selectedItem.issuer_name || "Range Forest Officer"],
                ["Assigned Date", formatDate(selectedItem.issue_date)],
                ["Usage Type", isPermanent(selectedItem) ? "Personal (Permanent)" : "Temporary"],
                ["Expected Return", isPermanent(selectedItem) ? "Permanent Assignment" : formatDate(selectedItem.expected_return_date)],
                ["Condition", selectedItem.condition || "Good"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start border-b border-emerald-950/5 pb-1.5">
                  <span className="text-gray-500 font-bold">{label}:</span>
                  <span className="font-extrabold text-emerald-950 text-right max-w-[55%]">{value}</span>
                </div>
              ))}

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-gray-500 font-bold">Status:</span>
                <StatusBadge status={selectedItem.status} />
              </div>

              {selectedItem.purpose && (
                <div className="pt-2">
                  <span className="text-gray-500 font-bold block mb-1">Purpose / Mission:</span>
                  <p className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950 font-semibold">{selectedItem.purpose}</p>
                </div>
              )}
              {selectedItem.remarks && (
                <div className="pt-1">
                  <span className="text-gray-500 font-bold block mb-1">Remarks:</span>
                  <p className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-semibold">{selectedItem.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
              {!isPermanent(selectedItem) && !["PENDING_RETURN", "RETURN_REQUESTED"].includes((selectedItem.status || "").toUpperCase()) && (
                <button
                  onClick={() => { setShowDetailModal(false); setReturnItem(selectedItem); setShowReturnModal(true); }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl cursor-pointer border border-amber-600 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Return
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN CONFIRMATION MODAL ── */}
      {showReturnModal && returnItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" /> Confirm Return Request
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">×</button>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50 border border-amber-100/80 space-y-2 text-xs">
              <p className="font-extrabold text-amber-900">Submit a return request for the following equipment?</p>
              <div className="space-y-1 text-amber-800 font-semibold pt-1">
                <div className="flex justify-between"><span>Equipment:</span><strong>{returnItem.item_name}</strong></div>
                <div className="flex justify-between"><span>Quantity:</span><strong>{returnItem.quantity} {returnItem.unit || "Units"}</strong></div>
                <div className="flex justify-between"><span>Return By:</span><strong className={isOverdue(returnItem) ? "text-red-700" : ""}>{formatDate(returnItem.expected_return_date)}</strong></div>
              </div>
              <p className="text-[11px] text-amber-600 italic pt-2 border-t border-amber-100">
                Your Range Forest Officer will be notified and will physically verify and process the return.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={submittingReturn}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-amber-600"
              >
                {submittingReturn && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Return Request
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── DISMISS CONFIRM MODAL ── */}
      {dismissConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" /> Remove from View
              </h3>
              <button onClick={() => setDismissConfirmItem(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer">×</button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-2">
              <p className="font-extrabold text-red-900">Remove this returned item from your equipment list?</p>
              <div className="space-y-1 text-red-800 font-semibold">
                <div className="flex justify-between"><span>Equipment:</span><strong>{dismissConfirmItem.item_name || `#${dismissConfirmItem.id}`}</strong></div>
                <div className="flex justify-between"><span>Category:</span><strong>{dismissConfirmItem.category || "—"}</strong></div>
              </div>
              <p className="text-[11px] text-red-600 italic pt-1 border-t border-red-200">
                This only hides the item from your view. No data is deleted. Refreshing the page will restore it.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                onClick={() => setDismissConfirmItem(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { dismissItem(dismissConfirmItem.id); setDismissConfirmItem(null); }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove from View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

