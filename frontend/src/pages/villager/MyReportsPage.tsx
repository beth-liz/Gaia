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
      header: "Incident ID",
      accessorKey: "reference_id",
      sortable: true,
      cell: (inc) => (
        <span className="font-mono font-extrabold text-emerald-950 text-xs px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-950/10 inline-block">
          {inc.reference_id || `INC-2026-${String(inc.id).padStart(5, "0")}`}
        </span>
      ),
    },
    {
      header: "Animal",
      accessorKey: "animal",
      sortable: true,
      cell: (inc) => (
        <div>
          <span className="font-extrabold text-emerald-950 block">{inc.animal_species_name || inc.animal}</span>
          <span className="text-[11px] text-emerald-800/70 block">{inc.incident_category || "Wildlife Sighting"}</span>
        </div>
      ),
    },
    {
      header: "Severity",
      accessorKey: "severity",
      sortable: true,
      cell: (inc) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getSeverityBadge(inc.severity)}`}>
          {inc.severity}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (inc) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] border ${getStatusBadge(inc.status)}`}>
          {inc.status || "Pending Review"}
        </span>
      ),
    },
    {
      header: "Location",
      accessorKey: "location",
      cell: (inc) => (
        <span className="text-xs text-emerald-950 font-medium truncate max-w-xs block flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
          {inc.location || "Sector Range"}
        </span>
      ),
    },
    {
      header: "Created Date",
      accessorKey: "date_reported",
      sortable: true,
      cell: (inc) => <span className="text-xs font-semibold text-emerald-900">{inc.date_reported || inc.created_at.slice(0, 10)}</span>,
    },
    {
      header: "Actions",
      align: "right",
      cell: (inc) => (
        <button
          onClick={() => setSelectedIncident(inc)}
          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-950/10 font-bold text-xs flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" /> View
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
                <span className="font-mono font-bold text-xs text-emerald-700">{selectedIncident.reference_id}</span>
                <h3 className="text-base font-black text-emerald-950">{selectedIncident.incident_title}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
            </div>

            {selectedIncident.images && selectedIncident.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedIncident.images.map((img, i) => (
                  <img key={i} src={img.startsWith("/static") ? `http://127.0.0.1:8000${img}` : img} alt="Incident Photo" className="w-full h-32 object-cover rounded-xl border border-emerald-950/10" />
                ))}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Animal Species:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.animal_species_name || selectedIncident.animal}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadge(selectedIncident.status)}`}>{selectedIncident.status}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Location:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.location}</span>
              </div>
              <div className="pt-1">
                <span className="text-emerald-800/70 font-semibold block mb-1">Description:</span>
                <p className="text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-950/5">
                  {selectedIncident.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex justify-end">
              <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
