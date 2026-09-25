import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { Incident } from "@/types";
import { AlertCircle, MapPin, Eye, Navigation } from "lucide-react";

export const RFOIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

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

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "Reported":               return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Pending Review":         return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Ready For Guard Assignment": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Assigned":               return "bg-orange-100 text-orange-800 border-orange-200";
      case "In Progress":            return "bg-orange-200 text-orange-900 border-orange-300";
      case "Returned For Follow-up": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Awaiting Verification":  return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Verified":               return "bg-green-100 text-green-800 border-green-200";
      case "Completed":              return "bg-green-200 text-green-900 border-green-300 font-bold";
      case "Closed":                 return "bg-green-200 text-green-900 border-green-300";
      case "Rejected":               return "bg-red-100 text-red-800 border-red-200";
      default:                       return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityBadge = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200 font-bold";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const s = search.toLowerCase();
    const matchesSearch = !search ||
      inc.reference_id?.toLowerCase().includes(s) ||
      inc.animal?.toLowerCase().includes(s) ||
      inc.location?.toLowerCase().includes(s) ||
      inc.reporter_name?.toLowerCase().includes(s);
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Incident>[] = [
    {
      header: "Reference",
      accessorKey: "reference_id",
      cell: (inc) => (
        <span className="font-mono text-xs font-black text-emerald-950 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-900/10">
          {inc.reference_id}
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
      header: "Assigned Guards",
      accessorKey: "assigned_officers",
      cell: (inc) => {
        const officers = inc.assigned_officers || [];
        if (officers.length === 0) {
          return <span className="text-[11px] text-gray-400 font-semibold italic">Unassigned</span>;
        }
        if (officers.length === 1) {
          return <span className="text-xs font-bold text-emerald-950">{officers[0].full_name}</span>;
        }
        return (
          <div>
            <span className="text-xs font-bold text-emerald-950 block">{officers[0].full_name}</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">+{officers.length - 1} others</span>
          </div>
        );
      }
    },
    {
      header: "Actions",
      align: "right",
      cell: (inc) => {
        const status = inc.status || "Pending Review";
        const isReviewStage = ["Pending Review", "Reported"].includes(status);
        const requiresAction = [...["Pending Review", "Reported", "Ready For Guard Assignment", "Awaiting Verification"]].includes(status);
        const hasGuard = !["Pending Review", "Reported", "Ready For Guard Assignment", "Rejected"].includes(status);

        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate(`/officer/incidents/${inc.id}`)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 ${requiresAction ? 'bg-emerald-900 text-white hover:bg-emerald-950' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Eye className="w-3.5 h-3.5" /> 
              {isReviewStage ? "Details & Review" : 
               status === "Ready For Guard Assignment" ? "Details & Assign" : 
               status === "Awaiting Verification" ? "Details & Verify" : 
               "Details"}
            </button>

            <button
              onClick={() => navigate(`/officer/incidents/${inc.id}/progress`)}
              disabled={!hasGuard}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${hasGuard ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 border border-blue-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'}`}
            >
              <Navigation className="w-3.5 h-3.5" /> View Progress
            </button>
          </div>
        );
      }
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
          { label: "Reported (New)", value: "Reported" },
          { label: "Pending Review", value: "Pending Review" },
          { label: "Ready For Guard Assignment", value: "Ready For Guard Assignment" },
          { label: "Assigned", value: "Assigned" },
          { label: "In Progress", value: "In Progress" },
          { label: "Returned For Follow-up", value: "Returned For Follow-up" },
          { label: "Awaiting Verification", value: "Awaiting Verification" },
          { label: "Verified", value: "Verified" },
          { label: "Completed", value: "Completed" },
          { label: "Closed", value: "Closed" },
          { label: "Rejected", value: "Rejected" },
        ]}
        onRefresh={fetchIncidents}
        isRefreshing={loading}
      />

      <DataTable
        columns={columns}
        data={filteredIncidents}
        keyExtractor={(inc) => inc.id.toString()}
        isLoading={loading}
        emptyMessage="No incidents reported for your monitoring station."
      />
    </div>
  );
};
export default RFOIncidentsPage;
