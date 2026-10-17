import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/imageUrl";
import { SafeImage } from "@/components/common/SafeImage";
import type { Incident, FieldOperation } from "@/types";
import {
  FileText,
  User,
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Camera,
  Activity,
  Compass,
  Building2,
  Phone,
  Sparkles,
  Maximize2,
  X,
  Trees
} from "lucide-react";

export const GuardIncidentAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [fieldOp, setFieldOp] = useState<FieldOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; caption: string } | null>(null);

  const incidentId = Number(id);

  const fetchReportData = async () => {
    if (!incidentId) return;
    try {
      setLoading(true);
      setError(null);
      const [inc, op] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getFieldOp(incidentId).catch(() => null),
      ]);
      setIncident(inc);
      setFieldOp(op);
    } catch (err: any) {
      console.error("Failed to load incident report:", err);
      setError(err.message || "Failed to load report details for this incident.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-xs font-bold text-emerald-950">Retrieving official incident investigation report...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4 bg-white/95 rounded-2xl border border-red-200 shadow-sm">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-black text-emerald-950">Incident Report Unavailable</h3>
        <p className="text-xs text-red-700">{error || "Unable to locate incident report record."}</p>
        <button
          onClick={() => navigate("/guard/completed")}
          className="px-4 py-2 rounded-xl bg-emerald-900 text-white text-xs font-bold transition hover:bg-emerald-950"
        >
          Return to Completed Reports
        </button>
      </div>
    );
  }

  // Deduplicate reporter incident photos
  const rawReporterImages: string[] = [];
  if (incident.images && Array.isArray(incident.images)) {
    incident.images.forEach((img) => {
      if (img) rawReporterImages.push(String(img));
    });
  } else if (incident.photo_url) {
    rawReporterImages.push(incident.photo_url);
  }

  const seenImages = new Set<string>();
  const reporterImages = rawReporterImages.filter((img) => {
    const norm = img.replace(/\\/g, "/").toLowerCase();
    if (seenImages.has(norm)) return false;
    seenImages.add(norm);
    return true;
  });

  // Extract investigation evidence photos without duplicating initial reporter images
  const rawEvidencePhotos: string[] = (fieldOp as any)?.evidence_photos || [];
  const evidencePhotos = rawEvidencePhotos.filter((img) => {
    const norm = String(img).replace(/\\/g, "/").toLowerCase();
    if (seenImages.has(norm)) return false;
    seenImages.add(norm);
    return true;
  });

  const isCompleted = incident.status === "Completed" || incident.status === "Closed";
  const hasValidReport = isCompleted && incident.has_report;
  const refId = incident.reference_id || `INC-${incident.id}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-14 text-emerald-950">
      {/* Top Utility Bar: Navigation + Report Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/guard/completed"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-950/15 font-bold text-xs shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          <span>Back to Completed Reports</span>
        </Link>

        {hasValidReport ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => api.openIncidentReportPdf(incident.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition shadow-xs group"
            >
              <FileText className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" />
              <span>View Official PDF</span>
            </button>
            <button
              type="button"
              onClick={() =>
                api.downloadIncidentReportPdf(
                  incident.id,
                  `GAIA_Incident_${incident.reference_id || incident.id}_Report.pdf`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-950/20 text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download PDF</span>
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            Report Pending
          </span>
        )}
      </div>

      {/* CONTINUOUS OFFICIAL REPORT DOCUMENT CONTAINER */}
      <div className="bg-white/95 border border-emerald-950/12 rounded-2xl shadow-sm p-6 sm:p-10 space-y-10">
        
        {/* 1. DOCUMENT HEADER & DEPARTMENT BRANDING */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b-2 border-emerald-950/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Trees className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Government of Kerala • Department of Forests & Wildlife
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight mt-0.5">
                Official Wildlife Incident Investigation & Resolution Report
              </h1>
              <p className="text-xs text-emerald-800/75 mt-0.5">
                Wayanad Wildlife Sanctuary • Human-Wildlife Conflict Response Division
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 shrink-0 bg-emerald-50/60 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-0 border-emerald-950/10">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/70 block">
                Official Reference
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-emerald-950">
                {refId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {incident.status}
              </span>
            </div>
          </div>
        </div>

        {/* 2. SECTION: INCIDENT OVERVIEW */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-950/10">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              1. Incident Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Incident Title</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.incident_title || `${incident.animal} Sighting`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Wildlife Involved</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.animal_species_name || incident.animal}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Incident Category</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.incident_category || "Human-Wildlife Conflict"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Assessed Severity</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  incident.severity === "Critical"
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : incident.severity === "High"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                }`}
              >
                {incident.severity}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Date & Time Reported</span>
              <span className="font-bold text-emerald-950 text-right flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {incident.date_reported ||
                    (incident.created_at
                      ? new Date(incident.created_at).toLocaleDateString()
                      : "Not recorded")}{" "}
                  {incident.time_reported || ""}
                </span>
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Location / Forest Range</span>
              <span className="font-bold text-emerald-950 text-right flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>{incident.location || incident.village_name || "Sanctuary Sector"}</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">GPS Coordinates</span>
              <span className="font-mono font-bold text-emerald-950 text-right">
                {incident.latitude && incident.longitude
                  ? `${Number(incident.latitude).toFixed(4)}° N, ${Number(incident.longitude).toFixed(4)}° E`
                  : "Not recorded"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Station Jurisdiction</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.station_name || "Muthanga Wildlife Station"}
              </span>
            </div>
          </div>
        </section>

        {/* 3. SECTION: ORIGINAL REPORTER INFORMATION */}
        <section className="space-y-4 pt-2 border-t border-emerald-950/10">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-950/10">
            <User className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              2. Original Reporter Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Reporter Name</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.reporter_name || "Community Member"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Reporting Channel / Role</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.reporter_role || "Villager Community"}
              </span>
            </div>
            {incident.contact_number && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Contact Telephone</span>
                <span className="font-mono font-bold text-emerald-950 text-right flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{incident.contact_number}</span>
                </span>
              </div>
            )}
            {incident.village_name && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Village / Settlement</span>
                <span className="font-bold text-emerald-950 text-right">{incident.village_name}</span>
              </div>
            )}
          </div>

          {incident.description && (
            <div className="pt-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800/75 block mb-1">
                Original Community Report Statement
              </span>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-950/10 text-xs text-emerald-950 leading-relaxed italic">
                "{incident.description}"
              </div>
            </div>
          )}
        </section>

        {/* 4. SECTION: INCIDENT INVESTIGATION AND RESPONSE */}
        <section className="space-y-4 pt-2 border-t border-emerald-950/10">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-950/10">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              3. Incident Investigation & Response
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Supervising Range Officer</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.head_officer_name || "Range Forest Officer"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Assigned Investigating Guards</span>
              <span className="font-bold text-emerald-950 text-right">
                {incident.assigned_officers && incident.assigned_officers.length > 0
                  ? incident.assigned_officers.map((o) => o.full_name).join(", ")
                  : incident.assigned_guard_name || fieldOp?.guard_name || "Special Rapid Response Team"}
              </span>
            </div>

            {fieldOp?.departure_time && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Dispatch Departure Time</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.departure_time}</span>
              </div>
            )}
            {fieldOp?.arrival_time && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Arrival at Incident Site</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.arrival_time}</span>
              </div>
            )}
            {fieldOp?.vehicle && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Deployment Patrol Vehicle</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.vehicle}</span>
              </div>
            )}
            {fieldOp?.arrival_weather && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Weather Conditions On-Site</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.arrival_weather}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Wildlife On-Site Status</span>
              <span className="font-bold text-emerald-950 text-right">
                {fieldOp?.animal_present ? "Confirmed Present on Arrival" : "Tracked / Moved to Core Sanctuary"}
              </span>
            </div>
            {fieldOp?.animal_count && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Observed Count</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.animal_count}</span>
              </div>
            )}
            {fieldOp?.animal_behaviour && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Observed Animal Behavior</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.animal_behaviour}</span>
              </div>
            )}
            {fieldOp?.animal_direction && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Retreat / Movement Direction</span>
                <span className="font-bold text-emerald-950 text-right flex items-center gap-1.5 justify-end">
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{fieldOp.animal_direction}</span>
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Tactical Resolution Outcome</span>
              <span className="font-bold text-emerald-950 text-right">
                {fieldOp?.outcome || "Sanctuary Core Forest Driven"}
              </span>
            </div>
            {fieldOp?.remaining_risk && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Residual Threat Risk</span>
                <span className="font-bold text-emerald-950 text-right">{fieldOp.remaining_risk}</span>
              </div>
            )}
          </div>

          {/* Tactical Actions Checklist */}
          {fieldOp?.actions_checklist && fieldOp.actions_checklist.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800/75 block mb-1.5">
                Field Interventions Executed
              </span>
              <div className="flex flex-wrap gap-2">
                {fieldOp.actions_checklist.map((act, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{act}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tactical Remarks */}
          {fieldOp?.action_remarks && (
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-950/10 text-xs text-emerald-950 leading-relaxed">
              <span className="font-black text-emerald-900 block mb-1">
                Tactical Response Officer Notes:
              </span>
              {fieldOp.action_remarks}
            </div>
          )}

          {/* Damage & Impact Matrix */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800/75 block mb-2">
              Impact & Damage Assessment Matrix
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  incident.people_injured || fieldOp?.human_injury
                    ? "bg-rose-50 border-rose-200 text-rose-950"
                    : "bg-emerald-50/40 border-emerald-950/10 text-emerald-950"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase block opacity-75">Human Injury</span>
                <span className="font-black text-sm">
                  {incident.people_injured || fieldOp?.human_injury ? "Reported" : "None"}
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  incident.livestock_damage || fieldOp?.livestock_damage
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-emerald-50/40 border-emerald-950/10 text-emerald-950"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase block opacity-75">Livestock Damage</span>
                <span className="font-black text-sm">
                  {incident.livestock_damage || fieldOp?.livestock_damage ? "Reported" : "None"}
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  incident.crop_damage
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-emerald-50/40 border-emerald-950/10 text-emerald-950"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase block opacity-75">Crop Damage</span>
                <span className="font-black text-sm">{incident.crop_damage ? "Reported" : "None"}</span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  incident.property_damage || fieldOp?.property_damage
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-emerald-50/40 border-emerald-950/10 text-emerald-950"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase block opacity-75">Property Damage</span>
                <span className="font-black text-sm">
                  {incident.property_damage || fieldOp?.property_damage ? "Reported" : "None"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: EVIDENCE AND WILDLIFE ANALYSIS */}
        <section className="space-y-4 pt-2 border-t border-emerald-950/10">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                4. Evidence & Wildlife Analysis
              </h2>
            </div>
            {(reporterImages.length > 0 || evidencePhotos.length > 0) && (
              <span className="text-[11px] font-bold text-emerald-800">
                {reporterImages.length + evidencePhotos.length} Total Photographic Exhibit{reporterImages.length + evidencePhotos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* AI Analysis Summary Pill if AI results exist */}
          {incident.ai_results && incident.ai_results.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-3">
              <div className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  AI Computer Vision Detection Summary (MegaDetector + SpeciesNet)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {incident.ai_results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/90 border border-purple-200 text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-purple-700">Classification</span>
                      {res.confidence !== undefined && res.confidence >= 0 && (
                        <span className="font-mono font-bold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
                          {(res.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                    <p className="font-black text-purple-950 text-sm">
                      {res.normalized_species || res.animal_name || incident.animal}
                    </p>
                    {res.count && (
                      <p className="text-[11px] text-purple-900/80">
                        Individuals counted: <span className="font-bold">{res.count}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Image Gallery: Initial Sighting Photographs */}
          {reporterImages.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800/75 block">
                Initial Sighting & Community Evidence Photographs
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reporterImages.map((img, idx) => {
                  const resolvedUrl = getImageUrl(img);
                  // Check if matching AI result exists for this image
                  const matchingAi = incident.ai_results?.find(
                    (r: any) => r.image_path && (img.includes(r.image_path) || r.image_path.includes(img))
                  );

                  return (
                    <div
                      key={idx}
                      className="group rounded-xl border border-emerald-950/15 overflow-hidden bg-slate-900/95 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                    >
                      <div
                        className="relative w-full h-56 bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() =>
                          setPreviewImage({
                            src: resolvedUrl,
                            caption: `Initial Sighting Photo #${idx + 1} • ${incident.animal}`,
                          })
                        }
                      >
                        <SafeImage
                          src={img}
                          alt={`Initial Sighting Photo ${idx + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition backdrop-blur-xs opacity-0 group-hover:opacity-100"
                          title="Click to enlarge"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 bg-white border-t border-emerald-950/10 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-emerald-950 text-[11px]">
                            Initial Sighting Photo {idx + 1}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Original Exhibit
                          </span>
                        </div>
                        {matchingAi && (
                          <div className="pt-1 text-[11px] text-purple-900 font-semibold border-t border-purple-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>
                              AI: {matchingAi.normalized_species} ({((matchingAi.confidence || 0) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence Image Gallery: Field Investigation Photographs */}
          {evidencePhotos.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800/75 block">
                Field Investigation & Response Exhibits
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {evidencePhotos.map((img, idx) => {
                  const resolvedUrl = getImageUrl(img);
                  return (
                    <div
                      key={idx}
                      className="group rounded-xl border border-emerald-950/15 overflow-hidden bg-slate-900/95 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                    >
                      <div
                        className="relative w-full h-56 bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() =>
                          setPreviewImage({
                            src: resolvedUrl,
                            caption: `Field Investigation Exhibit #${idx + 1}`,
                          })
                        }
                      >
                        <SafeImage
                          src={img}
                          alt={`Field Exhibit ${idx + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition backdrop-blur-xs opacity-0 group-hover:opacity-100"
                          title="Click to enlarge"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 bg-white border-t border-emerald-950/10 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-emerald-950 text-[11px]">
                            Field Exhibit {idx + 1}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            On-Site Finding
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Photographic Evidence State */}
          {reporterImages.length === 0 && evidencePhotos.length === 0 && (
            <div className="p-6 rounded-xl bg-emerald-50/30 border border-emerald-950/10 text-center space-y-1">
              <Camera className="w-6 h-6 text-emerald-700/60 mx-auto" />
              <p className="text-xs font-bold text-emerald-950">No Photographic Evidence Uploaded</p>
              <p className="text-[11px] text-emerald-800/70">
                This incident was resolved through tactical ground patrol and community testimony without photographic attachments.
              </p>
            </div>
          )}
        </section>

        {/* 6. SECTION: FINAL REPORT DETAILS & CLOSURE */}
        <section className="space-y-4 pt-2 border-t border-emerald-950/10">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-950/10">
            <Activity className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900">
              5. Final Report Details & Closure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
            {incident.verification_time && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Head Officer Endorsement Timestamp</span>
                <span className="font-bold text-emerald-950 text-right">
                  {new Date(incident.verification_time).toLocaleString()}
                </span>
              </div>
            )}
            {incident.closed_at && (
              <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
                <span className="text-emerald-800/70 font-semibold">Official Closure Timestamp</span>
                <span className="font-bold text-emerald-950 text-right">
                  {new Date(incident.closed_at).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Resolution Finality</span>
              <span className="font-bold text-emerald-950 text-right">Confirmed Resolved & Closed</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-emerald-950/5">
              <span className="text-emerald-800/70 font-semibold">Reporting Archive Integrity</span>
              <span className="font-bold text-emerald-950 text-right">Immutable Official Record</span>
            </div>
          </div>

          {/* Head Officer Verification Notes */}
          {incident.verification_notes && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
              <span className="font-black text-emerald-900 block mb-1">
                Head Officer Review & Endorsement Remarks:
              </span>
              {incident.verification_notes}
            </div>
          )}

          {/* Final Incident Closure Remarks */}
          {incident.final_closure_remarks && (
            <div className="p-4 rounded-xl bg-white border border-emerald-950/12 text-xs text-emerald-950 leading-relaxed shadow-2xs">
              <span className="font-black text-emerald-900 block mb-1">
                Final Investigation & Closure Summary:
              </span>
              {incident.final_closure_remarks}
            </div>
          )}
        </section>

        {/* DOCUMENT FOOTER NOTE */}
        <div className="pt-4 border-t-2 border-emerald-950/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-800/70 gap-2">
          <span>Gaia Wildlife Management Platform • Kerala Forest Department</span>
          <span className="font-mono text-[10px]">
            Incident Ref: {refId} • Generated for Official Department Records
          </span>
        </div>
      </div>

      {/* Lightbox Modal for Enlarge Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 text-white">
              <span className="text-xs font-bold truncate">{previewImage.caption}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-950 min-h-[300px]">
              <img
                src={previewImage.src}
                alt={previewImage.caption}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardIncidentAuditPage;
