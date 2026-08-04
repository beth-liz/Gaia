import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
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
  "Travelling",
  "Reached Site",
  "Initial Assessment",
  "Action In Progress",
  "Situation Controlled",
  "Evidence Uploaded",
  "Final Report Submitted",
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

  // Reinforcement Request Inputs
  const [showReinforcementModal, setShowReinforcementModal] = useState(false);
  const [reinfReason, setReinfReason] = useState("");
  const [reinfPriority, setReinfPriority] = useState("High");
  const [reinfCount, setReinfCount] = useState(2);
  const [reinfRemarks, setReinfRemarks] = useState("");

  // Final Report Signature Input
  const [signature, setSignature] = useState("");

  const loadMissionData = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      const [incData, opData, actData] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getFieldOp(incidentId),
        api.getIncidentActivities(incidentId),
      ]);
      setIncident(incData);
      setFieldOp(opData);
      setActivities(actData);

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
      const updated = await api.fieldStepEvidence(incidentId, { gps: evidenceGps });
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

  const handleGenerateSubmitReport = async () => {
    try {
      setSubmitting(true);
      await api.generateSubmitFinalReport(incidentId, { signature });
      setSuccessMsg("Automated Final Field Report submitted to Head Officer for approval!");
      await loadMissionData();
    } catch (err: any) {
      alert(err.message || "Failed to submit final report.");
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
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
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
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Acceptance Remarks</label>
                <textarea
                  rows={2}
                  value={acceptRemarks}
                  onChange={(e) => setAcceptRemarks(e.target.value)}
                  placeholder="e.g. Armed patrol team equipped with sirens & firecrackers departing range HQ..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                />
              </div>

              <button
                onClick={handleAcceptMission}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-amber-300" />}
                Accept Field Mission & Start Operation
              </button>
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
          {currentStep === "Final Report Submitted" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold flex items-center justify-between">
                <span>Automated Final Report Generated & Submitted to Head Officer for RFO Approval</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>

              {fieldOp.report_generated_content && (
                <div className="p-4 rounded-2xl bg-emerald-950/5 border border-emerald-950/10 font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-emerald-950 max-h-64 overflow-y-auto">
                  {fieldOp.report_generated_content}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Officer Signature</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter your digital signature..."
                  className="w-full p-2.5 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                />
              </div>

              <button
                onClick={handleGenerateSubmitReport}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-amber-300" />}
                Submit Automated Final Report to Head RFO
              </button>
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
