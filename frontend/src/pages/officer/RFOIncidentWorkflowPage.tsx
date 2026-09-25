import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/services/api";
import { inventoryService } from "@/services/inventoryService";
import { IncidentActivityTimeline } from "@/components/incidents/IncidentActivityTimeline";
import type { Incident, IncidentActivity, User, FieldOperation } from "@/types";
import type { EquipmentRequest } from "@/types/inventory";
import {
  ArrowLeft, MapPin, AlertCircle, CheckCircle2, Clock,
  CheckSquare, Ban, Send, Shield, RefreshCw, Calendar,
} from "lucide-react";

// ── Utility helpers ──────────────────────────────────────────────────────────

const FIELD_STEPS = [
  "Pending Acceptance",
  "Inventory Request",
  "Travelling",
  "Reached Site",
  "Initial Assessment",
  "Action In Progress",
  "Situation Controlled",
  "Evidence Uploaded",
  "Final Report Submitted",
] as const;

function statusColor(s: string | undefined): string {
  switch (s) {
    case "Pending Review":
    case "Reported":        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Ready For Guard Assignment": return "bg-amber-100 text-amber-800 border-amber-200";
    case "Assigned":        return "bg-orange-100 text-orange-800 border-orange-200";
    case "In Progress":     return "bg-orange-200 text-orange-900 border-orange-300";
    case "Returned For Follow-up": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Awaiting Verification":  return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Verified":        return "bg-green-100 text-green-800 border-green-200";
    case "Completed":       return "bg-green-200 text-green-900 border-green-300 font-bold";
    case "Closed":          return "bg-gray-100 text-gray-700 border-gray-200";
    case "Rejected":        return "bg-red-100 text-red-800 border-red-200";
    default:                return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function severityColor(s: string | undefined): string {
  switch (s?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-900 border-red-300 font-extrabold";
    case "high":     return "bg-orange-100 text-orange-800 border-orange-200 font-bold";
    case "medium":   return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":      return "bg-green-100 text-green-800 border-green-200";
    default:         return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

const API_BASE = "http://127.0.0.1:8000";
function imgSrc(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-emerald-950/10 shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-emerald-950/8">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-950">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase text-emerald-800/50 tracking-wider">{label}</span>
      <span className={`text-sm font-semibold text-emerald-950 ${mono ? "font-mono" : ""}`}>
        {value ?? <span className="text-gray-400 italic font-normal">Not provided</span>}
      </span>
    </div>
  );
}

// ── Pipeline component ────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "review",       label: "Incident Reviewed",        statuses: ["Ready For Guard Assignment", "Assigned", "In Progress", "Returned For Follow-up", "Awaiting Verification", "Verified", "Completed", "Closed"] },
  { key: "assigned",     label: "Guard Assigned",           statuses: ["Assigned", "In Progress", "Returned For Follow-up", "Awaiting Verification", "Verified", "Completed", "Closed"] },
  { key: "accepted",     label: "Assignment Accepted",      statuses: ["In Progress", "Returned For Follow-up", "Awaiting Verification", "Verified", "Completed", "Closed"] },
  { key: "field",        label: "Field Investigation",      statuses: ["Awaiting Verification", "Verified", "Completed", "Closed"] },
  { key: "report",       label: "Report Submitted",         statuses: ["Awaiting Verification", "Verified", "Completed", "Closed"] },
  { key: "verified",     label: "Verified",                 statuses: ["Verified", "Completed", "Closed"] },
  { key: "completed",    label: "Completed",                statuses: ["Completed", "Closed"] },
  { key: "closed",       label: "Closed",                   statuses: ["Closed"] },
];

function WorkflowPipeline({ status }: { status: string }) {
  const isReportedOrReview = status === "Reported" || status === "Pending Review";
  const isRejected = status === "Rejected";

  return (
    <div className="bg-white rounded-2xl border border-emerald-950/10 shadow-sm p-5 overflow-x-auto">
      <div className="flex items-center min-w-max gap-1">
        {/* Reported — always first */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-green-100 text-green-900">
          <CheckCircle2 className="w-3.5 h-3.5" /> Incident Reported
        </div>

        {PIPELINE_STAGES.map((stage) => {
          const isDone = stage.statuses.includes(status);
          const isCurrent =
            (stage.key === "review"    && (isReportedOrReview || status === "Ready For Guard Assignment")) ||
            (stage.key === "assigned"  && status === "Assigned") ||
            (stage.key === "accepted"  && (status === "In Progress" || status === "Returned For Follow-up")) ||
            (stage.key === "field"     && (status === "In Progress" || status === "Returned For Follow-up")) ||
            (stage.key === "report"    && status === "Awaiting Verification") ||
            (stage.key === "verified"  && status === "Verified") ||
            (stage.key === "completed" && status === "Completed") ||
            (stage.key === "closed"    && status === "Closed");

          return (
            <React.Fragment key={stage.key}>
              <div className={`w-6 h-0.5 rounded-full flex-shrink-0 ${isDone ? "bg-green-600" : "bg-gray-200"}`} />
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap flex-shrink-0 transition-all ${
                isRejected && stage.key === "review" ? "bg-red-100 text-red-700" :
                isCurrent && !isDone ? "bg-orange-500 text-white scale-105 shadow-sm font-bold" :
                isDone    ? "bg-green-100 text-green-900" :
                            "bg-gray-50 text-gray-400"
              }`}>
                {isDone && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                 isCurrent            ? <Clock className="w-3.5 h-3.5 animate-pulse" /> :
                                        <CheckSquare className="w-3.5 h-3.5" />}
                {isRejected && stage.key === "review" ? "Rejected" : stage.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Field step progress bar ───────────────────────────────────────────────────

function FieldStepTimeline({ fieldOp }: { fieldOp: FieldOperation }) {
  const current = fieldOp.current_step || "Pending Acceptance";
  const currentIdx = FIELD_STEPS.indexOf(current as typeof FIELD_STEPS[number]);

  return (
    <div className="space-y-2">
      {FIELD_STEPS.map((step, idx) => {
        const done = idx < currentIdx || (idx === currentIdx && step === "Final Report Submitted");
        const active = idx === currentIdx && step !== "Final Report Submitted";
        return (
          <div key={step} className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all ${
            done   ? "bg-green-100 text-green-900" :
            active ? "bg-orange-500 text-white shadow-sm font-bold" :
                     "bg-gray-50 text-gray-400"
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
              done   ? "bg-green-600 text-white" :
              active ? "bg-white text-orange-600" :
                       "bg-gray-200 text-gray-500"
            }`}>
              {done ? "✓" : idx + 1}
            </div>
            <span className="flex-1">{step}</span>
            {active && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/20">Current</span>
            )}
            {/* Show timestamp hints from fieldOp */}
            {done && step === "Travelling" && fieldOp.travelling_start_time && (
              <span className="text-[10px] opacity-70">{fieldOp.travelling_start_time}</span>
            )}
            {done && step === "Reached Site" && fieldOp.arrival_time && (
              <span className="text-[10px] opacity-70">{fieldOp.arrival_time}</span>
            )}
            {done && step === "Final Report Submitted" && fieldOp.submitted_at && (
              <span className="text-[10px] opacity-70">{fieldOp.submitted_at}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Guard card ────────────────────────────────────────────────────────────────

function AssignedGuardsPanel({ fieldOps, incident }: { fieldOps: FieldOperation[]; incident: Incident }) {
  const officers = incident.assigned_officers || [];
  
  if (officers.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 font-semibold space-y-2">
        <p className="text-gray-400 uppercase tracking-widest text-[10px] font-black">Pending Guard Assignment</p>
        <p>No Forest Guard has been assigned to this incident yet.</p>
        <p className="text-xs font-normal">Complete the review and assign one or more Forest Guards.</p>
      </div>
    );
  }

  const acceptedCount = officers.filter(o => o.assignment_status !== "Assigned").length;

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden mb-4">
      <div className="bg-emerald-950 px-5 py-3 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300">Assigned Guards</h3>
        <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {acceptedCount} / {officers.length} Accepted
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {officers.map(officer => {
          const op = fieldOps.find(f => f.guard_id === officer.officer_id);
          const status = officer.assignment_status || "Assigned";
          const isAccepted = status !== "Assigned";
          const step = op?.current_step || "Pending Acceptance";
          
          return (
            <div key={officer.officer_id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${isAccepted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {officer.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-900 truncate">{officer.full_name}</p>
                  <p className="text-[11px] text-gray-500 font-semibold">{officer.designation || "Forest Guard"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAccepted ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mission Accepted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200">
                    <Clock className="w-3.5 h-3.5" /> Awaiting Acceptance
                  </span>
                )}
              </div>

              {isAccepted && op && (
                <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5 border border-gray-100 text-xs mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Current Step</span>
                    <span className="font-bold text-orange-600 text-right">{step}</span>
                  </div>
                  {op.submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Report</span>
                      <span className="font-bold text-green-600">Submitted</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

export const RFOIncidentWorkflowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isProgressRoute = location.pathname.endsWith("/progress");
  const incidentId = Number(id);

  // Data state
  const [incident, setIncident] = useState<Incident | null>(null);
  const [fieldOps, setFieldOps] = useState<FieldOperation[]>([]);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [availableGuards, setAvailableGuards] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Form state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review/Reject
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Assignment
  const [selectedGuardIds, setSelectedGuardIds] = useState<number[]>([]);
  const [missionRequests, setMissionRequests] = useState<EquipmentRequest[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState("");

  // Verify
  const [verifyNotes, setVerifyNotes] = useState("");
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);

  // Return
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");

  // Close
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeRemarks, setCloseRemarks] = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [incData, actData, allReqs] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getIncidentActivities(incidentId),
        inventoryService.getStationRequests().catch(() => [])
      ]);
      setIncident(incData);
      setActivities(actData);
      setMissionRequests(allReqs.filter((r: any) => r.incident_id === incidentId));
      setLastUpdated(new Date());

      // Fetch field op (may not exist yet)
      try { const ops = await api.getAllFieldOps(incidentId); setFieldOps(ops); } catch { setFieldOps([]); }

      // Fetch available guards for this station
      if (incData.station_id) {
        try {
          const guards = await api.getAvailableGuards(incData.station_id);
          setAvailableGuards(guards);
        } catch {
          setAvailableGuards([]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load incident.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [incidentId]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const withSubmit = async (fn: () => Promise<void>, msg: string) => {
    try {
      setIsSubmitting(true);
      await fn();
      setSuccessMsg(msg);
      await fetchAll(true);
    } catch (err: any) {
      setSuccessMsg(null);
      alert("Error: " + (err.message || "Action failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => withSubmit(
    () => api.approveIncident(incidentId),
    "Review completed. Incident is ready for guard assignment."
  );

  const handleReject = () => {
    if (!rejectReason.trim()) { alert("Rejection reason is required."); return; }
    withSubmit(
      () => api.rejectIncident(incidentId, { reason: rejectReason }),
      "Incident rejected."
    ).then(() => { setShowRejectForm(false); setRejectReason(""); });
  };

  const handleAssign = () => {
    if (selectedGuardIds.length === 0) { alert("Please select at least one forest guard."); return; }
    withSubmit(
      () => api.assignMultiOfficers(incidentId, {
        officer_ids: selectedGuardIds,
        priority: "High",
        estimated_response_time: "Immediate",
        instructions: dispatchNotes,
        mission_notes: dispatchNotes,
      }),
      `${selectedGuardIds.length} Forest Guard(s) assigned successfully. Awaiting acceptance.`
    ).then(() => { setSelectedGuardIds([]); setDispatchNotes(""); });
  };

  const handleVerify = () => {
    const notes = verifyNotes.trim() || "Field operation verified by Head Officer.";
    withSubmit(
      () => api.verifyIncident(incidentId, { notes }),
      "Field operation verified successfully."
    ).then(() => { setShowVerifyConfirm(false); setVerifyNotes(""); });
  };

  const handleReturn = () => {
    if (!returnRemarks.trim()) { alert("Return reason is required."); return; }
    withSubmit(
      () => api.returnReport(incidentId, { remarks: returnRemarks }),
      "Report returned to guard for follow-up."
    ).then(() => { setShowReturnForm(false); setReturnRemarks(""); });
  };

  
  const handleComplete = () => {
    withSubmit(
      () => api.completeIncident(incidentId),
      "Incident marked as completed successfully."
    ).then(() => { setShowCloseConfirm(false); });
  };

  const handleClose = () => {
    withSubmit(
      () => api.verifyCloseIncident(incidentId, { remarks: closeRemarks }),
      "Incident closed successfully."
    ).then(() => { setShowCloseConfirm(false); setCloseRemarks(""); });
  };

  const handleApproveRequest = async (reqId: number) => {
    try {
      setIsSubmitting(true);
      await inventoryService.approveOrRejectRequest(reqId, "ISSUED", "");
      setSuccessMsg("Inventory request approved and dispatched!");
      await fetchAll(true);
    } catch (e: any) {
      setError(e.message || "Failed to approve request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async (reqId: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      setIsSubmitting(true);
      await inventoryService.approveOrRejectRequest(reqId, "REJECTED", reason);
      setSuccessMsg("Inventory request rejected!");
      await fetchAll(true);
    } catch (e: any) {
      setError(e.message || "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-black text-emerald-950">Loading Incident Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="font-black text-red-700">{error || "Incident not found."}</p>
        <button onClick={() => navigate("/officer/incidents")} className="mt-4 px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold">
          Back to Incidents
        </button>
      </div>
    );
  }

  const s = incident.status;
  const isReadOnly = s === "Closed" || s === "Rejected";
  const images: string[] = incident.images || [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto pb-16">

      {/* ── Page Header ── */}
      <div className="flex items-start gap-4 border-b border-emerald-950/10 pb-5">
        <button
          onClick={() => navigate("/officer/incidents")}
          className="mt-1 p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-900 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-black px-2.5 py-0.5 bg-emerald-900 text-emerald-100 rounded-md">
              {incident.reference_id || `INC-${incidentId}`}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusColor(s)}`}>
              {s}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${severityColor(incident.severity)}`}>
              {incident.severity} Severity
            </span>
          </div>
          <h1 className="text-xl font-black text-emerald-950 truncate">
            {incident.incident_title || `${incident.animal} Sighting`}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-emerald-800/70">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location || "Unknown Location"}</span>
            {incident.station_name && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{incident.station_name}</span>}
            {incident.date_reported && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{incident.date_reported}</span>}
          </div>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex-shrink-0 p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {lastUpdated && (
        <p className="text-[10px] text-gray-400 font-semibold -mt-3 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* ── Workflow Pipeline ── */}
      <WorkflowPipeline status={s} />

      {/* ── Success Banner ── */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><Ban className="w-4 h-4 opacity-40" /></button>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ────── LEFT / MAIN COLUMN (2/3) ────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── INCIDENT OVERVIEW ── */}
          <SectionCard title="Incident Overview">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoRow label="Incident Category" value={incident.incident_category} />
              <InfoRow label="Animal / Species" value={incident.animal_species_name || incident.animal} />
              <InfoRow label="Severity" value={incident.severity} />
              <InfoRow label="Date Reported" value={incident.date_reported} />
              <InfoRow label="Time Reported" value={incident.time_reported} />
              <InfoRow label="Weather" value={incident.weather} />
              {incident.people_injured && <InfoRow label="People Injured" value="Yes — Medical attention required" />}
              {incident.livestock_damage && <InfoRow label="Livestock Damage" value="Reported" />}
              {incident.property_damage && <InfoRow label="Property Damage" value="Reported" />}
              {incident.crop_damage && <InfoRow label="Crop Damage" value="Reported" />}
            </div>
            {incident.description && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/50 mb-2">Description</p>
                <p className="text-sm text-emerald-950 font-medium leading-relaxed bg-emerald-50 p-4 rounded-xl">
                  {incident.description}
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── REPORTER ── */}
          <SectionCard title="Reporter Information">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoRow label="Reporter Name" value={incident.reporter_name} />
              <InfoRow label="Reporter Type" value={incident.reporter_role} />
              <InfoRow label="Contact Number" value={incident.contact_number} />
            </div>
          </SectionCard>

          {/* ── LOCATION ── */}
          <SectionCard title="Location Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoRow label="Location / Landmark" value={incident.location} />
              <InfoRow label="Village" value={incident.village_name} />
              <InfoRow label="District" value={incident.district_name} />
              <InfoRow label="State" value={incident.state_name} />
              <InfoRow label="Station" value={incident.station_name} />
              {incident.latitude && <InfoRow label="GPS Coordinates" value={`${incident.latitude?.toFixed(5)}, ${incident.longitude?.toFixed(5)}`} mono />}
            </div>
            {incident.address && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs font-medium text-gray-700">
                {incident.address}
              </div>
            )}
          </SectionCard>

          {/* ── EVIDENCE / IMAGES ── */}
          {images.length > 0 && (
            <SectionCard title={`Evidence & Images (${images.length})`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <a key={i} href={imgSrc(img)} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden aspect-video bg-gray-100 hover:opacity-90 transition-opacity">
                    <img src={imgSrc(img)} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── STAGE-SPECIFIC ACTION PANEL ── */}

          {/* REVIEW STAGE */}
          {(s === "Pending Review" || s === "Reported") && !isProgressRoute && (
            <SectionCard title="Head Officer Review — Action Required">
              {!showRejectForm ? (
                <div className="space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 font-medium">
                    Review all incident details above. Confirm this incident is valid and requires field action before continuing.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Complete Review & Continue to Assignment
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="px-6 py-3.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border border-red-200"
                    >
                      <Ban className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="font-black text-red-900 mb-1">Reject Incident</p>
                    <p className="text-xs text-red-700">This incident will be rejected and cannot proceed to guard assignment.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-red-900 block mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Provide a clear reason for rejecting this incident..."
                      className="w-full p-3 rounded-xl border border-red-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectReason.trim()}
                      className="flex-1 py-2.5 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                      className="flex-1 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* ASSIGNMENT STAGE */}
          {s === "Ready For Guard Assignment" && !isProgressRoute && (
            <SectionCard title="Assign Forest Guard">
              <div className="space-y-5">
                <p className="text-xs text-emerald-800/70 font-semibold">
                  Select one Forest Guard from your station to investigate this incident.
                  Only guards with <span className="font-black text-emerald-900">Available</span> status are shown.
                </p>

                {availableGuards.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-xl text-xs text-gray-500 font-medium">
                    No available guards at this station. Guards must have "Available" work status to be assigned.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableGuards.map((g) => {
                      const isSelected = selectedGuardIds.includes(g.id);
                      return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGuardIds(prev => isSelected ? prev.filter(id => id !== g.id) : [...prev, g.id])}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-green-600 bg-green-50 scale-[1.01]"
                            : "border-gray-200 hover:border-green-400 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0 ${isSelected ? 'bg-green-700' : 'bg-gray-700'}`}>
                            {g.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-black text-sm truncate ${isSelected ? 'text-green-950' : 'text-gray-900'}`}>{g.full_name}</p>
                            <p className="text-[11px] text-gray-500 font-semibold">{g.designation_name || "Forest Guard"}</p>
                            {g.work_status && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                {g.work_status}
                              </span>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? "bg-green-600 border-green-600 text-white" : "border-gray-300"}`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}

                {selectedGuardIds.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-white p-3 rounded-xl border border-green-100 flex items-center justify-between shadow-sm">
                      <span className="text-sm font-bold text-green-900">Assign {selectedGuardIds.length} Forest Guard(s)</span>
                      <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">{incident.station_name}</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-green-900 block mb-1.5">Dispatch Instructions (optional)</label>
                      <textarea
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                        placeholder="Add specific instructions for the guards..."
                        className="w-full p-3 rounded-xl border border-green-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => { setSelectedGuardIds([]); setDispatchNotes(""); }} className="px-5 py-3.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all flex-1 border border-gray-200">
                        Cancel
                      </button>
                      <button
                        onClick={handleAssign}
                        disabled={isSubmitting}
                        className="flex-[2] py-3.5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        Confirm Guard Assignment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* AWAITING GUARD ACCEPTANCE */}
          {s === "Assigned" && (
            <SectionCard title="Guard Assignment Status">
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4">
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-black text-blue-900 text-sm">Awaiting Guard Acceptance</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Assigned guard(s) have been notified and must accept this mission before field work can begin.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* FIELD OPERATION PROGRESS */}
          {["In Progress", "Returned For Follow-up", "Awaiting Verification", "Verified", "Closed"].includes(s) && fieldOps.length > 0 && (
            <SectionCard title="Field Operation Progress">
              <div className="space-y-12">
                {fieldOps.map((op, idx) => (
                  <div key={op.id} className={`${idx > 0 ? "pt-10 border-t-2 border-gray-100" : ""}`}>
                    <h4 className="text-sm font-black text-emerald-950 mb-4">{op.guard_name || "Forest Guard"}</h4>
                    <FieldStepTimeline fieldOp={op} />

                    {/* Assessment details if available */}
                    {op.animal_present !== undefined && (
                      <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <InfoRow label="Animal Observed" value={op.animal_present ? "Yes" : "No"} />
                        {op.animal_count && <InfoRow label="Animal Count" value={op.animal_count.toString()} />}
                        {op.animal_behaviour && <InfoRow label="Animal Behaviour" value={op.animal_behaviour} />}
                        {op.threat_level && <InfoRow label="Threat Level" value={op.threat_level} />}
                        {op.vehicle && <InfoRow label="Vehicle Used" value={op.vehicle} />}
                        {op.arrival_weather && <InfoRow label="Weather at Site" value={op.arrival_weather} />}
                        {op.outcome && <InfoRow label="Outcome" value={op.outcome} />}
                        {op.remaining_risk && <InfoRow label="Remaining Risk" value={op.remaining_risk} />}
                        {op.distance_covered && <InfoRow label="Distance Covered" value={op.distance_covered} />}
                      </div>
                    )}

                    {/* Actions taken */}
                    {op.actions_checklist && op.actions_checklist.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/50 mb-2">Actions Taken</p>
                        <div className="flex flex-wrap gap-2">
                          {op.actions_checklist.map((a: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-green-100 text-green-900 text-[11px] font-bold rounded-full border border-emerald-200">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* FINAL REPORTS */}
          {fieldOps.some(op => op.report_generated_content) && (
            <SectionCard title="Final Field Reports">
              <div className="space-y-6">
                {fieldOps.filter(op => op.report_generated_content).map((op, idx) => (
                  <div key={op.id} className={`${idx > 0 ? "pt-6 border-t border-gray-100" : ""}`}>
                    <h5 className="text-xs font-black text-gray-700 mb-2">{op.guard_name}</h5>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-emerald-950">Official Final Report</p>
                            <p className="text-[10px] font-medium text-emerald-800/70">PDF Document</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <a href={imgSrc(op.report_generated_content)} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-2">
                            View PDF
                          </a>
                          <button onClick={() => handleDownload(imgSrc(op.report_generated_content), `Gaia_Incident_INC-${incident?.reference_id || incident?.id}_Final_Report.pdf`)}className="flex-1 sm:flex-none px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-2">
                            Download
                          </button>
                        </div>
                      </div>
                    {op.submitted_at && (
                      <p className="text-[11px] text-gray-500 mt-2 font-semibold">
                        Submitted: {op.submitted_at}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* VERIFICATION PANEL */}
          {s === "Awaiting Verification" && !isReadOnly && (
            <SectionCard title="Head Officer Verification — Action Required">
              <div className="space-y-4">
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl text-sm text-cyan-900 font-medium">
                  The guard has submitted the final field report. Review the report above, then verify or return for follow-up.
                </div>

                {!showVerifyConfirm && !showReturnForm && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowVerifyConfirm(true)}
                      className="flex-1 py-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Completion
                    </button>
                    <button
                      onClick={() => setShowReturnForm(true)}
                      className="flex-1 py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Return for Follow-up
                    </button>
                  </div>
                )}

                {showVerifyConfirm && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-4">
                    <p className="font-black text-teal-900 text-sm">Confirm Verification</p>
                    <textarea
                      value={verifyNotes}
                      onChange={(e) => setVerifyNotes(e.target.value)}
                      placeholder="Verification notes (optional — default note will be used if empty)..."
                      className="w-full p-3 rounded-xl border border-teal-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-300"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleVerify}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                        Confirm Verification
                      </button>
                      <button onClick={() => setShowVerifyConfirm(false)} className="flex-1 py-2.5 bg-white border text-gray-700 rounded-xl font-bold text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showReturnForm && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-4">
                    <div>
                      <p className="font-black text-orange-900 text-sm mb-1">Return for Follow-up</p>
                      <p className="text-xs text-orange-700">The guard will be notified and must complete additional field work and resubmit.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-900 block mb-1.5">Reason for Return <span className="text-red-500">*</span></label>
                      <textarea
                        value={returnRemarks}
                        onChange={(e) => setReturnRemarks(e.target.value)}
                        placeholder="Specify what additional work or evidence is required..."
                        className="w-full p-3 rounded-xl border border-orange-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReturn}
                        disabled={isSubmitting || !returnRemarks.trim()}
                        className="flex-1 py-2.5 bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                        Return to Guard
                      </button>
                      <button onClick={() => { setShowReturnForm(false); setReturnRemarks(""); }} className="flex-1 py-2.5 bg-white border text-gray-700 rounded-xl font-bold text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

                    {/* VERIFIED - ready to complete */}
          {s === "Verified" && !isReadOnly && (
            <SectionCard title="Complete Incident - Action Required">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {incident.verified_by_name && <InfoRow label="Verified By" value={incident.verified_by_name} />}
                  {incident.verification_time && <InfoRow label="Verified At" value={incident.verification_time} />}
                  {incident.verification_notes && <InfoRow label="Verification Notes" value={incident.verification_notes} />}
                </div>

                {!showCloseConfirm ? (
                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="w-full py-3.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Incident Completed
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
                    <p className="font-black text-green-900 text-sm">Confirm Incident Completion</p>
                    <p className="text-xs text-green-800">This incident has been verified. Are you sure you want to mark this incident as completed?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                        Mark as Completed
                      </button>
                      <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-2.5 bg-white border text-gray-700 rounded-xl font-bold text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
          
          {/* COMPLETED - ready to close */}
          {s === "Completed" && !isReadOnly && (
            <SectionCard title="Close Incident - Action Required">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {incident.verified_by_name && <InfoRow label="Verified By" value={incident.verified_by_name} />}
                  {incident.verification_time && <InfoRow label="Verified At" value={incident.verification_time} />}
                </div>

                {!showCloseConfirm ? (
                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Close Incident
                  </button>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <p className="font-black text-gray-900 text-sm">Confirm Incident Closure</p>
                    <p className="text-xs text-gray-600">Are you sure you want to close this incident? Once closed, the incident will be treated as fully closed.</p>
                    <textarea
                      value={closeRemarks}
                      onChange={(e) => setCloseRemarks(e.target.value)}
                      placeholder="Final closure remarks (optional)..."
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                        Confirm Close
                      </button>
                      <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-2.5 bg-white border text-gray-700 rounded-xl font-bold text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* CLOSED SUMMARY */}
          {s === "Closed" && (
            <SectionCard title="Incident Closure Summary">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {incident.closed_by_name && <InfoRow label="Closed By" value={incident.closed_by_name} />}
                {incident.closed_at && <InfoRow label="Closed At" value={incident.closed_at} />}
                {incident.verified_by_name && <InfoRow label="Verified By" value={incident.verified_by_name} />}
                {incident.verification_time && <InfoRow label="Verified At" value={incident.verification_time} />}
                {incident.final_closure_remarks && <InfoRow label="Closure Remarks" value={incident.final_closure_remarks} />}
              </div>
            </SectionCard>
          )}

          {/* REJECTED SUMMARY */}
          {s === "Rejected" && (
            <SectionCard title="Rejection Information">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-black text-red-900 text-sm mb-2">Incident Rejected</p>
                <p className="text-xs text-red-700 font-medium">
                  This incident was rejected and cannot proceed to guard assignment.
                  See the activity timeline below for the rejection reason.
                </p>
              </div>
            </SectionCard>
          )}

          {/* ACTIVITY TIMELINE */}
          <SectionCard title="Activity Timeline">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center italic">No activity recorded yet.</p>
            ) : (
              <IncidentActivityTimeline activities={activities} />
            )}
          </SectionCard>

        </div>

        {/* ────── RIGHT SIDEBAR (1/3) ────── */}
        <div className="space-y-5">

          {/* ASSIGNED GUARD CARD */}
          <div>
            
            <AssignedGuardsPanel fieldOps={fieldOps} incident={incident} />
          </div>

          {/* INCIDENT SUMMARY */}
          <SectionCard title="Incident Summary">
            <div className="space-y-4">
              <InfoRow label="Reference" value={incident.reference_id} mono />
              <InfoRow label="Species" value={incident.animal_species_name || incident.animal} />
              <InfoRow label="Category" value={incident.incident_category} />
              <InfoRow label="Severity" value={incident.severity} />
              {incident.village_name && <InfoRow label="Village" value={incident.village_name} />}
              {incident.district_name && <InfoRow label="District" value={incident.district_name} />}
              <InfoRow label="Station" value={incident.station_name} />
            </div>
          </SectionCard>

          {/* CURRENT STATUS CARD */}
          <div className={`rounded-2xl p-5 ${statusColor(s)} border`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Current Status</p>
            <p className="font-black text-lg">{s}</p>
            {s === "In Progress" && fieldOps.length > 0 && (
              <div className="bg-orange-100 text-orange-800 p-3 rounded-xl text-xs font-black border border-orange-200">
                Guard Step: {fieldOps[0].current_step}
              </div>
            )}
            {s === "Returned For Follow-up" && (
              <p className="text-[11px] font-bold mt-1 opacity-80">Guard must resubmit report</p>
            )}
          </div>

          {/* STATION / HEAD OFFICER INFO */}
          {incident.head_officer_name && (
            <SectionCard title="Station Command">
              <div className="space-y-3">
                <InfoRow label="Head Officer" value={incident.head_officer_name} />
                <InfoRow label="Station" value={incident.station_name} />
              </div>
            </SectionCard>
          )}

          {/* GUARD INVENTORY REQUESTS */}
          {missionRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mt-6">
              <div className="px-5 py-4 border-b border-blue-100 bg-blue-50/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-700" /> Guard Inventory Requests
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {missionRequests.map((req: any) => (
                  <div key={req.id} className="p-4 rounded-xl border border-emerald-950/10 bg-gray-50 flex flex-col gap-3 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-emerald-950">{req.guard_name || `Guard #${req.guard_id}`}</p>
                        <p className="text-[11px] font-medium text-emerald-800/70 mt-0.5">Requested on: {new Date(req.requested_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        req.status === 'ISSUED' ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-y border-emerald-950/5">
                      <span className="text-xs font-bold text-emerald-900">{req.item_name}</span>
                      <span className="text-xs font-black text-emerald-950 bg-white px-2 py-1 rounded-md border border-emerald-950/10 shadow-sm">
                        x {req.quantity} {req.unit}
                      </span>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-[10px] font-black transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shadow-sm transition-all"
                        >
                          Approve & Dispatch
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RFOIncidentWorkflowPage;
