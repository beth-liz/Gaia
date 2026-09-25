import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { Incident } from "@/types";
import { FileText, Eye, MapPin } from "lucide-react";

export const MyReportsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

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
      inc.animal.toLowerCase().includes(q) ||
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
        <span className="font-mono font-extrabold text-emerald-950 text-xs px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-950/10 inline-block whitespace-nowrap">
          {inc.reference_id || `INC-2026-${String(inc.id).padStart(5, "0")}`}
        </span>
      ),
    },
    {
      header: "Animal / Species",
      accessorKey: "animal",
      sortable: true,
      cell: (inc) => (
        <span className="font-extrabold text-emerald-950 block whitespace-nowrap">{inc.animal_species_name || inc.animal || "Unknown"}</span>
      ),
    },
    {
      header: "Incident Type",
      accessorKey: "incident_category",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-emerald-800/80 block whitespace-nowrap">{inc.incident_category || "Wildlife Sighting"}</span>
      ),
    },
    {
      header: "Incident Date",
      accessorKey: "date_reported",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-emerald-900 whitespace-nowrap">{inc.date_reported || "—"} {inc.time_reported || ""}</span>
      ),
    },
    {
      header: "Date Reported",
      accessorKey: "created_at",
      sortable: true,
      cell: (inc) => (
        <span className="text-[11px] text-emerald-900 whitespace-nowrap">{inc.created_at ? new Date(inc.created_at).toLocaleString() : (inc.date_reported || "—")}</span>
      ),
    },
    {
      header: "Place / Location",
      accessorKey: "location",
      cell: (inc) => (
        <span className="text-xs text-emerald-950 font-medium truncate max-w-[150px] block flex items-center gap-1 whitespace-nowrap">
          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
          {inc.location || inc.address || "—"}
        </span>
      ),
    },
    {
      header: "Village",
      accessorKey: "village_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs text-emerald-950 whitespace-nowrap">{inc.village_name || "—"}</span>
      ),
    },
    {
      header: "District",
      accessorKey: "district_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs text-emerald-950 whitespace-nowrap">{inc.district_name || "—"}</span>
      ),
    },
    {
      header: "Assigned Station",
      accessorKey: "station_name",
      sortable: true,
      cell: (inc) => (
        <span className="text-xs font-semibold text-emerald-900 whitespace-nowrap">{inc.station_name || "Not Assigned"}</span>
      ),
    },
    {
      header: "Assignment Date",
      accessorKey: "assignment_date",
      cell: (inc) => {
        const assignedAt = (inc.assigned_officers && inc.assigned_officers.length > 0) ? inc.assigned_officers[0].assigned_at : null;
        return <span className="text-[11px] text-emerald-900 whitespace-nowrap">{assignedAt || "—"}</span>;
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
        <span className="text-xs text-emerald-900 whitespace-nowrap">
          {((inc.images && inc.images.length > 0) || inc.photo_url) ? "Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (inc) => (
        <button
          onClick={() => setSelectedIncident(inc)}
          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-950/10 font-bold text-xs flex items-center gap-1 whitespace-nowrap"
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reported Incidents"
        subtitle="Track real-time status and resolutions for all your submitted wildlife incident reports"
        icon={FileText}
        badge={`${incidents.length} Reports Submitted`}
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
      />

      <DataTable
        columns={columns}
        data={filteredIncidents}
        keyExtractor={(inc) => inc.id}
        isLoading={loading}
        emptyMessage="You have not submitted any wildlife incident reports yet."
      />

      {/* Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-emerald-700">{selectedIncident.reference_id || `INC-2026-${String(selectedIncident.id).padStart(5, "0")}`}</span>
                <h3 className="text-base font-black text-emerald-950">{selectedIncident.incident_title}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
            </div>

            {(selectedIncident.images && selectedIncident.images.length > 0) || selectedIncident.photo_url ? (
              <div className="grid grid-cols-2 gap-2">
                {(selectedIncident.images && selectedIncident.images.length > 0 ? selectedIncident.images : [selectedIncident.photo_url]).map((img, i) => (
                  img && <img key={i} src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img} alt="Incident Evidence" className="w-full h-32 object-cover rounded-xl border border-emerald-950/10" />
                ))}
              </div>
            ) : null}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Animal / Species:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.animal_species_name || selectedIncident.animal || "Unknown"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Incident Type:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.incident_category || "Wildlife Sighting"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Status & Severity:</span>
                <span className="font-bold text-emerald-950"><span className={`px-2 py-0.5 rounded-full ${getStatusBadge(selectedIncident.status)}`}>{selectedIncident.status}</span> &bull; <span className={`px-2 py-0.5 rounded-full ${getSeverityBadge(selectedIncident.severity)}`}>{selectedIncident.severity}</span></span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Reporter:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.reporter_name || "Unknown"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Reporter Type:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.reporter_role === "PUBLIC" || selectedIncident.reporter_role === "VISITOR" ? "Visitor/Public" : (selectedIncident.reporter_role || "Villager")}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Incident Date:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.date_reported || "—"} {selectedIncident.time_reported || ""}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Report Date:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : (selectedIncident.date_reported || "—")}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Location:</span>
                <span className="font-bold text-emerald-950 text-right max-w-[200px] truncate">{selectedIncident.location || selectedIncident.address || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Village:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.village_name || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">District:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.district_name || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Assigned Station:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.station_name || "Not Assigned"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Assigned Officer:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.assigned_officers && selectedIncident.assigned_officers.length > 0 ? selectedIncident.assigned_officers[0].full_name : (selectedIncident.assigned_guard_name || "Not Assigned")}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Assignment Date:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.assigned_officers && selectedIncident.assigned_officers.length > 0 ? selectedIncident.assigned_officers[0].assigned_at : "—"}</span>
              </div>
              <div className="pt-1">
                <span className="text-emerald-800/70 font-semibold block mb-1">Description:</span>
                <p className="text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-950/5">
                  {selectedIncident.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex justify-end">
              <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
