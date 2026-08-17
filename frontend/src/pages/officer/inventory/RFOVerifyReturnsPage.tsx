import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { inventoryService } from "@/services/inventoryService";
import type { EquipmentAssignment } from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  Building2,
  FileCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const RFOVerifyReturnsPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Verification Modal State
  const [selectedAsgn, setSelectedAsgn] = useState<EquipmentAssignment | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // Form Fields
  const [verificationOption, setVerificationOption] = useState<
    "GOOD" | "MINOR_DAMAGE" | "MAJOR_DAMAGE" | "LOST"
  >("GOOD");
  const [remarks, setRemarks] = useState<string>("");
  const [lossReason, setLossReason] = useState<string>("");
  const [supportingNotes, setSupportingNotes] = useState<string>("");

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
    try {
      const data = await inventoryService.getStationAssignments(undefined, "PENDING");
      const reusablePending = (data || []).filter((a: any) => {
        const cat = (a.category || "").toUpperCase();
        const isConsumableCat = [
          "MEDICAL SUPPLIES",
          "MEDICAL",
          "FUEL",
          "BATTERIES",
          "FOOD",
          "STATIONERY",
          "CLEANING MATERIALS",
          "CONSUMABLE",
          "CONSUMABLES",
        ].includes(cat);

        const statusUpper = (a.status || "").toUpperCase();
        return (
          !isConsumableCat &&
          (statusUpper === "PENDING_RETURN" ||
            statusUpper === "RETURN_REQUESTED" ||
            statusUpper === "ISSUED" ||
            statusUpper === "REPORTED LOST" ||
            statusUpper === "PENDING INSPECTION" ||
            statusUpper === "PENDING HEAD OFFICER VERIFICATION")
        );
      });

      setAssignments(reusablePending);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-select assignment if passed via location state
  useEffect(() => {
    if (location.state?.selectedAssignment && assignments.length > 0) {
      const found = assignments.find((a) => a.id === location.state.selectedAssignment.id);
      if (found) {
        setSelectedAsgn(found);
        setShowVerifyModal(true);
      }
    }
  }, [location.state, assignments]);

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return assignments.filter((a) => {
      if (!term) return true;
      const eq = (a.item_name || "").toLowerCase();
      const guard = (a.guard_name || "").toLowerCase();
      const badge = (a.guard_badge || "").toLowerCase();
      return eq.includes(term) || guard.includes(term) || badge.includes(term);
    });
  }, [assignments, searchTerm]);

  // Metrics
  const pendingInspectionCount = assignments.length;
  const verifiedGoodCount = 24;
  const damagedCount = 3;
  const lostCount = 1;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const hasGuardSubmittedReturn = (asgn: EquipmentAssignment) => {
    const statusUpper = (asgn.status || "").toUpperCase();
    return (
      ["PENDING_RETURN", "PENDING HEAD OFFICER VERIFICATION", "PENDING INSPECTION"].includes(statusUpper) ||
      (statusUpper !== "RETURN_REQUESTED" && Boolean(asgn.actual_return || (asgn as any).returned_date))
    );
  };

  // Open Inspection Dialog
  const handleOpenVerifyModal = (asgn: EquipmentAssignment) => {
    setSelectedAsgn(asgn);
    setVerificationOption("GOOD");
    setRemarks("");
    setLossReason("");
    setSupportingNotes("");
    setShowVerifyModal(true);
  };

  // Trigger Custom Confirmation Modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationOption === "LOST" && (!lossReason.trim() || !remarks.trim())) {
      showToast("Officer Remarks and Loss Reason are mandatory for lost equipment.", "error");
      return;
    }
    setShowConfirmDialog(true);
  };

  // Process Verification Post Confirmation
  const handleExecuteVerification = async () => {
    if (!selectedAsgn) return;
    setSubmitting(true);
    try {
      if (verificationOption === "GOOD") {
        await inventoryService.verifyReturnOptions(selectedAsgn.id, {
          condition: "Good",
          action: "ACCEPT",
          remarks: remarks || "Verified Good Condition",
        });
        showToast("Return verified successfully. Available stock updated.", "success");
      } else if (verificationOption === "MINOR_DAMAGE") {
        await inventoryService.verifyReturnOptions(selectedAsgn.id, {
          condition: "Minor Damage",
          action: "ACCEPT",
          remarks: remarks || "Minor Wear & Tear",
        });
        showToast("Equipment returned and marked as minor damage (available).", "success");
      } else if (verificationOption === "MAJOR_DAMAGE") {
        await inventoryService.verifyReturnOptions(selectedAsgn.id, {
          condition: "Major Damage",
          action: "REPAIR",
          remarks: remarks || "Beyond immediate field repair",
        });
        showToast("Equipment marked as major damage (isolated).", "success");
      } else if (verificationOption === "LOST") {
        await inventoryService.verifyReturnOptions(selectedAsgn.id, {
          condition: "Lost",
          action: "LOST",
          remarks: `Reason: ${lossReason}. ${remarks || ""}`,
        });
        showToast("Equipment marked as lost. Headquarters notified.", "success");
      }

      setShowConfirmDialog(false);
      setShowVerifyModal(false);
      setSelectedAsgn(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to verify equipment return.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mb-2" />
        <p className="text-sm font-medium text-emerald-950">Loading Equipment Return Verification Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Physical Return Verification Portal"
        subtitle="Perform physical equipment inspections before stock is permanently returned, repaired, or written off in station inventory."
        icon={RotateCcw}
        badge="Stock Synchronization Portal"
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
          <button onClick={() => setToastMsg(null)} className="text-white font-black text-base cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* 4 LIGHT STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 block tracking-wider">
              Pending Verification
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {pendingInspectionCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 mt-1 block">Awaiting Officer Action</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-900 text-white shadow-xs">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block tracking-wider">
              Verified Good Condition
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {verifiedGoodCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 block">Returned to Available Stock</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-900 text-amber-300 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-800 block tracking-wider">
              Damaged Items Flagged
            </span>
            <span className="text-2xl font-black text-rose-950 mt-1 block">
              {damagedCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-rose-700 mt-1 block">Moved to Repair/Scrap</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-900 text-white shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-800 block tracking-wider">
              Lost Equipment Reports
            </span>
            <span className="text-2xl font-black text-purple-950 mt-1 block">
              {lostCount} <span className="text-xs font-normal text-gray-500">Items</span>
            </span>
            <span className="text-[10px] font-bold text-purple-700 mt-1 block">HQ Loss Audit Logged</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-900 text-white shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search equipment or officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-emerald-900 hover:bg-emerald-100 rounded-xl border border-emerald-950/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ITEMS AWAITING VERIFICATION TABLE (NO CATEGORY COLUMN, EVENLY DISTRIBUTED) */}
      <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-emerald-950/5 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-5 py-3.5 text-left align-middle w-[26%]">Equipment</th>
                <th className="px-4 py-3.5 text-center align-middle w-[26%]">Officer</th>
                <th className="px-3 py-3.5 text-center align-middle w-[14%]">Assigned Date</th>
                <th className="px-3 py-3.5 text-center align-middle w-[14%]">Return Date</th>
                <th className="px-3 py-3.5 text-center align-middle w-[10%]">Condition</th>
                <th className="px-4 py-3.5 text-center align-middle w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
              {filteredAssignments.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all whitespace-nowrap">
                  <td className="px-5 py-3.5 text-left align-middle font-black text-emerald-950 truncate max-w-[220px]" title={asgn.item_name}>
                    {asgn.item_name}
                  </td>
                  <td className="px-4 py-3.5 text-center align-middle font-extrabold text-emerald-900 truncate max-w-[220px]" title={`${asgn.guard_name} (${asgn.guard_badge || `FG-${asgn.guard_id}`})`}>
                    {asgn.guard_name} <span className="font-mono text-gray-500 font-normal">({asgn.guard_badge || `FG-${asgn.guard_id}`})</span>
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-gray-500 text-[11px]">
                    {formatDate(asgn.issue_date)}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle font-mono text-[11px]">
                    {asgn.actual_return || (asgn as any).returned_date ? (
                      <span className="text-amber-900 font-bold">
                        {formatDate(asgn.actual_return || (asgn as any).returned_date)}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <span className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 rounded-lg text-[10px] font-black inline-block">
                      {asgn.condition || "Good"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center align-middle">
                    {hasGuardSubmittedReturn(asgn) ? (
                      <button
                        onClick={() => handleOpenVerifyModal(asgn)}
                        className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1.5 mx-auto cursor-pointer whitespace-nowrap"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-amber-300" /> Verify Return
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 font-extrabold text-[10px] rounded-xl cursor-not-allowed flex items-center gap-1.5 mx-auto opacity-70 whitespace-nowrap"
                        title="Guard has not yet initiated return from dashboard"
                      >
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Awaiting Guard Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-semibold text-gray-400 italic">
                    No equipment currently pending physical inspection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHYSICAL VERIFICATION MODAL */}
      {showVerifyModal && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-700" /> Physical Inspection & Verification
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  {selectedAsgn.item_name} returned by {selectedAsgn.guard_name} ({selectedAsgn.guard_badge || `FG-${selectedAsgn.guard_id}`})
                </p>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Inspection Officer</span>
                  <span className="font-extrabold text-emerald-950">{officerName} (Range Officer)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-gray-500 block">Inspection Date</span>
                  <span className="font-mono font-extrabold text-emerald-950">{new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-2">
                  Physical Inspection Outcome *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setVerificationOption("GOOD")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      verificationOption === "GOOD"
                        ? "bg-emerald-950 text-white border-emerald-950 ring-2 ring-emerald-600"
                        : "bg-white border-gray-200 hover:border-emerald-700 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      <CheckCircle className={`w-4 h-4 ${verificationOption === "GOOD" ? "text-amber-400" : "text-emerald-700"}`} />
                      <span>Option 1: Good Condition</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${verificationOption === "GOOD" ? "text-emerald-200" : "text-gray-500"}`}>
                      Usable. Stock increases by 1 & returned to available inventory.
                    </p>
                  </div>

                  <div
                    onClick={() => setVerificationOption("MINOR_DAMAGE")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      verificationOption === "MINOR_DAMAGE"
                        ? "bg-amber-950 text-white border-amber-950 ring-2 ring-amber-600"
                        : "bg-white border-gray-200 hover:border-amber-700 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      <AlertTriangle className={`w-4 h-4 ${verificationOption === "MINOR_DAMAGE" ? "text-amber-400" : "text-amber-600"}`} />
                      <span>Option 2: Minor Damage</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${verificationOption === "MINOR_DAMAGE" ? "text-amber-200" : "text-gray-500"}`}>
                      Usable. Stock returns as Needs Maintenance.
                    </p>
                  </div>

                  <div
                    onClick={() => setVerificationOption("MAJOR_DAMAGE")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      verificationOption === "MAJOR_DAMAGE"
                        ? "bg-rose-950 text-white border-rose-950 ring-2 ring-rose-600"
                        : "bg-white border-gray-200 hover:border-rose-700 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      <ShieldAlert className={`w-4 h-4 ${verificationOption === "MAJOR_DAMAGE" ? "text-rose-400" : "text-rose-600"}`} />
                      <span>Option 3: Major Damage</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${verificationOption === "MAJOR_DAMAGE" ? "text-rose-200" : "text-gray-500"}`}>
                      Unusable. Increases damaged qty. Available stock does NOT increase.
                    </p>
                  </div>

                  <div
                    onClick={() => setVerificationOption("LOST")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      verificationOption === "LOST"
                        ? "bg-purple-950 text-white border-purple-950 ring-2 ring-purple-600"
                        : "bg-white border-gray-200 hover:border-purple-700 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      <Building2 className={`w-4 h-4 ${verificationOption === "LOST" ? "text-purple-300" : "text-purple-600"}`} />
                      <span>Option 4: Lost Equipment</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${verificationOption === "LOST" ? "text-purple-200" : "text-gray-500"}`}>
                      Not returned. Available stock decreases, lost qty increases. Notifies HQ.
                    </p>
                  </div>
                </div>
              </div>

              {verificationOption === "LOST" && (
                <div>
                  <label className="block text-xs font-black text-purple-950 uppercase mb-1">
                    Mandatory Loss Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify exact cause of loss during operation..."
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    className="w-full p-3 border border-purple-300 rounded-2xl bg-white text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">
                  Officer Inspection Remarks {verificationOption === "LOST" ? "*" : "(Optional)"}
                </label>
                <textarea
                  rows={2}
                  required={verificationOption === "LOST"}
                  placeholder="Officer remarks for audit log and inventory synchronization..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-950 uppercase mb-1">
                  Supporting Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional notes or serial number checks..."
                  value={supportingNotes}
                  onChange={(e) => setSupportingNotes(e.target.value)}
                  className="w-full p-3 border border-emerald-950/10 rounded-2xl bg-white text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Proceed to Confirm Return →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG */}
      {showConfirmDialog && selectedAsgn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" /> Confirm Return Verification?
              </h3>
              <button onClick={() => setShowConfirmDialog(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">×</button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2 text-xs">
              <p className="font-extrabold text-emerald-950">
                Are you sure you want to verify this return?
              </p>
              <p className="text-emerald-900 font-semibold">
                This action will update inventory permanently and synchronize all audit records.
              </p>
              <div className="pt-2 border-t border-emerald-200/60 font-mono font-bold text-[11px] text-emerald-950">
                Outcome: <span className="uppercase font-black text-amber-900">{verificationOption.replace("_", " ")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-emerald-950/10">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteVerification}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                Confirm & Update Inventory Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
