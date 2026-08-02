import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { Incident, User, IncidentActivity } from "@/types";
import { IncidentActivityTimeline } from "@/components/incidents/IncidentActivityTimeline";
import { IncidentProgressTracker } from "@/components/incidents/IncidentProgressTracker";
import {
  AlertCircle,
  MapPin,
  Eye,
  X,
  UserCheck,
  Send,
  Ban,
  CheckCircle2,
  Loader2,
  Calendar,
  User as UserIcon,
} from "lucide-react";

export const RFOIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Incident Modal State
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activities, setActivities] = useState<IncidentActivity[]>([]);
  const [availableGuards, setAvailableGuards] = useState<User[]>([]);
  const [loadingGuards, setLoadingGuards] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form States inside Modal
  const [actionTab, setActionTab] = useState<"dispatch" | "reject" | "info" | "close">("dispatch");
  const [selectedGuardId, setSelectedGuardId] = useState<number | "">("");
  const [priority, setPriority] = useState("High");
  const [estTime, setEstTime] = useState("30 Mins");
  const [dispatchRemarks, setDispatchRemarks] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [closeRemarks, setCloseRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load station incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // When selected incident changes, load guards & activities
  useEffect(() => {
    if (selectedIncident) {
      // Fetch activities timeline
      api
        .getIncidentActivities(selectedIncident.id)
        .then((acts) => setActivities(acts))
        .catch((err) => console.error("Failed to fetch activities", err));

      if (selectedIncident.status !== "Closed" && selectedIncident.status !== "Rejected") {
        setLoadingGuards(true);
        api
          .getAvailableGuards(selectedIncident.station_id || undefined)
          .then((guards) => setAvailableGuards(guards))
          .catch((err) => console.error("Failed to fetch available guards", err))
          .finally(() => setLoadingGuards(false));
      }
    }
  }, [selectedIncident]);

  const refreshSelectedIncident = async (id: number) => {
    try {
      const updated = await api.getIncidentById(id);
      setSelectedIncident(updated);

      const acts = await api.getIncidentActivities(id);
      setActivities(acts);

      await fetchIncidents();
    } catch (err) {
      console.error("Failed to refresh incident", err);
    }
  };

  const handleAssignGuard = async () => {
    if (!selectedIncident || !selectedGuardId) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await api.assignGuardIncident(selectedIncident.id, {
        assigned_to_id: Number(selectedGuardId),
        priority,
        estimated_response_time: estTime,
        remarks: dispatchRemarks,
        notes: dispatchRemarks,
      });
      setActionSuccess("Forest Guard assigned and dispatched successfully!");
      setDispatchRemarks("");
      await refreshSelectedIncident(selectedIncident.id);
    } catch (err: any) {
      alert(err.message || "Failed to assign guard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIncident || !rejectReason.trim()) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await api.rejectIncident(selectedIncident.id, { reason: rejectReason });
      setActionSuccess("Incident has been rejected.");
      setRejectReason("");
      await refreshSelectedIncident(selectedIncident.id);
    } catch (err: any) {
      alert(err.message || "Failed to reject incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedIncident || !infoMessage.trim()) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await api.requestInfoIncident(selectedIncident.id, { message: infoMessage });
      setActionSuccess("Request for additional information sent to reporter.");
      setInfoMessage("");
      await refreshSelectedIncident(selectedIncident.id);
    } catch (err: any) {
      alert(err.message || "Failed to request info");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyClose = async () => {
    if (!selectedIncident) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await api.verifyCloseIncident(selectedIncident.id, { remarks: closeRemarks });
      setActionSuccess("Incident verified and closed.");
      setCloseRemarks("");
      await refreshSelectedIncident(selectedIncident.id);
    } catch (err: any) {
      alert(err.message || "Failed to verify and close incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-red-100 text-red-950 border-red-300 font-extrabold";
      case "High":
        return "bg-amber-100 text-amber-950 border-amber-300 font-extrabold";
      case "Medium":
        return "bg-yellow-100 text-yellow-950 border-yellow-300 font-extrabold";
      default:
        return "bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold";
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Completed":
      case "Closed":
      case "Resolved":
        return "bg-emerald-100 text-emerald-950 border-emerald-300 font-black";
      case "In Progress":
      case "Assigned":
        return "bg-blue-100 text-blue-950 border-blue-300 font-black";
      case "Rejected":
        return "bg-red-100 text-red-950 border-red-300 font-black";
      default:
        return "bg-amber-100 text-amber-950 border-amber-300 font-black";
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (inc.reference_id && inc.reference_id.toLowerCase().includes(q)) ||
      inc.animal.toLowerCase().includes(q) ||
      (inc.location && inc.location.toLowerCase().includes(q)) ||
      (inc.reporter_name && inc.reporter_name.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter || inc.incident_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Incident>[] = [
    {
      header: "Reference ID",
      accessorKey: "reference_id",
      sortable: true,
      cell: (inc) => (
        <span className="font-mono font-extrabold text-emerald-950 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-950/10 inline-block shadow-2xs">
          {inc.reference_id || `INC-2026-${String(inc.id).padStart(5, "0")}`}
        </span>
      ),
    },
    {
      header: "Animal / Species",
      accessorKey: "animal",
      sortable: true,
      cell: (inc) => (
        <div>
          <span className="font-black text-emerald-950 block">{inc.animal_species_name || inc.animal}</span>
          <span className="text-[11px] text-emerald-800/70 font-semibold block">{inc.incident_category}</span>
        </div>
      ),
    },
    {
      header: "Severity",
      accessorKey: "severity",
      sortable: true,
      cell: (inc) => (
        <span className={`px-3 py-1 rounded-full text-xs border ${getSeverityBadge(inc.severity)}`}>
          {inc.severity}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (inc) => (
        <span className={`px-3 py-1 rounded-full text-xs border ${getStatusBadge(inc.status)}`}>
          {inc.status || "Pending Review"}
        </span>
      ),
    },
    {
      header: "Location Range",
      accessorKey: "location",
      cell: (inc) => (
        <div>
          <span className="text-xs text-emerald-950 font-extrabold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            {inc.location || "Sector Range"}
          </span>
          <span className="text-[11px] text-emerald-800/70 block">{inc.station_name || "Muthanga HQ"}</span>
        </div>
      ),
    },
    {
      header: "Reporter",
      accessorKey: "reporter_name",
      cell: (inc) => (
        <div>
          <span className="font-bold text-emerald-950 block text-xs">{inc.reporter_name || "Field User"}</span>
          <span className="text-[11px] text-emerald-800/70 block">{inc.reporter_role || "Villager"}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (inc) => (
        <button
          onClick={() => {
            setSelectedIncident(inc);
            setActionSuccess(null);
          }}
          className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" /> Details & Assign
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Range Station Incident Stream"
        subtitle="Review, verify, and dispatch officers for all wildlife incidents within your assigned monitoring station"
        icon={AlertCircle}
        badge={`${incidents.length} Station Incidents`}
      />

      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reference ID, animal, location, reporter..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { label: "All Statuses", value: "all" },
          { label: "Pending Review", value: "Pending Review" },
          { label: "Assigned", value: "Assigned" },
          { label: "In Progress", value: "In Progress" },
          { label: "Completed", value: "Closed" },
        ]}
        onRefresh={fetchIncidents}
        isRefreshing={loading}
      />

      <DataTable
        columns={columns}
        data={filteredIncidents}
        keyExtractor={(inc) => inc.id}
        isLoading={loading}
        emptyMessage="No incidents reported for your monitoring station."
      />

      {/* EXPANSIVE INCIDENT DETAILS & ASSIGNMENT POP-UP MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-emerald-950/15 shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-900 text-emerald-200 border border-emerald-800">
                  {selectedIncident.reference_id}
                </span>
                <div>
                  <h2 className="text-base font-black leading-snug">{selectedIncident.incident_title || `${selectedIncident.animal} Sighting`}</h2>
                  <span className="text-[11px] text-emerald-300/80 font-medium">
                    Station: {selectedIncident.station_name || "Muthanga HQ"} • Logged: {selectedIncident.date_reported} @ {selectedIncident.time_reported}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Success Alert */}
            {actionSuccess && (
              <div className="bg-emerald-100 border-b border-emerald-300 text-emerald-950 px-6 py-3 text-xs font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                {actionSuccess}
              </div>
            )}

            {/* Modal Progress Tracker */}
            <div className="bg-emerald-50/60 px-6 py-3 border-b border-emerald-950/10 shrink-0">
              <IncidentProgressTracker currentStatus={selectedIncident.status} />
            </div>

            {/* Modal Scrollable Body Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto grow">
              {/* LEFT COLUMN: Incident Information & Visuals (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Meta Badges */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-950/10">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal Species</span>
                    <span className="font-extrabold text-emerald-950 block text-sm">{selectedIncident.animal_species_name || selectedIncident.animal}</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-950/10">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity Level</span>
                    <span className="font-extrabold text-amber-900 block text-sm">{selectedIncident.severity}</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-950/10">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Current Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-xs inline-block mt-0.5 ${getStatusBadge(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                </div>

                {/* Location & Reporter Details */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-950/10 space-y-2.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-emerald-800/70 font-semibold">Location:</span>
                    <span className="font-extrabold">{selectedIncident.location} ({selectedIncident.village_name || "Sector Range"})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-emerald-800/70 font-semibold">Reported By:</span>
                    <span className="font-extrabold">{selectedIncident.reporter_name} ({selectedIncident.reporter_role})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-emerald-800/70 font-semibold">Date & Time:</span>
                    <span className="font-bold">{selectedIncident.date_reported} @ {selectedIncident.time_reported}</span>
                  </div>

                  {selectedIncident.latitude && selectedIncident.longitude && (
                    <div className="pt-2 border-t border-emerald-950/5 font-mono text-[11px] text-emerald-900">
                      <strong>GPS Coordinates:</strong> {selectedIncident.latitude.toFixed(4)}° N, {selectedIncident.longitude.toFixed(4)}° E
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">Incident Description</span>
                  <p className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-950/10 text-emerald-950 font-medium leading-relaxed">
                    {selectedIncident.description || "No description specified by reporter."}
                  </p>
                </div>

                {/* Photos */}
                {selectedIncident.images && selectedIncident.images.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] block">Uploaded Field Photos</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedIncident.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img}
                          alt="Field Photo"
                          className="w-full h-24 object-cover rounded-xl border border-emerald-950/10 shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Vertical Audit Activity Log */}
                <div className="space-y-2 pt-2 border-t border-emerald-950/10">
                  <IncidentActivityTimeline activities={activities} />
                </div>
              </div>

              {/* RIGHT COLUMN: RFO Operational Action & Guard Assignment Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-4 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-950/10 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-2">
                  Officer Action & Dispatch Operations
                </h3>

                {/* Assigned Guard Summary Banner if already assigned */}
                {selectedIncident.assigned_guard_name && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 text-xs text-blue-950">
                    <span className="font-extrabold uppercase text-[10px] text-blue-800 block">Dispatched Guard</span>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      {selectedIncident.assigned_guard_name}
                    </div>
                    {selectedIncident.assignment_notes && (
                      <p className="text-[11px] text-blue-900/80 italic">"{selectedIncident.assignment_notes}"</p>
                    )}
                  </div>
                )}

                {/* Action Mode Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-emerald-950/5 rounded-2xl text-[11px] font-extrabold text-center">
                  <button
                    onClick={() => setActionTab("dispatch")}
                    className={`py-2 rounded-xl transition-all ${actionTab === "dispatch" ? "bg-emerald-900 text-white shadow-xs" : "text-emerald-950 hover:bg-emerald-900/10"}`}
                  >
                    Dispatch
                  </button>
                  <button
                    onClick={() => setActionTab("close")}
                    className={`py-2 rounded-xl transition-all ${actionTab === "close" ? "bg-emerald-900 text-white shadow-xs" : "text-emerald-950 hover:bg-emerald-900/10"}`}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setActionTab("info")}
                    className={`py-2 rounded-xl transition-all ${actionTab === "info" ? "bg-emerald-900 text-white shadow-xs" : "text-emerald-950 hover:bg-emerald-900/10"}`}
                  >
                    Req Info
                  </button>
                  <button
                    onClick={() => setActionTab("reject")}
                    className={`py-2 rounded-xl transition-all ${actionTab === "reject" ? "bg-red-800 text-white shadow-xs" : "text-red-950 hover:bg-red-800/10"}`}
                  >
                    Reject
                  </button>
                </div>

                {/* TAB 1: DISPATCH GUARD */}
                {actionTab === "dispatch" && (
                  <div className="space-y-3.5 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[11px] block">Select Available Forest Guard:</label>
                      {loadingGuards ? (
                        <div className="p-3 text-center text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Fetching available guards...
                        </div>
                      ) : availableGuards.length === 0 ? (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs">
                          No Available Forest Guards in station range currently.
                        </div>
                      ) : (
                        <select
                          value={selectedGuardId}
                          onChange={(e) => setSelectedGuardId(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-950/20 bg-white font-extrabold text-emerald-950 shadow-xs focus:ring-2 focus:ring-emerald-800"
                        >
                          <option value="">-- Choose Forest Guard --</option>
                          {availableGuards.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.full_name} ({g.designation_name || "Forest Guard"}) • {g.work_status}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Mission Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
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
                          className="w-full px-3 py-2 rounded-xl border border-emerald-950/20 bg-white font-bold text-emerald-950"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Dispatch Remarks / Orders</label>
                      <textarea
                        rows={2}
                        value={dispatchRemarks}
                        onChange={(e) => setDispatchRemarks(e.target.value)}
                        placeholder="Enter specific field response instructions for guard..."
                        className="w-full px-3 py-2 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                      />
                    </div>

                    <button
                      onClick={handleAssignGuard}
                      disabled={!selectedGuardId || isSubmitting}
                      className="w-full py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      Confirm & Dispatch Officer
                    </button>
                  </div>
                )}

                {/* TAB 2: VERIFY & CLOSE */}
                {actionTab === "close" && (
                  <div className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Verification Remarks</label>
                      <textarea
                        rows={3}
                        value={closeRemarks}
                        onChange={(e) => setCloseRemarks(e.target.value)}
                        placeholder="Verified range status. No field dispatch required..."
                        className="w-full px-3 py-2 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                      />
                    </div>
                    <button
                      onClick={handleVerifyClose}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Verify & Close Incident
                    </button>
                  </div>
                )}

                {/* TAB 3: REQUEST INFO */}
                {actionTab === "info" && (
                  <div className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="font-extrabold text-emerald-950 text-[10px] uppercase block">Message for Reporter</label>
                      <textarea
                        rows={3}
                        value={infoMessage}
                        onChange={(e) => setInfoMessage(e.target.value)}
                        placeholder="Please provide exact landmark or additional photos..."
                        className="w-full px-3 py-2 rounded-xl border border-emerald-950/20 bg-white font-medium text-emerald-950"
                      />
                    </div>
                    <button
                      onClick={handleRequestInfo}
                      disabled={!infoMessage.trim() || isSubmitting}
                      className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Request for Information
                    </button>
                  </div>
                )}

                {/* TAB 4: REJECT INCIDENT */}
                {actionTab === "reject" && (
                  <div className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="font-extrabold text-red-950 text-[10px] uppercase block">Rejection Reason (Required)</label>
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Duplicate report / Invalid range location..."
                        className="w-full px-3 py-2 rounded-xl border border-red-900/20 bg-white font-medium text-red-950"
                      />
                    </div>
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || isSubmitting}
                      className="w-full py-3 rounded-2xl bg-red-800 hover:bg-red-900 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFOIncidentsPage;
