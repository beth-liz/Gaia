import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentProgressTracker } from "@/components/incidents/IncidentProgressTracker";
import { IncidentActivityTimeline } from "@/components/incidents/IncidentActivityTimeline";
import type { Incident, IncidentActivity, User, FieldOperation } from "@/types";
import {
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Radio,
  Loader2,
  ArrowLeft,
  Shield,
  UserCheck,
  MapPin,
  Send,
  Ban,
  User as UserIcon,
  Users,
  CheckSquare,
  Square,
  Navigation,
  FileText,
  PlusCircle,
} from "lucide-react";

export const IncidentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [fieldOp, setFieldOp] = useState<FieldOperation | null>(null);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [availableOfficers, setAvailableOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [activeModal, setActiveModal] = useState<"assign_multi" | "reject" | "request" | "verify" | "close" | "return_report" | null>(null);

  // Multi-Officer Form Inputs
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<number[]>([]);
  const [priority, setPriority] = useState("High");
  const [estTime, setEstTime] = useState("30 Mins");
  const [instructions, setInstructions] = useState("");

  // Action Inputs
  const [rejectReason, setRejectReason] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [closureRemarks, setClosureRemarks] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const incidentId = Number(id);

  const fetchIncidentDetails = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      setError(null);
      const [incData, actData, opData] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getIncidentActivities(incidentId),
        api.getFieldOp(incidentId).catch(() => null),
      ]);
      setIncident(incData);
      setActivities(actData);
      setFieldOp(opData);

      if (user?.role !== "Admin" && incData.station_id) {
        const officers = await api.getAvailableGuards(incData.station_id);
        setAvailableOfficers(officers);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load incident details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetails();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-xs font-bold text-emerald-950">Loading Operational Command Workspace...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-3xl border border-red-200">
        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-950">Incident Record Not Found</h3>
        <p className="text-xs text-red-700">{error || "Unable to locate incident record."}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // Permission Logic: Only Station Head Officer or Station RFO can perform operational actions. Admin is Read-Only.
  const isAdmin = user?.role === "Admin";
  const isHeadOfficer =
    !isAdmin &&
    (incident.is_head_officer ||
      (user?.id && incident.head_officer_id && user.id === incident.head_officer_id) ||
      (user?.role && ["Range Forest Officer", "Officer"].includes(user.role) && user?.station_id === incident.station_id));

  const assignedOfficersList = incident.assigned_officers || [];

  const toggleOfficerSelection = (offId: number) => {
    setSelectedOfficerIds((prev) =>
      prev.includes(offId) ? prev.filter((i) => i !== offId) : [...prev, offId]
    );
  };

  // OPERATIONAL ACTION HANDLERS
  const handleApproveIncident = async () => {
    try {
      setSubmittingAction(true);
      await api.approveIncident(incident.id);
      setSuccess("Incident approved by Head Officer. Ready for officer assignment.");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to approve incident.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveMultiAssignment = async () => {
    if (selectedOfficerIds.length === 0) {
      alert("Please select at least one available officer for assignment.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.assignMultiOfficers(incident.id, {
        officer_ids: selectedOfficerIds,
        priority,
        estimated_response_time: estTime,
        instructions: instructions.trim(),
      });
      setSuccess(`${selectedOfficerIds.length} Officer(s) assigned. Ready for dispatch.`);
      setActiveModal(null);
      setSelectedOfficerIds([]);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to assign officers.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDispatchTeam = async () => {
    if (assignedOfficersList.length === 0) {
      alert("Zero officers assigned. Please assign officers before dispatching.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.dispatchTeam(incident.id);
      setSuccess("Assigned officer team dispatched into field operation!");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch team.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveReport = async () => {
    try {
      setSubmittingAction(true);
      await api.approveReport(incident.id);
      setSuccess("Field Report approved! Incident is ready for Verification.");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to approve report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReturnReport = async () => {
    if (!returnRemarks.trim()) {
      alert("Correction remarks are required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.returnReport(incident.id, { remarks: returnRemarks.trim() });
      setSuccess("Report returned to Guard for revision.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to return report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleVerifyIncident = async () => {
    if (!verificationNotes.trim()) {
      alert("Verification notes are required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.verifyIncident(incident.id, { notes: verificationNotes.trim() });
      setSuccess("Incident verified successfully! Ready for Closure.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to verify incident.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCloseIncident = async () => {
    try {
      setSubmittingAction(true);
      await api.closeIncident(incident.id, { remarks: closureRemarks.trim() });
      setSuccess("Incident formally closed. Assigned officers released back to Available.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to close incident.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveReinforcement = async () => {
    try {
      setSubmittingAction(true);
      await api.approveReinforcement(incident.id);
      setSuccess("Reinforcement request approved! Assign additional officers.");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to approve reinforcement.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.rejectIncident(incident.id, { reason: rejectReason.trim() });
      setSuccess("Incident report rejected.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to reject incident.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) {
      alert("Request message is required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.requestInfoIncident(incident.id, { message: requestMessage.trim() });
      setSuccess("Information request sent to reporter.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to request information.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-emerald-950 border border-emerald-950/10 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-700" /> Back to Incident Management
      </button>

      {/* Header Banner */}
      <PageHeader
        title={`Incident ${incident.reference_id}: ${incident.incident_title}`}
        subtitle={`Station Range: ${incident.station_name || "Muthanga Range HQ"} • Head Officer: ${incident.head_officer_name || "Head RFO"}`}
        icon={AlertCircle}
        badge={incident.status}
      />

      {/* Success Banner */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-900 text-lg font-black">×</button>
        </div>
      )}

      {/* Admin Read-Only Notice */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Admin Operational Command: Read-Only Mode.</strong> Operational review, multi-officer assignment, report approval, verification, and closure operations are strictly restricted to Head Officer <strong>{incident.head_officer_name}</strong>.
          </span>
        </div>
      )}

      {/* Horizontal Lifecycle Progress Bar */}
      <IncidentProgressTracker currentStatus={incident.status} />

      {/* Main Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Incident Details Workspace & Assigned Officers (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incident Record Summary Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-3">
              Incident Operational Parameters
            </h3>

            {/* Visual Photos Grid */}
            {incident.images && incident.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incident.images.map((img, idx) => (
                  <div key={idx} className="w-full h-32 rounded-2xl overflow-hidden bg-gray-100 border border-emerald-950/10 shadow-2xs">
                    <img
                      src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img}
                      alt={`Incident Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Metric Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-950/5">
                <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal</span>
                <span className="font-extrabold text-emerald-950 block text-sm">{incident.animal_species_name || incident.animal}</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-950/5">
                <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Category</span>
                <span className="font-extrabold text-emerald-950 block text-sm">{incident.incident_category}</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-950/5">
                <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity</span>
                <span className="font-extrabold text-amber-900 block text-sm">{incident.severity}</span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-950/5">
                <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Weather</span>
                <span className="font-extrabold text-emerald-950 block text-sm">{incident.weather || "Sunny"}</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-emerald-800/70 block uppercase text-[10px]">Incident Field Description</span>
              <p className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-950/5 text-emerald-950 font-medium leading-relaxed">
                {incident.description || "No description logged."}
              </p>
            </div>

            {/* Location & Reporter Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-emerald-950">
              <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-emerald-800/70 font-semibold">Location:</span>
                  <span className="font-extrabold">{incident.location}</span>
                </div>
                <div className="text-[11px] text-emerald-800/80">Village: <strong>{incident.village_name || "Sector Range"}</strong></div>
                <div className="text-[11px] text-emerald-800/80">District: <strong>{incident.district_name || "Wayanad"}</strong></div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-950/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-emerald-800/70 font-semibold">Reporter:</span>
                  <span className="font-extrabold">{incident.reporter_name}</span>
                </div>
                <div className="text-[11px] text-emerald-800/80">Role: <strong>{incident.reporter_role || "Villager"}</strong></div>
                <div className="text-[11px] text-emerald-800/80">Contact: <strong>{incident.contact_number || "N/A"}</strong></div>
              </div>
            </div>

            {/* Verification / Closure Details */}
            {(incident.verification_notes || incident.final_closure_remarks) && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-950/10 space-y-2 text-xs">
                {incident.verification_notes && (
                  <div>
                    <span className="font-extrabold text-emerald-950 block text-[10px] uppercase">Verification Audit Notes:</span>
                    <p className="text-emerald-900 font-medium">{incident.verification_notes} (Verified by: {incident.verified_by_name} @ {incident.verification_time})</p>
                  </div>
                )}
                {incident.final_closure_remarks && (
                  <div className="pt-2 border-t border-emerald-950/10">
                    <span className="font-extrabold text-emerald-950 block text-[10px] uppercase">Final Closure Remarks:</span>
                    <p className="text-emerald-900 font-medium">{incident.final_closure_remarks} (Closed by: {incident.closed_by_name} @ {incident.closed_at})</p>
                  </div>
                )}
              </div>
            )}

            {/* GPS Map Coordinates Preview */}
            {incident.latitude && incident.longitude && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>GPS Coordinates:</strong> {incident.latitude.toFixed(5)}° N, {incident.longitude.toFixed(5)}° E</span>
                </div>
                <span className="text-[10px] font-sans font-extrabold text-emerald-800 uppercase px-2 py-0.5 bg-white rounded-lg border border-emerald-950/10">GIS Coordinates Logged</span>
              </div>
            )}
          </div>

          {/* AUTOMATED FIELD REPORT REVIEW (WHEN GENERATED) */}
          {fieldOp && fieldOp.report_generated_content && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-3 shadow-xs text-xs">
              <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  Forest Guard Automated Field Mission Report
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-950 border border-emerald-300">
                  Report Submitted
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-emerald-950 max-h-80 overflow-y-auto">
                {fieldOp.report_generated_content}
              </div>
            </div>
          )}

          {/* ASSIGNED OFFICERS SECTION */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Assigned Officer Roster ({assignedOfficersList.length})
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${assignedOfficersList.length > 0 ? "bg-emerald-100 text-emerald-950 border border-emerald-300" : "bg-gray-100 text-gray-700"}`}>
                {assignedOfficersList.length > 0 ? `${assignedOfficersList.length} Officer(s) Active` : "No Officers Assigned"}
              </span>
            </div>

            {assignedOfficersList.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/30 rounded-2xl border border-emerald-950/5 space-y-2">
                <UserCheck className="w-8 h-8 text-emerald-800/40 mx-auto" />
                <h4 className="text-xs font-black text-emerald-950">No Officers Assigned</h4>
                <p className="text-[11px] text-emerald-800/70">
                  Approve the incident and assign one or multiple officers from the Head Officer Action Panel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedOfficersList.map((off) => (
                  <div key={off.assignment_id} className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 font-black text-xs flex items-center justify-center border border-amber-300 shadow-2xs shrink-0">
                        {off.avatar_url ? (
                          <img src={off.avatar_url} alt={off.full_name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          off.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">{off.full_name}</h4>
                        <span className="text-[11px] font-bold text-emerald-800/70 block">{off.designation || "Forest Guard"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-950/5">
                      <div>
                        <span className="text-emerald-800/60 font-semibold block text-[10px] uppercase">Work Status</span>
                        <span className={`font-black ${off.work_status === "Busy" ? "text-amber-700" : "text-emerald-900"}`}>{off.work_status}</span>
                      </div>

                      <div>
                        <span className="text-emerald-800/60 font-semibold block text-[10px] uppercase">Est. Response</span>
                        <span className="font-bold text-emerald-950">{off.estimated_response_time || "30 Mins"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <IncidentActivityTimeline activities={activities} />
        </div>

        {/* RIGHT COLUMN: Head Officer Operational Action Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* HEAD OFFICER OPERATIONAL PANEL */}
          {isHeadOfficer ? (
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 rounded-3xl border border-emerald-800/40 p-5 text-white space-y-4 shadow-xl sticky top-6">
              <div className="border-b border-emerald-800/50 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">Head Officer Range Command</span>
                <h3 className="text-sm font-black text-white">Operational Action Panel</h3>
                <span className="text-[11px] text-emerald-200/80 block mt-0.5">Station: {incident.station_name || "Muthanga HQ"}</span>
              </div>

              {/* REINFORCEMENT REQUEST APPROVAL BANNER */}
              {fieldOp && fieldOp.reinforcement_requested && fieldOp.reinforcement_status === "Requested" && (
                <div className="p-3.5 rounded-2xl bg-amber-500 text-emerald-950 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-950 shrink-0" />
                    <span className="font-black">Guard Reinforcement Requested</span>
                  </div>
                  <p className="text-[11px] font-semibold opacity-90">
                    Guard requested {fieldOp.reinforcement_count} extra officers. Reason: {fieldOp.reinforcement_reason}
                  </p>
                  <button
                    onClick={handleApproveReinforcement}
                    disabled={submittingAction}
                    className="w-full py-2 rounded-xl bg-emerald-950 text-amber-300 font-extrabold text-xs shadow-xs"
                  >
                    Approve Reinforcement
                  </button>
                </div>
              )}

              {/* STAGE GATED BUTTON LOGIC */}

              {/* STAGE 1: REPORTED / PENDING REVIEW */}
              {(incident.status === "Reported" || incident.status === "Pending Review" || incident.status === "Pending") && (
                <div className="space-y-2.5">
                  <button
                    onClick={handleApproveIncident}
                    disabled={submittingAction}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-950" />}
                    Approve Incident
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveModal("request")}
                      className="py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 font-extrabold text-xs flex items-center justify-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" /> Req Info
                    </button>

                    <button
                      onClick={() => setActiveModal("reject")}
                      className="py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-extrabold text-xs flex items-center justify-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5 text-red-400" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2: APPROVED / RFO REVIEW */}
              {(incident.status === "RFO Review" || incident.status === "Approved" || incident.status === "Under Review") && (
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveModal("assign_multi")}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Users className="w-4 h-4 text-emerald-950" />
                    Assign Officers (Multi-Select)
                  </button>
                </div>
              )}

              {/* STAGE 3: OFFICERS ASSIGNED / READY FOR DISPATCH */}
              {(incident.status === "Officer Assignment" || incident.status === "Ready For Dispatch" || incident.status === "Assigned") && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 text-xs text-emerald-200">
                    <span className="font-bold block text-white">Assigned Officers: {assignedOfficersList.length}</span>
                    <span className="text-[11px] text-emerald-300/80">Click Dispatch Team to send officers into field.</span>
                  </div>

                  <button
                    onClick={handleDispatchTeam}
                    disabled={assignedOfficersList.length === 0 || submittingAction}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 text-emerald-950" />}
                    Dispatch Team into Field Operation
                  </button>
                </div>
              )}

              {/* STAGE 4: DISPATCHED / FIELD OPERATION */}
              {(incident.status === "Dispatched" || incident.status === "Travelling" || incident.status === "Reached Site" || incident.status === "Initial Assessment" || incident.status === "Action In Progress" || incident.status === "Situation Controlled") && (
                <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 space-y-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-emerald-950 font-black text-[10px] uppercase inline-block">
                    Field Operation Active
                  </span>
                  <p className="text-emerald-100 font-medium leading-relaxed">
                    Assigned officers are currently executing field operations ({incident.status}).
                  </p>
                </div>
              )}

              {/* STAGE 5: REPORT SUBMITTED - HEAD OFFICER REVIEW */}
              {(incident.status === "Awaiting Officer Approval" || incident.status === "Final Report Submitted" || incident.status === "Report Submitted") && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">Guard Report Review</span>
                  <button
                    onClick={handleApproveReport}
                    disabled={submittingAction}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" /> Approve Field Report
                  </button>

                  <button
                    onClick={() => setActiveModal("return_report")}
                    className="w-full py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-extrabold text-xs flex items-center justify-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5 text-red-400" /> Send Back For Revision
                  </button>
                </div>
              )}

              {/* STAGE 6: REPORT APPROVED -> VERIFY INCIDENT */}
              {(incident.status === "Report Approved" || incident.status === "Returned for Revision") && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-emerald-300 block">Verification Phase</span>
                  <button
                    onClick={() => setActiveModal("verify")}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" /> Verify Incident
                  </button>
                </div>
              )}

              {/* STAGE 7: VERIFIED -> CLOSE INCIDENT */}
              {incident.status === "Verified" && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-emerald-300 block">Formal Closure Phase</span>
                  <button
                    onClick={() => setActiveModal("close")}
                    className="w-full py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-emerald-950" /> Formally Close Incident
                  </button>
                </div>
              )}

              {/* STAGE 8: CLOSED */}
              {incident.status === "Closed" && (
                <div className="p-4 rounded-2xl bg-emerald-900/80 border border-emerald-600 space-y-1 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] uppercase inline-block">
                    Incident Formally Closed
                  </span>
                  <p className="text-emerald-100 font-medium">Closed by {incident.closed_by_name || "Head Officer"} on {incident.closed_at}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-emerald-950/10 p-5 space-y-3 shadow-xs text-xs">
              <span className="font-extrabold text-emerald-800 uppercase tracking-wider text-[10px] block">Range Operational Command</span>
              <p className="text-emerald-950 font-medium">
                Operational review, multi-officer assignment, report approval, verification, and closure actions are restricted to Head Officer <strong>{incident.head_officer_name || "Head RFO"}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MULTI-OFFICER SELECTION MODAL */}
      {activeModal === "assign_multi" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700">{incident.reference_id}</span>
                <h3 className="text-base font-black text-emerald-950">Assign Station Officers & Guards</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
            </div>

            {availableOfficers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold">
                No active Forest Guards/Officers are currently Available at {incident.station_name || "this station"}.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">
                  Select Officers (Check all that apply for team dispatch):
                </span>

                {/* Checkboxes List of Station Officers */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableOfficers.map((off) => {
                    const isSelected = selectedOfficerIds.includes(off.id);
                    return (
                      <div
                        key={off.id}
                        onClick={() => toggleOfficerSelection(off.id)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected ? "bg-emerald-900 text-white border-emerald-950 shadow-md" : "bg-emerald-50/50 text-emerald-950 border-emerald-950/10 hover:bg-emerald-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-amber-300" /> : <Square className="w-5 h-5 text-emerald-700" />}
                          <div>
                            <span className="font-black text-xs block">{off.full_name}</span>
                            <span className="text-[11px] opacity-80 block">{off.designation_name || "Forest Guard"} • Station: {off.station_name || "HQ"}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isSelected ? "bg-amber-400 text-emerald-950" : "bg-emerald-100 text-emerald-900"}`}>
                          {off.work_status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Mission Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Est. Response Time</label>
                    <input
                      type="text"
                      value={estTime}
                      onChange={(e) => setEstTime(e.target.value)}
                      placeholder="e.g. 30 Mins"
                      className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Dispatch Instructions</label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Specific field instructions for assigned team..."
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-xs">Cancel</button>
                  <button
                    onClick={handleSaveMultiAssignment}
                    disabled={selectedOfficerIds.length === 0 || submittingAction}
                    className="px-6 py-2 rounded-xl bg-emerald-900 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
                  >
                    Save Officer Assignments ({selectedOfficerIds.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERIFY INCIDENT MODAL */}
      {activeModal === "verify" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-emerald-950">Verify Incident</h3>
            <p className="text-emerald-800 font-medium">Verify field operations and report accuracy for this incident.</p>

            <div className="space-y-2">
              <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Verification Audit Notes *</label>
              <textarea
                rows={3}
                required
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Field resolution verified via telemetry GPS and guard report. No remaining threat."
                className="w-full p-3 rounded-xl border border-emerald-950/20 font-medium text-emerald-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button
                onClick={handleVerifyIncident}
                disabled={!verificationNotes.trim() || submittingAction}
                className="px-5 py-2 rounded-xl bg-emerald-900 text-white font-extrabold shadow-md disabled:opacity-50"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE INCIDENT MODAL */}
      {activeModal === "close" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-emerald-950">Formally Close Incident</h3>
            <p className="text-emerald-800 font-medium">Formally close incident and release assigned officers back to Available.</p>

            <div className="space-y-2">
              <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Final Closure Remarks</label>
              <textarea
                rows={3}
                value={closureRemarks}
                onChange={(e) => setClosureRemarks(e.target.value)}
                placeholder="e.g. Operation complete. Incident case closed in station register."
                className="w-full p-3 rounded-xl border border-emerald-950/20 font-medium text-emerald-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button
                onClick={handleCloseIncident}
                disabled={submittingAction}
                className="px-5 py-2 rounded-xl bg-emerald-900 text-amber-300 font-extrabold shadow-md disabled:opacity-50"
              >
                Confirm Closure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN REPORT MODAL */}
      {activeModal === "return_report" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-red-950">Return Report for Revision</h3>
            <p className="text-red-700 font-medium">Specify required corrections for the Forest Guard.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Clarify animal direction and attach high-res photo..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              className="w-full p-3 rounded-xl border border-red-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={handleReturnReport} disabled={!returnRemarks.trim() || submittingAction} className="px-5 py-2 rounded-xl bg-red-600 text-white font-extrabold shadow-md disabled:opacity-50">
                Return to Guard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-xs">
            <h3 className="text-base font-black text-red-950">Reject Incident Report</h3>
            <p className="text-red-700 font-medium">Please provide a mandatory reason for rejecting this report.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Duplicate report / False alert / Invalid jurisdiction..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-red-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={handleReject} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-red-600 text-white font-extrabold shadow-md">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFO MODAL */}
      {activeModal === "request" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-xs">
            <h3 className="text-base font-black text-amber-950">Request Information from Reporter</h3>
            <p className="text-amber-800 font-medium">Specify additional details required from the reporter.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please clarify exact landmark location or photo..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-amber-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={handleRequestInfo} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-amber-600 text-white font-extrabold shadow-md">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReviewPage;
