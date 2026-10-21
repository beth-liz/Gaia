import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { Incident } from "@/types";
import {
  FileText,
  Eye,
  MapPin,
  X,
  Calendar,
  AlertTriangle,
  Image as ImageIcon,
  Compass,
} from "lucide-react";
import { AIAssessmentCard } from "@/components/incidents/AIAssessmentCard";
import { getImageUrl } from "@/utils/imageUrl";

export const MyReportsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents({ my_reports_only: true });
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load my reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  // Reset preview when selected incident closes
  useEffect(() => {
    if (!selectedIncident) {
      setSelectedPreviewImage(null);
    }
  }, [selectedIncident]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-100 text-red-900 border-red-300";
      case "High":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      default:
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Completed":
      case "Resolved":
        return "bg-emerald-100 text-emerald-900 font-extrabold border-emerald-300";
      case "In Progress":
      case "Assigned":
        return "bg-blue-100 text-blue-900 font-extrabold border-blue-300";
      case "Rejected":
        return "bg-red-100 text-red-900 font-extrabold border-red-300";
      default:
        return "bg-amber-100 text-amber-900 font-extrabold border-amber-300";
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (inc.reference_id && inc.reference_id.toLowerCase().includes(q)) ||
      (inc.animal && inc.animal.toLowerCase().includes(q)) ||
      (inc.location && inc.location.toLowerCase().includes(q)) ||
      (inc.description && inc.description.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter || inc.incident_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Incident>[] = [
    {
      header: "Incident Number",
      accessorKey: "reference_id",
      sortable: true,
      cell: (inc) => (
        <span className="font-mono font-extrabold text-white text-xs px-2.5 py-1 rounded-xl bg-emerald-900/60 border border-emerald-500/30 inline-block whitespace-nowrap">
          {inc.reference_id || `INC-2026-${String(inc.id).padStart(5, "0")}`}
        </span>
      ),
    },
    {
      header: "Animal / Species",
      accessorKey: "animal",
      sortable: true,
      cell: (inc) => (
        <span className="font-extrabold text-white block whitespace-nowrap">
          {inc.animal_species_name || inc.animal || "Unknown"}
        </span>
      ),
    },
    {
      header: "Incident Type",
      accessorKey: "incident_category",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-emerald-100/90 block whitespace-nowrap">
          {inc.incident_category || "Wildlife Sighting"}
        </span>
      ),
    },
    {
      header: "Incident Date",
      accessorKey: "date_reported",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-white whitespace-nowrap">
          {inc.date_reported || "—"} {inc.time_reported || ""}
        </span>
      ),
    },
    {
      header: "Date Reported",
      accessorKey: "created_at",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-white whitespace-nowrap">
          {inc.created_at ? new Date(inc.created_at).toLocaleString() : (inc.date_reported || "—")}
        </span>
      ),
    },
    {
      header: "Place / Location",
      accessorKey: "location",
      cell: (inc) => (
        <span className="text-xs text-white font-medium truncate max-w-[150px] block flex items-center gap-1 whitespace-nowrap">
          <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
          {inc.location || inc.address || "—"}
        </span>
      ),
    },
    {
      header: "Village",
      accessorKey: "village_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs text-white whitespace-nowrap">{inc.village_name || "—"}</span>
      ),
    },
    {
      header: "District",
      accessorKey: "district_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs text-white whitespace-nowrap">{inc.district_name || "—"}</span>
      ),
    },
    {
      header: "Assigned Station",
      accessorKey: "station_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs font-semibold text-white whitespace-nowrap">
          {inc.station_name || "Not Assigned"}
        </span>
      ),
    },
    {
      header: "Assignment Date",
      accessorKey: "assignment_date",
      cell: (inc) => {
        const assignedAt =
          inc.assigned_officers && inc.assigned_officers.length > 0
            ? inc.assigned_officers[0].assigned_at
            : null;
        return <span className="text-[11px] text-white whitespace-nowrap">{assignedAt || "—"}</span>;
      },
    },
    {
      header: "Incident Status",
      accessorKey: "status",
      sortable: true,
      cell: (inc) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border ${getStatusBadge(inc.status)}`}>
          {inc.status || "Pending Review"}
        </span>
      ),
    },
    {
      header: "Priority / Severity",
      accessorKey: "severity",
      sortable: true,
      cell: (inc) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap font-extrabold border ${getSeverityBadge(inc.severity)}`}>
          {inc.severity || "Medium"}
        </span>
      ),
    },
    {
      header: "Evidence",
      accessorKey: "images",
      cell: (inc) => (
        <span className="text-xs text-white whitespace-nowrap">
          {(inc.images && inc.images.length > 0) || inc.photo_url ? "Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (inc) => (
        <button
          onClick={() => setSelectedIncident(inc)}
          className="p-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black text-xs flex items-center gap-1 whitespace-nowrap shadow-xs transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-950" /> View Details
        </button>
      ),
    },
  ];

  // Helper to extract all images cleanly
  const allImages = selectedIncident
    ? (selectedIncident.images && selectedIncident.images.length > 0
        ? selectedIncident.images
        : selectedIncident.photo_url
        ? [selectedIncident.photo_url]
        : []
      ).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reported Incidents"
        subtitle="Track real-time status and resolutions for all your submitted wildlife incident reports"
        icon={FileText}
        badge={`${incidents.length} Reports Submitted`}
        theme="light"
      />

      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reference ID, animal, location..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { label: "All Statuses", value: "all" },
          { label: "Pending Review", value: "Pending Review" },
          { label: "Assigned", value: "Assigned" },
          { label: "In Progress", value: "In Progress" },
          { label: "Completed", value: "Completed" },
        ]}
        onRefresh={fetchMyReports}
        isRefreshing={loading}
        theme="green"
      />

      <DataTable
        columns={columns}
        data={filteredIncidents}
        keyExtractor={(inc) => inc.id}
        isLoading={loading}
        emptyMessage="You have not submitted any wildlife incident reports yet."
        theme="green"
      />

      {/* Wide Horizontal View Details Modal */}
      {selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-emerald-950/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white shrink-0 flex items-start justify-between gap-4 border-b border-emerald-800">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-white/15 text-emerald-100 border border-white/20">
                    {selectedIncident.reference_id || `INC-2026-${String(selectedIncident.id).padStart(5, "0")}`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedIncident.status)}`}>
                    {selectedIncident.status || "Pending Review"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(selectedIncident.severity)}`}>
                    {selectedIncident.severity || "Medium"} Priority
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight truncate">
                  {selectedIncident.incident_title || `${selectedIncident.animal || "Wildlife"} Sighting`}
                </h3>
                <p className="text-xs text-emerald-200/90 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>Reported on {selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : (selectedIncident.date_reported || "—")}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                aria-label="Close dialog"
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Top Overview Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Animal Detected</span>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {selectedIncident.animal_species_name || selectedIncident.animal || "Unknown"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Category</span>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {selectedIncident.incident_category || "Wildlife Sighting"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Assigned Station</span>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {selectedIncident.station_name || "Not Assigned Yet"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Assigned Officer</span>
                  <p className="text-sm font-black text-emerald-950 truncate">
                    {selectedIncident.assigned_officers && selectedIncident.assigned_officers.length > 0
                      ? selectedIncident.assigned_officers[0].full_name
                      : selectedIncident.assigned_guard_name || "Pending Assignment"}
                  </p>
                </div>
              </div>

              {/* Two-Column Section: Incident Information & Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Core Incident Details */}
                <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 pb-2 border-b border-emerald-950/10 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-emerald-700" /> Incident Information
                  </h4>

                  <dl className="space-y-2.5">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Incident Date & Time:</dt>
                      <dd className="font-bold text-emerald-950 text-right">
                        {selectedIncident.date_reported || "—"} {selectedIncident.time_reported || ""}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Weather Conditions:</dt>
                      <dd className="font-bold text-emerald-950">{selectedIncident.weather || "Not recorded"}</dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Reporter Name:</dt>
                      <dd className="font-bold text-emerald-950">{selectedIncident.reporter_name || "Unknown"}</dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Reporter Role:</dt>
                      <dd className="font-bold text-emerald-950">
                        {selectedIncident.reporter_role === "PUBLIC" || selectedIncident.reporter_role === "VISITOR"
                          ? "Visitor / Public"
                          : selectedIncident.reporter_role || "Villager"}
                      </dd>
                    </div>

                    <div className="py-1">
                      <dt className="text-emerald-800/70 font-semibold mb-1">Impact & Damage Summary:</dt>
                      <dd className="flex flex-wrap gap-1.5 pt-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedIncident.people_injured ? "bg-red-100 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800"}`}>
                          People Injured: {selectedIncident.people_injured ? "Yes" : "No"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedIncident.livestock_damage ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800"}`}>
                          Livestock: {selectedIncident.livestock_damage ? "Yes" : "No"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedIncident.property_damage ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800"}`}>
                          Property: {selectedIncident.property_damage ? "Yes" : "No"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${selectedIncident.crop_damage ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800"}`}>
                          Crops: {selectedIncident.crop_damage ? "Yes" : "No"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Column 2: Geographic & Station Details */}
                <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 pb-2 border-b border-emerald-950/10 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-700" /> Location & Assignment Details
                  </h4>

                  <dl className="space-y-2.5">
                    <div className="flex justify-between items-start py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold shrink-0">Field Location:</dt>
                      <dd className="font-bold text-emerald-950 text-right max-w-[240px] truncate">
                        {selectedIncident.location || selectedIncident.address || "—"}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Village / Area:</dt>
                      <dd className="font-bold text-emerald-950">{selectedIncident.village_name || "—"}</dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">District & State:</dt>
                      <dd className="font-bold text-emerald-950">
                        {selectedIncident.district_name || "—"}{selectedIncident.state_name ? `, ${selectedIncident.state_name}` : ""}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <dt className="text-emerald-800/70 font-semibold">Coordinates (GPS):</dt>
                      <dd className="font-mono text-[11px] text-emerald-950 font-bold">
                        {selectedIncident.latitude !== undefined && selectedIncident.latitude !== null && selectedIncident.longitude !== undefined && selectedIncident.longitude !== null
                          ? `${Number(selectedIncident.latitude).toFixed(4)}°N, ${Number(selectedIncident.longitude).toFixed(4)}°E`
                          : "Not recorded"}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <dt className="text-emerald-800/70 font-semibold">Assignment Date:</dt>
                      <dd className="font-bold text-emerald-950">
                        {selectedIncident.assigned_officers && selectedIncident.assigned_officers.length > 0 && selectedIncident.assigned_officers[0].assigned_at
                          ? new Date(selectedIncident.assigned_officers[0].assigned_at).toLocaleString()
                          : "Pending Assignment"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-950/10 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">Incident Narrative / Description</h4>
                <p className="text-xs font-medium text-emerald-950 leading-relaxed whitespace-pre-wrap bg-white/70 p-3.5 rounded-xl border border-emerald-950/5">
                  {selectedIncident.description || "No specific narrative provided by the reporter."}
                </p>
              </div>

              {/* Photographs & Evidence Gallery */}
              <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-950/10">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    Photographic Evidence ({allImages.length})
                  </h4>
                  {allImages.length > 0 && (
                    <span className="text-[11px] text-emerald-800/70 font-medium">Click to inspect</span>
                  )}
                </div>

                {allImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {allImages.map((img, idx) => {
                      const fullUrl = getImageUrl(img);
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPreviewImage(fullUrl)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-emerald-950/10 bg-slate-100 hover:ring-2 hover:ring-emerald-700 cursor-pointer transition-all group"
                        >
                          <img
                            src={fullUrl}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-emerald-800/60 font-medium bg-emerald-50/40 rounded-xl">
                    No photographic evidence attached to this report.
                  </div>
                )}
              </div>

              {/* Optional AI Wildlife Assessment Card if images exist */}
              {allImages.length > 0 && (
                <div className="space-y-2">
                  <AIAssessmentCard incident={selectedIncident} onUpdate={fetchMyReports} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-emerald-950/10 shrink-0 flex items-center justify-between gap-4">
              <span className="text-[11px] text-emerald-800/70 font-semibold">
                Gaia Wildlife Conservation Response System
              </span>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Lightbox Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              aria-label="Close image preview"
              className="absolute -top-10 right-0 text-white hover:text-amber-300 font-bold text-sm flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Close Preview
            </button>
            <img
              src={selectedPreviewImage}
              alt="Expanded Evidence"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;

