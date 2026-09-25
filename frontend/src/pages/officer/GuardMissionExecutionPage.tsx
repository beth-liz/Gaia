import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { inventoryService } from "@/services/inventoryService";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentActivityTimeline } from "@/components/incidents/IncidentActivityTimeline";
import type { Incident, IncidentActivity, FieldOperation } from "@/types";
import {
  CheckCircle2,
  Radio,
  Loader2,
  ArrowLeft,
  MapPin,
  Shield,
  Truck,
  CheckSquare,
  Square,
  FileCheck,
  FileText,
  Navigation,
  PlusCircle,
  Camera,
} from "lucide-react";

const STEP_ORDER = [
  "Pending Acceptance",
  "Inventory Request",
  "Travelling",
  "Reached Site",
  "Initial Assessment",
  "Action In Progress",
  "Situation Controlled",
  "Evidence Uploaded",
  "Final Report",
  "Final Report Submitted",
  "Return Inventory",
];

const ACTION_CHECKLIST_ITEMS = [
  "Patrolling",
  "Firecrackers",
  "Rescue",
  "Veterinary Team",
  "Public Warning",
  "Road Block",
  "Traffic Control",
  "Other",
];

export const GuardMissionExecutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incidentId = Number(id);

  const [incident, setIncident] = useState<Incident | null>(null);
  const [fieldOp, setFieldOp] = useState<FieldOperation | null>(null);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Inputs for Field Steps
  const [departureTime, setDepartureTime] = useState("");
  const [vehicle, setVehicle] = useState("Forest Patrol Jeep");
  const [acceptRemarks, setAcceptRemarks] = useState("");
  
  // Inventory State
  // @ts-ignore
  const [stationInventory, setStationInventory] = useState<any[]>([]);
  const [inventoryQuantities, setInventoryQuantities] = useState<Record<number, number>>({});
  // @ts-ignore
  const [showNoInventoryModal, setShowNoInventoryModal] = useState(false);


  const [travellingTime, setTravellingTime] = useState("");
  const [travellingGps, setTravellingGps] = useState("");
  const [travellingRemarks, setTravellingRemarks] = useState("");

  const [arrivalTime, setArrivalTime] = useState("");
  const [arrivalGps, setArrivalGps] = useState("");
  const [arrivalWeather, setArrivalWeather] = useState("Sunny / Clear");
  const [arrivalRemarks, setArrivalRemarks] = useState("");

  const [animalPresent, setAnimalPresent] = useState(true);
  const [animalCount, setAnimalCount] = useState(1);
  const [animalBehaviour, setAnimalBehaviour] = useState("Calm");
  const [threatLevel, setThreatLevel] = useState("Medium");
  const [humanInjury, setHumanInjury] = useState(false);
  const [livestockDamage, setLivestockDamage] = useState(false);
  const [propertyDamage, setPropertyDamage] = useState(false);
  const [assessmentRemarks, setAssessmentRemarks] = useState("");

  const [selectedActions, setSelectedActions] = useState<string[]>(["Patrolling"]);
  const [actionRemarks, setActionRemarks] = useState("");

  const [outcome, setOutcome] = useState("Animal Chased into Core Forest");
  const [animalDirection, setAnimalDirection] = useState("Core Sanctuary Range");
  const [distanceCovered, setDistanceCovered] = useState("1.2 km");
  const [remainingRisk, setRemainingRisk] = useState("Low");
  const [situationRemarks, setSituationRemarks] = useState("");

  const [evidenceGps, setEvidenceGps] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState<FileList | null>(null);

  // Reinforcement Request Inputs
  const [showReinforcementModal, setShowReinforcementModal] = useState(false);
  const [reinfReason, setReinfReason] = useState("");
  const [reinfPriority, setReinfPriority] = useState("High");
  const [reinfCount, setReinfCount] = useState(2);
  const [reinfRemarks, setReinfRemarks] = useState("");

  // Final Report Signature Input
  // @ts-ignore
  const [signature, setSignature] = useState<string>("");
  const [reportReviewed, setReportReviewed] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

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

  const loadMissionData = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      const [incData, opData, actData, stStock] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getFieldOp(incidentId),
        api.getIncidentActivities(incidentId),
        inventoryService.getMyStationInventory()
      ]);
      setIncident(incData);
      setFieldOp(opData);
      setActivities(actData);
      setStationInventory(stStock);

      // Pre-fill defaults
      const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (!departureTime) setDepartureTime(nowTime);
      if (!travellingTime) setTravellingTime(nowTime);
      if (!arrivalTime) setArrivalTime(nowTime);
      if (incData.latitude && incData.longitude) {
        const gpsStr = `${incData.latitude.toFixed(5)}° N, ${incData.longitude.toFixed(5)}° E`;
        setTravellingGps(gpsStr);
        setArrivalGps(gpsStr);
        setEvidenceGps(gpsStr);
      }
    } catch (err) {
      console.error("Failed to load mission field operation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissionData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-xs font-bold text-emerald-950">Initializing Field Mission Command...</p>
      </div>
    );
  }

  if (!incident || !fieldOp) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-red-200 text-xs font-bold text-red-950">
        Unable to load mission data.
      </div>
    );
  }

  const currentStep = fieldOp.current_step || "Pending Acceptance";
  const currentStepIdx = STEP_ORDER.indexOf(currentStep);

  const currentUserStr = localStorage.getItem("gaia_user");
  let currentUserId: number | null = null;
  if (currentUserStr) {
    try {
      const u = JSON.parse(currentUserStr);
      currentUserId = u.id;
    } catch(e) {}
  }
  const myAssignment = incident?.assigned_officers?.find(a => a.officer_id === currentUserId);
  const iHaveAccepted = myAssignment?.assignment_status === "Accepted" || myAssignment?.assignment_status === "Completed";
  const allAssigned = incident?.assigned_officers?.filter(a => a.assignment_status !== "Removed") || [];
  const pendingGuards = allAssigned.filter(a => a.assignment_status !== "Accepted" && a.assignment_status !== "Completed");
  const allAccepted = pendingGuards.length === 0;
  
  const pendingInventoryGuards = allAssigned.filter(a => a.inventory_status !== "READY" && a.inventory_status !== "NOT_REQUIRED");
  const allInventoryReady = pendingInventoryGuards.length === 0;
  
  const myInventoryStatus = myAssignment?.inventory_status || "PENDING";


  const toggleActionItem = (item: string) => {
    setSelectedActions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // STEP SUBMISSION HANDLERS
  const handleAcceptMission = async () => {
    try {
      setSubmitting(true);
      const updated = await api.acceptMission(incidentId, {
        departure_time: departureTime,
        vehicle,
        remarks: acceptRemarks,
      });
      setFieldOp(updated);
      setSuccessMsg("Mission Accepted! Status set to Travelling.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to accept mission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepTravelling = async () => {
    try {
      setSubmitting(true);
      const updated = await api.fieldStepTravelling(incidentId, {
        start_time: travellingTime,
        gps: travellingGps,
        remarks: travellingRemarks,
      });
      setFieldOp(updated);
      setSuccessMsg("En-Route status logged. Ready for Site Arrival.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to log travelling step.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepReachedSite = async () => {
    try {
      setSubmitting(true);
      const updated = await api.fieldStepReachedSite(incidentId, {
        arrival_time: arrivalTime,
        gps: arrivalGps,
        arrival_weather: arrivalWeather,
        remarks: arrivalRemarks,
      });
      setFieldOp(updated);
      setSuccessMsg("Site Arrival confirmed! Proceeding to Initial Assessment.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to log site arrival.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepAssessment = async () => {
    try {
      setSubmitting(true);
      const updated = await api.fieldStepAssessment(incidentId, {
        animal_present: animalPresent,
        animal_count: animalCount,
        animal_behaviour: animalBehaviour,
        threat_level: threatLevel,
        human_injury: humanInjury,
        livestock_damage: livestockDamage,
        property_damage: propertyDamage,
        remarks: assessmentRemarks,
      });
      setFieldOp(updated);
      setSuccessMsg("Initial Assessment completed! Select field actions taken.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to submit initial assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepActionTaken = async () => {
    if (selectedActions.length === 0) {
      alert("Please select at least one action item from the checklist.");
      return;
    }
    if (!actionRemarks.trim()) {
      alert("Mandatory action remarks are required.");
      return;
    }
    try {
      setSubmitting(true);
      const updated = await api.fieldStepActionTaken(incidentId, {
        actions_checklist: selectedActions,
        remarks: actionRemarks.trim(),
      });
      setFieldOp(updated);
      setSuccessMsg("Field action logged! Update situation outcome.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to log field action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepSituationControlled = async () => {
    try {
      setSubmitting(true);
      const updated = await api.fieldStepSituationControlled(incidentId, {
        outcome,
        animal_direction: animalDirection,
        distance: distanceCovered,
        remaining_risk: remainingRisk,
        remarks: situationRemarks,
      });
      setFieldOp(updated);
      setSuccessMsg("Situation Controlled confirmed! Upload evidence.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to update situation status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepEvidence = async () => {
    try {
      setSubmitting(true);
      const updated = await api.fieldStepEvidence(incidentId, { gps: evidenceGps, photos: evidencePhotos });
      setFieldOp(updated);
      setSuccessMsg("Field evidence logged! Review automated final report.");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to log evidence.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReinforcement = async () => {
    if (!reinfReason.trim()) {
      alert("Reinforcement reason is required.");
      return;
    }
    try {
      setSubmitting(true);
      await api.requestReinforcement(incidentId, {
        reason: reinfReason.trim(),
        priority: reinfPriority,
        count: reinfCount,
        remarks: reinfRemarks,
      });
      setSuccessMsg("Reinforcement request submitted to Range Head Officer.");
      setShowReinforcementModal(false);
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to request reinforcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!signatureFile) { alert("Signature required."); return; }
    try {
      setSubmitting(true);
      const updated = await api.generateAutomatedFinalReport(incidentId, signatureFile);
      setFieldOp(updated);
      setSuccessMsg("Final report generated. Please review and submit.");
      await loadMissionData();
    } catch(err: any) {
      alert(err.message || "Failed to generate report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSubmitReport = async () => {
    if (!reportReviewed) {
      alert("Please review the report before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      const updated = await api.submitAutomatedFinalReport(incidentId);
      setFieldOp(updated);
      setSuccessMsg("Automated Final Report Submitted to Head Officer for Verification");
      await loadMissionData();
    } catch (err: any) {
      let msg = err.message;
      if (typeof msg === 'object') msg = JSON.stringify(msg);
      alert(msg || "Unable to submit the report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-emerald-950 border border-emerald-950/10 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-700" /> Back to Guard Assignments
      </button>

      {/* Header Banner */}
      <PageHeader
        title={`Field Mission ${incident.reference_id}: ${incident.incident_title}`}
        subtitle={`Location: ${incident.location} • Station: ${incident.station_name || "Muthanga Range"}`}
        icon={Radio}
        badge={currentStep}
      />

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-900 text-lg font-black">×</button>
        </div>
      )}

      {/* SEQUENTIAL STEP PROGRESS BAR */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-5 shadow-xs overflow-x-auto">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70 block mb-3">
          Forest Guard Field Operation Pipeline (Sequential Step Gating)
        </span>
        <div className="flex items-center gap-2 min-w-[700px]">
          {STEP_ORDER.map((st, idx) => {
            const isDone = currentStepIdx > idx || currentStep === "Final Report Submitted";
            const isCurrent = currentStepIdx === idx && currentStep !== "Final Report Submitted";
            return (
              <React.Fragment key={st}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                    isDone
                      ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                      : isCurrent
                      ? "bg-amber-400 text-emerald-950 shadow-md ring-2 ring-amber-500/50"
                      : "bg-gray-100 text-gray-500 opacity-60"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <span>{st}</span>
                </div>
                {idx < STEP_ORDER.length - 1 && (
                  <div className={`h-0.5 w-4 shrink-0 ${isDone ? "bg-emerald-500" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* EXPANDED FULL-WIDTH 3-COLUMN TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Incident Attributes & Photos (3 cols) */}
        <div className="lg:col-span-3 space-y-4 bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-5 shadow-xs text-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-2">
            Incident Parameters
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-950/5">
              <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal Species</span>
              <span className="font-extrabold text-emerald-950 block text-sm">{incident.animal_species_name || incident.animal}</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-950/5">
              <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity / Weather</span>
              <span className="font-extrabold text-amber-900 block">{incident.severity} • {incident.weather || "Sunny"}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-extrabold text-emerald-950">{incident.location}</span>
              </div>
              <div className="text-[11px] text-emerald-800/80">Village: <strong>{incident.village_name || "Sector Range"}</strong></div>
              <div className="text-[11px] text-emerald-800/80">Reporter: <strong>{incident.reporter_name} ({incident.reporter_role})</strong></div>
            </div>

            {incident.latitude && incident.longitude && (
              <div className="p-2.5 rounded-xl bg-emerald-950/5 border border-emerald-950/10 font-mono text-[11px]">
                <strong>GPS:</strong> {incident.latitude.toFixed(4)}° N, {incident.longitude.toFixed(4)}° E
              </div>
            )}

            {incident.description && (
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase mb-1">Field Description</span>
                <p className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-950/5 text-emerald-950 leading-relaxed font-medium">
                  {incident.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Mission Progress Stepper & Active Step Form (6 cols) */}
        <div className="lg:col-span-6 space-y-5 bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">Active Step Execution</span>
              <h3 className="text-base font-black text-emerald-950">{currentStep}</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs shadow-xs">
              Step {currentStepIdx + 1} of {STEP_ORDER.length}
            </span>
          </div>

          {/* STEP 0: PENDING ACCEPTANCE */}
          {currentStep === "Pending Acceptance" && (
            <div className="space-y-4 text-xs">
              {/* ASSIGNED GUARDS STATUS PANEL */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-3 shadow-sm">
                <h4 className="font-black text-emerald-950 text-xs uppercase border-b border-emerald-50 pb-2">Assigned Officers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAssigned.map(a => (
                    <div key={a.officer_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-800 text-[11px]">{a.full_name}</span>
                      {(a.assignment_status === "Accepted" || a.assignment_status === "Completed") ? (
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Accepted</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">⏳ Pending</span>
                      )}
                    </div>
                  ))}
                </div>
                {!allAccepted && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <p className="font-black text-[11px] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">!</span>
                      WAITING FOR ALL GUARDS TO ACCEPT
                    </p>
                    <p className="font-medium text-[10px] opacity-80">
                      Field operations cannot begin until all assigned Guards accept this mission.
                      Waiting for: {pendingGuards.map(g => g.full_name).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {!iHaveAccepted ? (
                <>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 mt-4">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-700" /> Mission Dispatch Pending Acceptance
                    </span>
                    <p className="text-[11px] font-medium opacity-90">
                      Head Officer has assigned you to this field mission. You must accept the mission to unlock step-by-step field operations.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Departure Time *</label>
                      <input
                        type="text"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        placeholder="e.g. 14:30"
                        className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Patrol Vehicle *</label>
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                      >
                        <option value="Forest Patrol Jeep">Forest Patrol Jeep</option>
                        <option value="Patrol Motorbike">Patrol Motorbike</option>
                        <option value="Foot Patrol Team">Foot Patrol Team</option>
                        <option value="Wildlife Rescue Van">Wildlife Rescue Van</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Acceptance Remarks (Optional)</label>
                    <textarea
                      value={acceptRemarks}
                      onChange={(e) => setAcceptRemarks(e.target.value)}
                      placeholder="Enter any preliminary notes or team details before departing..."
                      className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950 min-h-[60px]"
                    />
                  </div>

                  <button
                    onClick={handleAcceptMission}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {submitting ? "Accepting..." : "Accept Mission"}
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mt-4 text-center">
                  <span className="font-black text-sm flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> You Have Accepted The Mission
                  </span>
                  <p className="font-medium text-xs">
                    Please wait for the remaining assigned Guards to accept before starting field operations.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* STEP 0.5: INVENTORY REQUEST */}
          {currentStep === "Inventory Request" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-emerald-100 space-y-3 shadow-sm">
                <h4 className="font-black text-emerald-950 text-xs uppercase border-b border-emerald-50 pb-2">Inventory Readiness</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAssigned.map(a => (
                    <div key={a.officer_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="font-bold text-gray-800 text-[11px]">{a.full_name}</span>
                      {(a.inventory_status === "READY" || a.inventory_status === "NOT_REQUIRED") ? (
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Dispatched</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">⏳ Pending</span>
                      )}
                    </div>
                  ))}
                </div>
                {!allInventoryReady && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <p className="font-black text-[11px] mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">!</span>
                      WAITING FOR INVENTORY DISPATCH
                    </p>
                    <p className="font-medium text-[10px] opacity-80">
                      Travelling is locked until all required inventory is dispatched.
                      Waiting for: {pendingInventoryGuards.map(g => g.full_name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              
              {myInventoryStatus === "PENDING" && (
    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-4 mt-4">
      <div className="flex items-center justify-between border-b border-blue-200/50 pb-3">
        <span className="font-black text-sm flex items-center gap-1.5">
          <Shield className="w-5 h-5 text-blue-700" /> INVENTORY REQUIRED FOR THIS MISSION
        </span>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {stationInventory.length === 0 ? (
          <div className="p-4 text-center text-blue-800/60 font-medium">
            No available inventory at this station.
          </div>
        ) : (
          stationInventory.map(item => {
            const qty = inventoryQuantities[item.id] || 0;
            return (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-blue-950 text-[11px]">{item.item_name}</h5>
                  <p className="text-[10px] font-medium text-blue-800/70 mt-0.5">Available: {item.available_quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInventoryQuantities(prev => ({...prev, [item.id]: Math.max(0, qty - 1)}))}
                    className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-700 font-black"
                  >
                    -
                  </button>
                  <span className="font-black text-blue-950 w-4 text-center">{qty}</span>
                  <button
                    onClick={() => setInventoryQuantities(prev => ({...prev, [item.id]: Math.min(item.available_quantity, qty + 1)}))}
                    className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-700 font-black"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {Object.keys(inventoryQuantities).some(k => inventoryQuantities[parseInt(k)] > 0) && (
        <div className="p-3 bg-blue-900 text-white rounded-xl space-y-2 mt-4">
          <h5 className="font-black text-[10px] uppercase text-blue-300">Selected Items</h5>
          {Object.entries(inventoryQuantities).filter(([_, q]) => q > 0).map(([id, q]) => {
            const itemName = stationInventory.find(i => i.id === parseInt(id))?.item_name;
            return (
              <div key={id} className="flex justify-between text-[11px] font-medium border-b border-blue-800/50 pb-1 last:border-0 last:pb-0">
                <span>{itemName}</span>
                <span className="font-black">× {q}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={async () => {
              try {
                const requests = Object.entries(inventoryQuantities).filter(([_, q]) => q > 0);
                if (requests.length === 0) {
                  alert("Please select at least one item or choose 'I DON\'T NEED ANY INVENTORY'.");
                  return;
                }
                setSubmitting(true);
                
                await Promise.all(
                  requests.map(([id, qty]) =>
                    inventoryService.createEquipmentRequest({
                      station_inventory_id: parseInt(id),
                      quantity: qty,
                      purpose: `Mission INC-${incidentId}`,
                      incident_id: incidentId
                    })
                  )
                );
                
                setSuccessMsg("Inventory requests submitted successfully.");
                await loadMissionData();
              } catch(e: any) {
                alert(e.message || "Failed to submit requests.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || !Object.keys(inventoryQuantities).some(k => inventoryQuantities[parseInt(k)] > 0)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all text-center"
          >
            SEND INVENTORY REQUEST
          </button>
          
          <button
            onClick={() => setShowNoInventoryModal(true)}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-sm transition-all text-center"
          >
            I DON'T NEED ANY INVENTORY
          </button>
      </div>
    </div>
)}
                
                {myInventoryStatus === "REQUESTED" && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 mt-4 text-center">
                    <span className="font-black text-sm flex items-center justify-center gap-2 mb-2">
                      ⏳ Inventory Requested
                    </span>
                    <p className="font-medium text-xs">
                      Your inventory request is awaiting Head Officer approval.
                    </p>
                  </div>
              )}
              {(myInventoryStatus === "READY" || myInventoryStatus === "NOT_REQUIRED") && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mt-4 text-center">
                    <span className="font-black text-sm flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Inventory Ready
                    </span>
                    <p className="font-medium text-xs">
                      Your equipment is ready. Please wait for the remaining assigned Guards if applicable.
                    </p>
                  </div>
              )}
            </div>
          )}

          {/* STEP 1: TRAVELLING */}
          {currentStep === "Travelling" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">En-Route Start Time</label>
                  <input
                    type="text"
                    value={travellingTime}
                    onChange={(e) => setTravellingTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Active Patrol GPS</label>
                  <input
                    type="text"
                    value={travellingGps}
                    onChange={(e) => setTravellingGps(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-mono font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">En-Route Remarks</label>
                <textarea
                  rows={2}
                  value={travellingRemarks}
                  onChange={(e) => setTravellingRemarks(e.target.value)}
                  placeholder="En-route via sector road 4. Approaching village boundary..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepTravelling}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-amber-300" />}
                Confirm En-Route & Advance to Site Arrival
              </button>
            </div>
          )}

          {/* STEP 2: REACHED SITE */}
          {currentStep === "Reached Site" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Arrival Time</label>
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Weather at Site</label>
                  <select
                    value={arrivalWeather}
                    onChange={(e) => setArrivalWeather(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="Sunny / Clear">Sunny / Clear</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Heavy Rain">Heavy Rain</option>
                    <option value="Foggy / Low Visibility">Foggy / Low Visibility</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Arrival GPS</label>
                  <input
                    type="text"
                    value={arrivalGps}
                    onChange={(e) => setArrivalGps(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-mono font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Site Arrival Remarks</label>
                <textarea
                  rows={2}
                  value={arrivalRemarks}
                  onChange={(e) => setArrivalRemarks(e.target.value)}
                  placeholder="Patrol team arrived at site. Established perimeter..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepReachedSite}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-amber-300" />}
                Confirm Site Arrival & Begin Initial Assessment
              </button>
            </div>
          )}

          {/* STEP 3: INITIAL ASSESSMENT */}
          {currentStep === "Initial Assessment" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Animal Present?</label>
                  <select
                    value={animalPresent ? "yes" : "no"}
                    onChange={(e) => setAnimalPresent(e.target.value === "yes")}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="yes">YES (Visible)</option>
                    <option value="no">NO (Moved)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Animal Count</label>
                  <input
                    type="number"
                    min={1}
                    value={animalCount}
                    onChange={(e) => setAnimalCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Behaviour</label>
                  <select
                    value={animalBehaviour}
                    onChange={(e) => setAnimalBehaviour(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="Calm">Calm</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Frightened">Frightened</option>
                    <option value="Injured">Injured</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Threat Level</label>
                  <select
                    value={threatLevel}
                    onChange={(e) => setThreatLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-950/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={humanInjury}
                    onChange={(e) => setHumanInjury(e.target.checked)}
                    className="rounded text-emerald-900 focus:ring-emerald-800"
                  />
                  <span className="font-bold text-[11px] text-emerald-950">Human Injury</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-950/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={livestockDamage}
                    onChange={(e) => setLivestockDamage(e.target.checked)}
                    className="rounded text-emerald-900 focus:ring-emerald-800"
                  />
                  <span className="font-bold text-[11px] text-emerald-950">Livestock Loss</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-950/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyDamage}
                    onChange={(e) => setPropertyDamage(e.target.checked)}
                    className="rounded text-emerald-900 focus:ring-emerald-800"
                  />
                  <span className="font-bold text-[11px] text-emerald-950">Crop/Property</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Assessment Notes</label>
                <textarea
                  rows={2}
                  value={assessmentRemarks}
                  onChange={(e) => setAssessmentRemarks(e.target.value)}
                  placeholder="Observed 2 adult elephants near coffee plantation border..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepAssessment}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-amber-300" />}
                Complete Initial Assessment & Select Actions Taken
              </button>
            </div>
          )}

          {/* STEP 4: ACTION TAKEN (CHECKLIST) */}
          {currentStep === "Action In Progress" && (
            <div className="space-y-4 text-xs">
              <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">
                Select Field Action Checklist Items (Select all implemented):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACTION_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = selectedActions.includes(item);
                  return (
                    <div
                      key={item}
                      onClick={() => toggleActionItem(item)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                        isChecked
                          ? "bg-emerald-900 text-white border-emerald-950 shadow-xs"
                          : "bg-emerald-50/50 text-emerald-950 border-emerald-950/10 hover:bg-emerald-100"
                      }`}
                    >
                      {isChecked ? <CheckSquare className="w-4 h-4 text-amber-300 shrink-0" /> : <Square className="w-4 h-4 text-emerald-700 shrink-0" />}
                      <span className="font-bold text-[11px]">{item}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Action Execution Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Burst firecrackers and sounded sirens to drive herd back towards forest core..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepActionTaken}
                disabled={submitting || selectedActions.length === 0 || !actionRemarks.trim()}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 text-amber-300" />}
                Submit Action & Advance to Situation Controlled
              </button>
            </div>
          )}

          {/* STEP 5: SITUATION CONTROLLED */}
          {currentStep === "Situation Controlled" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Mission Outcome</label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="Animal Chased into Core Forest">Animal Chased into Core Forest</option>
                    <option value="Captured / Rescued Safely">Captured / Rescued Safely</option>
                    <option value="Monitored at Safe Distance">Monitored at Safe Distance</option>
                    <option value="Returned Naturally to Sanctuary">Returned Naturally to Sanctuary</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Animal Direction</label>
                  <input
                    type="text"
                    value={animalDirection}
                    onChange={(e) => setAnimalDirection(e.target.value)}
                    placeholder="e.g. North Sanctuary Core"
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Distance Covered</label>
                  <input
                    type="text"
                    value={distanceCovered}
                    onChange={(e) => setDistanceCovered(e.target.value)}
                    placeholder="e.g. 1.5 km"
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Remaining Risk</label>
                  <select
                    value={remainingRisk}
                    onChange={(e) => setRemainingRisk(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Situation Remarks</label>
                <textarea
                  rows={2}
                  value={situationRemarks}
                  onChange={(e) => setSituationRemarks(e.target.value)}
                  placeholder="Herd driven 1.5 km into sanctuary core. Perimeter secure..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepSituationControlled}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                Confirm Situation Controlled & Upload Evidence
              </button>
            </div>
          )}

          {/* STEP 6: EVIDENCE UPLOAD */}
          {currentStep === "Evidence Uploaded" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-950/10 space-y-2">
                <span className="font-bold text-emerald-950 block flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-700" /> Evidence Capture & GPS Log
                </span>
                <p className="text-[11px] text-emerald-800/80">
                  GPS position and field photo evidence registered. Ready for automated report compilation.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Final Field GPS</label>
                <input
                  type="text"
                  value={evidenceGps}
                  onChange={(e) => setEvidenceGps(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-mono font-bold text-emerald-950"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Evidence Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setEvidencePhotos(e.target.files)}
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                />
              </div>

              <button
                onClick={handleStepEvidence}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-amber-300" />}
                Complete Evidence Log & Generate Final Report
              </button>
            </div>
          )}

          {/* STEP 7: AUTOMATED FINAL REPORT */}
            {["Final Report", "Final Report Submitted"].includes(currentStep) && (
              <div className="space-y-4 text-xs">
                
                {currentStep === "Final Report Submitted" || ["Awaiting Verification", "Verified", "Closed"].includes(incident?.status || "") ? (
                   <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold flex items-center justify-between mb-4">
                     <div>
                       <span className="block text-sm">✓ Automated Final Report Submitted</span>
                       <span className="block text-[11px] font-medium opacity-90 mt-1">The automated final report has been submitted to the Head Officer for verification.</span>
                     </div>
                     <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                   </div>
                ) : (
                  <>
                    {!fieldOp?.report_generated_content && (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1 mb-4">
                        <span className="font-black text-sm flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-700" /> Automated Final Report
                        </span>
                        <p className="text-[11px] font-medium opacity-90">
                          Gaia will automatically generate the final incident report using the information collected during the incident investigation.
                        </p>
                      </div>
                    )}
                    
                    {fieldOp?.report_generated_content && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 mb-4">
                        <span className="font-black text-sm flex items-center gap-1.5">
                          ✓ Report Generated
                        </span>
                        <p className="text-[11px] font-medium opacity-90">
                          Gaia has successfully generated the automated final incident report.
                        </p>
                        <p className="text-[11px] font-bold mt-2">
                          File: Gaia_Incident_INC-{incident?.reference_id || incident?.id}_Final_Report.pdf
                        </p>
                      </div>
                    )}
                  </>
                )}

                {fieldOp?.report_generated_content && (
                  <div className="flex gap-2 mb-4">
                    <a href={`http://localhost:8000${fieldOp.report_generated_content}`} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-black text-xs text-center shadow-xs">
                      View Report
                    </a>
                    <button onClick={() => handleDownload(`http://localhost:8000${fieldOp.report_generated_content}`, `Gaia_Incident_INC-${incident?.reference_id || incident?.id}_Final_Report.pdf`)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs text-center shadow-xs">
                      Download PDF
                    </button>
                  </div>
                )}

                {currentStep !== "Final Report Submitted" && !["Awaiting Verification", "Verified", "Closed"].includes(incident?.status || "") && (
                  <>
                    {!fieldOp?.report_generated_content ? (
                      <>
                        <div className="space-y-1">
                          <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Officer Signature (Upload Image) *</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                            className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                          />
                        </div>
                        <button
                          onClick={handleGenerateReport}
                          disabled={submitting || !signatureFile}
                          className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs transition-all shadow-xs disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                        >
                          {submitting ? "Generating automated report..." : "Generate & View Report"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                          <p className="text-amber-900 font-bold mb-2">Please review the generated report before submitting it to the Head Officer.</p>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="reviewed" checked={reportReviewed} onChange={(e) => setReportReviewed(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="reviewed" className="text-[11px] font-bold text-amber-950 cursor-pointer">I have reviewed the generated final report PDF.</label>
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateSubmitReport}
                          disabled={submitting || !reportReviewed}
                          className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? "Submitting report to Head Officer..." : "Submit Automated Final Report to Head Officer"}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        {/* RIGHT COLUMN: Mission Summary & Reinforcement Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4 text-xs">
          {/* Mission Summary Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-2">
              Mission Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-emerald-800/70 font-semibold">Guard:</span>
                <span className="font-extrabold text-emerald-950">{fieldOp.guard_name}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-emerald-800/70 font-semibold">Vehicle:</span>
                <span className="font-extrabold text-emerald-950">{fieldOp.vehicle || "Pending"}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-emerald-800/70 font-semibold">Departure:</span>
                <span className="font-bold text-emerald-950">{fieldOp.departure_time || "Pending"}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1.5">
                <span className="text-emerald-800/70 font-semibold">Threat Level:</span>
                <span className="font-bold text-amber-900">{fieldOp.threat_level}</span>
              </div>
            </div>
          </div>

          {/* REQUEST REINFORCEMENT PANEL */}
          {currentStepIdx >= 2 && currentStepIdx <= 7 && (
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-emerald-950 rounded-3xl p-5 space-y-3 shadow-md border border-amber-600">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-950" />
              <div>
                <h4 className="font-black text-xs uppercase">Request Reinforcement</h4>
                <span className="text-[10px] font-bold opacity-90">Need additional officers on site?</span>
              </div>
            </div>

            {fieldOp.reinforcement_requested ? (
              <div className="p-3 rounded-2xl bg-white/80 border border-amber-700/30 text-[11px] font-bold space-y-1">
                <div>Status: <strong className="uppercase text-emerald-950">{fieldOp.reinforcement_status}</strong></div>
                <div>Reason: {fieldOp.reinforcement_reason}</div>
              </div>
            ) : (
              <button
                onClick={() => setShowReinforcementModal(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-950 hover:bg-black text-amber-300 font-black text-xs shadow-xs"
              >
                Request Extra Officers
              </button>
            )}
          </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION 1: FIELD EVIDENCE GALLERY */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-3 shadow-xs text-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-emerald-950/10 pb-3">
          <Camera className="w-4 h-4 text-emerald-700" />
          Field Evidence & Media Gallery
        </h3>

        {incident.images && incident.images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {incident.images.map((img, i) => (
              <div key={i} className="h-28 rounded-2xl overflow-hidden bg-gray-100 border border-emerald-950/10 shadow-2xs">
                <img
                  src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-emerald-800/60 font-medium bg-emerald-50/40 rounded-2xl border border-emerald-950/10">
            No media uploads captured for this field operation yet.
          </div>
        )}
      </div>

      {/* BOTTOM SECTION 2: COMPLETE AUDIT TIMELINE */}
      <IncidentActivityTimeline activities={activities} />

      {/* REINFORCEMENT REQUEST MODAL */}
      {showReinforcementModal && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-amber-300 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-xs">
            <h3 className="text-base font-black text-emerald-950">Request Officer Reinforcement</h3>
            <p className="text-emerald-800 font-medium">Head Officer will receive an urgent dispatch notification.</p>

            <div className="space-y-3">
              <div>
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block mb-1">Reason for Reinforcement *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Large aggressive herd of 5 elephants approaching village school..."
                  value={reinfReason}
                  onChange={(e) => setReinfReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white text-emerald-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block mb-1">Priority</label>
                  <select
                    value={reinfPriority}
                    onChange={(e) => setReinfPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-emerald-950 text-[10px] uppercase block mb-1">Officers Needed</label>
                  <input
                    type="number"
                    min={1}
                    value={reinfCount}
                    onChange={(e) => setReinfCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block mb-1">Additional Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter specific reinforcement remarks..."
                  value={reinfRemarks}
                  onChange={(e) => setReinfRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white text-emerald-950 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/10">
              <button onClick={() => setShowReinforcementModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold">Cancel</button>
              <button
                onClick={handleRequestReinforcement}
                disabled={!reinfReason.trim() || submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                Send Request to Head Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardMissionExecutionPage;
