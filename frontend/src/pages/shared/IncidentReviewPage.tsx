import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentProgressTracker } from "@/components/incidents/IncidentProgressTracker";
import { IncidentActivityTimeline } from "@/components/incidents/IncidentActivityTimeline";
import type { Incident, IncidentActivity, User } from "@/types";
import {
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Radio,
  FileText,
  Loader2,
  ArrowLeft,
  Shield,
} from "lucide-react";

export const IncidentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [availableGuards, setAvailableGuards] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [activeModal, setActiveModal] = useState<"reject" | "request" | "verify" | "assign" | "return" | null>(null);

  // Modal Inputs
  const [rejectReason, setRejectReason] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [selectedGuardId, setSelectedGuardId] = useState<number | "">("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Guard Field Form State
  const [fieldStep, setFieldStep] = useState("Travelling");
  const [fieldRemarks, setFieldRemarks] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [animalObserved, setAnimalObserved] = useState("");
  const [damageAssessment, setDamageAssessment] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const incidentId = Number(id);

  const fetchIncidentDetails = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      setError(null);
      const [incData, actData] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getIncidentActivities(incidentId),
      ]);
      setIncident(incData);
      setActivities(actData);

      // If RFO, load available guards from same station
      if (user?.role === "Range Forest Officer" || user?.role === "Officer" || user?.role === "Admin") {
        const guards = await api.getAvailableGuards(incData.station_id || user?.station_id);
        setAvailableGuards(guards);
        if (guards.length > 0) setSelectedGuardId(guards[0].id);
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
        <p className="text-xs font-bold text-emerald-950">Loading Incident Dispatch Stream...</p>
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

  const isRFO = user?.role === "Range Forest Officer" || user?.role === "Officer" || user?.role === "Admin";
  const isAssignedGuard = user?.role === "Forest Guard" && incident.assigned_guard_id === user?.id;

  // Actions
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.rejectIncident(incident.id, { reason: rejectReason.trim() });
      setSuccess("Incident rejected successfully.");
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

  const handleVerifyClose = async () => {
    try {
      setSubmittingAction(true);
      await api.verifyCloseIncident(incident.id, { remarks: verifyRemarks.trim() });
      setSuccess("Incident verified and closed.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to verify and close incident.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAssignGuard = async () => {
    if (!selectedGuardId) {
      alert("Please select an available Forest Guard.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.assignGuardIncident(incident.id, {
        assigned_to_id: Number(selectedGuardId),
        notes: dispatchNotes.trim() || "Immediate sector response required.",
      });
      setSuccess("Forest Guard dispatched successfully.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to assign guard.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFieldUpdate = async () => {
    try {
      setSubmittingAction(true);
      await api.fieldUpdateIncident(incident.id, {
        step_name: fieldStep,
        remarks: fieldRemarks.trim(),
      });
      setSuccess(`Field status updated: ${fieldStep}`);
      setFieldRemarks("");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to update field status.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionsTaken.trim() || !damageAssessment.trim()) {
      alert("Actions Taken and Damage Assessment are required for final report.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.submitFinalReport(incident.id, {
        actions_taken: actionsTaken.trim(),
        animal_observed: animalObserved.trim() || incident.animal,
        damage_assessment: damageAssessment.trim(),
        recommendations: recommendations.trim() || "Regular patrol monitoring.",
        remarks: fieldRemarks.trim(),
      });
      setSuccess("Final Field Report submitted to Range Officer.");
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to submit final report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveClose = async () => {
    try {
      setSubmittingAction(true);
      await api.approveCloseIncident(incident.id, { remarks: verifyRemarks.trim() || "Approved final guard report." });
      setSuccess("Final report approved & incident closed.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to approve report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReturnCorrection = async () => {
    if (!returnNotes.trim()) {
      alert("Correction notes are required.");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.returnCorrectionIncident(incident.id, { correction_notes: returnNotes.trim() });
      setSuccess("Report returned for correction.");
      setActiveModal(null);
      fetchIncidentDetails();
    } catch (err: any) {
      alert(err.message || "Failed to return report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-emerald-950 border border-emerald-950/10 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-700" /> Back to Incidents Stream
      </button>

      {/* Header Banner */}
      <PageHeader
        title={`Incident ${incident.reference_id}: ${incident.incident_title}`}
        subtitle={`Reported at ${incident.location} • Station: ${incident.station_name || "Sector Range"}`}
        icon={AlertCircle}
        badge={incident.status}
      />

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-900 text-lg font-bold">×</button>
        </div>
      )}

      {/* Horizontal Progress Tracker */}
      <IncidentProgressTracker currentStatus={incident.status} />

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Primary Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-3">
              Incident Record Details
            </h3>

            {incident.images && incident.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incident.images.map((img, idx) => (
                  <div key={idx} className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 border border-emerald-950/10 shadow-xs">
                    <img
                      src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img}
                      alt={`Incident Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs space-y-3">
              <div>
                <span className="font-extrabold text-emerald-800/70 block mb-1">Detailed Description</span>
                <p className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-950/5 text-emerald-950 font-medium leading-relaxed">
                  {incident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-950/10">
                  <span className="text-[10px] font-extrabold text-emerald-800/70 uppercase block">People Injured</span>
                  <span className={`font-black ${incident.people_injured ? "text-red-700" : "text-emerald-950"}`}>
                    {incident.people_injured ? "YES (Injuries)" : "NO"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-950/10">
                  <span className="text-[10px] font-extrabold text-emerald-800/70 uppercase block">Livestock Damage</span>
                  <span className={`font-black ${incident.livestock_damage ? "text-amber-700" : "text-emerald-950"}`}>
                    {incident.livestock_damage ? "YES (Affected)" : "NO"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-950/10">
                  <span className="text-[10px] font-extrabold text-emerald-800/70 uppercase block">Property Damage</span>
                  <span className={`font-black ${incident.property_damage ? "text-amber-700" : "text-emerald-950"}`}>
                    {incident.property_damage ? "YES (Damaged)" : "NO"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-950/10">
                  <span className="text-[10px] font-extrabold text-emerald-800/70 uppercase block">Crop Damage</span>
                  <span className={`font-black ${incident.crop_damage ? "text-amber-700" : "text-emerald-950"}`}>
                    {incident.crop_damage ? "YES (Raid)" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RFO DECISION PANEL */}
          {isRFO && (incident.status === "Pending Review" || incident.status === "Under Review" || incident.status === "Pending") && (
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 rounded-3xl border border-emerald-800/40 p-6 text-white space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-black text-amber-300">Range Forest Officer Operational Decision Panel</h3>
                <p className="text-xs text-emerald-200/90 font-medium">Review field report and select operational decision for Station Range</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal("reject")}
                  className="p-3 rounded-2xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 font-extrabold text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <XCircle className="w-5 h-5 text-red-400" /> Reject Incident
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal("request")}
                  className="p-3 rounded-2xl bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-200 font-extrabold text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Request Info
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal("verify")}
                  className="p-3 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/40 text-emerald-100 font-extrabold text-xs flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" /> Verify & Close
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal("assign")}
                  className="p-3 rounded-2xl bg-amber-500 text-emerald-950 font-black text-xs flex flex-col items-center gap-1 shadow-lg transition-all active:scale-95"
                >
                  <Radio className="w-5 h-5 text-emerald-950" /> Verify & Dispatch Guard
                </button>
              </div>
            </div>
          )}

          {/* RFO FINAL REPORT REVIEW PANEL (When status is Resolved) */}
          {isRFO && incident.status === "Resolved" && (
            <div className="bg-amber-500 text-emerald-950 rounded-3xl p-6 space-y-4 shadow-xl border border-amber-600">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-950" />
                <div>
                  <h3 className="text-base font-black">Forest Guard Field Report Awaiting RFO Approval</h3>
                  <p className="text-xs font-bold opacity-90">Forest Guard has completed field operation and submitted final resolution report.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveModal("return")}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-red-800 font-extrabold text-xs border border-red-200 shadow-xs"
                >
                  Return for Correction
                </button>
                <button
                  onClick={handleApproveClose}
                  disabled={submittingAction}
                  className="px-6 py-2.5 rounded-xl bg-emerald-950 hover:bg-black text-amber-300 font-black text-xs shadow-md"
                >
                  {submittingAction ? "Closing..." : "Approve Report & Close Incident"}
                </button>
              </div>
            </div>
          )}

          {/* GUARD FIELD WORKFLOW PANEL */}
          {isAssignedGuard && (incident.status === "Assigned" || incident.status === "In Progress") && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                <div>
                  <h3 className="text-base font-black text-emerald-950">Forest Guard Field Execution Panel</h3>
                  <p className="text-xs text-emerald-800/70 font-medium">Log field progress step by step or submit final report</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-black text-xs">
                  Guard Assignment Active
                </span>
              </div>

              {/* Step Progress Updater */}
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-950/10">
                <h4 className="text-xs font-black uppercase text-emerald-950">Update Operational Field Step</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Travelling", "Reached Site", "Assessment Completed", "Action Taken"] as const).map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setFieldStep(step)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        fieldStep === step ? "bg-emerald-900 text-white border-emerald-950 shadow-md" : "bg-white text-emerald-950 border-emerald-950/10"
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Field step remarks / location notes..."
                    value={fieldRemarks}
                    onChange={(e) => setFieldRemarks(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white font-medium text-emerald-950"
                  />
                  <button
                    onClick={handleFieldUpdate}
                    disabled={submittingAction}
                    className="px-4 py-2 bg-emerald-900 text-white font-bold text-xs rounded-xl"
                  >
                    Save Step
                  </button>
                </div>
              </div>

              {/* Final Report Form */}
              <form onSubmit={handleSubmitReport} className="space-y-4 pt-2 border-t border-emerald-950/10">
                <h4 className="text-xs font-black uppercase text-emerald-950">Final Field Incident Report Submission</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Actions Taken *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Driven elephant herd back to core forest using firecrackers & sirens..."
                      value={actionsTaken}
                      onChange={(e) => setActionsTaken(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white text-emerald-950 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Animal Observed *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2 Adult Asian Elephants"
                      value={animalObserved}
                      onChange={(e) => setAnimalObserved(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white text-emerald-950 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Damage Assessment *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Minor fence damage, no human casualties or livestock loss..."
                      value={damageAssessment}
                      onChange={(e) => setDamageAssessment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white text-emerald-950 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">Field Recommendations</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Enhance night solar fencing patrol in Sector 4..."
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-950/15 bg-white text-emerald-950 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-amber-300" />
                    Submit Final Field Report for RFO Approval
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Activity Timeline */}
          <IncidentActivityTimeline activities={activities} />
        </div>

        {/* Right Column: Metadata Sidebar Card */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs text-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-2">
              Metadata & Attributes
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Animal Species:</span>
                <span className="font-extrabold text-emerald-950">{incident.animal_species_name || incident.animal}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Category:</span>
                <span className="font-extrabold text-emerald-950">{incident.incident_category}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Severity:</span>
                <span className="font-extrabold text-amber-900">{incident.severity}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Weather:</span>
                <span className="font-bold text-emerald-950">{incident.weather}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Date / Time:</span>
                <span className="font-bold text-emerald-950">{incident.date_reported} @ {incident.time_reported}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Reporter:</span>
                <span className="font-extrabold text-emerald-950">{incident.reporter_name} ({incident.reporter_role})</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Station Range:</span>
                <span className="font-extrabold text-emerald-950">{incident.station_name || "Assigned Station"}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Assigned Guard:</span>
                <span className="font-extrabold text-emerald-950">{incident.assigned_guard_name || "Unassigned"}</span>
              </div>

              <div>
                <span className="text-emerald-800/70 font-semibold block mb-1">GPS Field Location</span>
                <span className="font-mono text-[11px] font-bold text-emerald-950 block bg-emerald-50 p-2 rounded-xl border border-emerald-950/10">
                  {incident.latitude ? `${incident.latitude.toFixed(5)}, ${incident.longitude?.toFixed(5)}` : "No GPS Captured"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RFO MODALS */}

      {/* Reject Modal */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-red-950">Reject Incident Report</h3>
            <p className="text-xs text-red-700 font-medium">Please provide a clear reason for rejecting this incident report.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Duplicate report / False alert / Out of forest division jurisdiction..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-red-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold">Cancel</button>
              <button onClick={handleReject} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md">
                Reject Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {activeModal === "request" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-amber-950">Request Additional Information</h3>
            <p className="text-xs text-amber-800 font-medium">Specify what information is needed from the reporter.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please clarify exact landmark location or upload photo of crop damage..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-amber-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold">Cancel</button>
              <button onClick={handleRequestInfo} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs shadow-md">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify & Close Modal */}
      {activeModal === "verify" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-emerald-950">Verify & Close Incident</h3>
            <p className="text-xs text-emerald-800/70 font-medium">Confirm verification without dispatching field personnel.</p>
            <textarea
              rows={3}
              placeholder="e.g. Sighting verified from CCTV feed; animal returned into forest core. No dispatch required."
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-emerald-950/15 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold">Cancel</button>
              <button onClick={handleVerifyClose} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-emerald-900 text-white font-extrabold text-xs shadow-md">
                Verify & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify & Dispatch Guard Modal */}
      {activeModal === "assign" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950">Assign Available Forest Guard</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
            </div>

            {availableGuards.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                No Forest Guards are currently Available at {incident.station_name || "this station"}. All active guards are busy on other missions.
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                  Select Available Forest Guard (Same Station)
                </label>
                <div className="space-y-2">
                  {availableGuards.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGuardId(g.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedGuardId === g.id
                          ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                          : "bg-emerald-50/50 text-emerald-950 border-emerald-950/10 hover:bg-emerald-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center border border-amber-300">
                          {g.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block">{g.full_name}</span>
                          <span className="text-[11px] opacity-80 block">{g.designation_name || "Forest Guard"} &bull; Station: {g.station_name || "Station"}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900">
                        {g.work_status}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">
                    Dispatch Orders / Mission Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter sector entry instructions, safety gear required, response priority..."
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-emerald-950/15 font-medium text-emerald-950"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold">Cancel</button>
                  <button
                    onClick={handleAssignGuard}
                    disabled={submittingAction || availableGuards.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-900 text-white font-extrabold text-xs shadow-md"
                  >
                    Dispatch Selected Guard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      {activeModal === "return" && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-black text-red-950">Return Report for Correction</h3>
            <p className="text-xs text-red-700 font-medium">Specify required corrections for the Forest Guard.</p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please specify exact damage assessment metrics and attach photos..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-red-300 font-medium text-emerald-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-xs font-bold">Cancel</button>
              <button onClick={handleReturnCorrection} disabled={submittingAction} className="px-5 py-2 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md">
                Return to Guard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReviewPage;
