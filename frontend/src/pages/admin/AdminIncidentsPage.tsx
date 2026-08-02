import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { Incident, AnimalSpecies, MonitoringStation, District } from "@/types";
import { AlertCircle, Search, RefreshCw, Eye, MapPin } from "lucide-react";

export const AdminIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState<number | "all">("all");
  const [districtFilter, setDistrictFilter] = useState<number | "all">("all");
  const [speciesFilter, setSpeciesFilter] = useState<number | "all">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Master options for filters
  const [speciesList, setSpeciesList] = useState<AnimalSpecies[]>([]);
  const [stationsList, setStationsList] = useState<MonitoringStation[]>([]);
  const [districtsList, setDistrictsList] = useState<District[]>([]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchMasterData = async () => {
    try {
      const [specData, stData, distData] = await Promise.all([
        api.getAnimalSpecies(),
        api.getMonitoringStations(),
        api.getDistricts(),
      ]);
      setSpeciesList(specData);
      setStationsList(stData);
      setDistrictsList(distData);
    } catch (err) {
      console.error("Failed to load master filter data", err);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (severityFilter !== "all") params.severity = severityFilter;
      if (stationFilter !== "all") params.station_id = stationFilter;
      if (districtFilter !== "all") params.district_id = districtFilter;
      if (speciesFilter !== "all") params.species_id = speciesFilter;
      if (dateFilter) params.date = dateFilter;
      if (search.trim()) params.search = search.trim();

      const data = await api.getIncidents(params);
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, stationFilter, districtFilter, speciesFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

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

  const columns: Column<Incident>[] = [
    {
      header: "Reference ID",
      accessorKey: "reference_id",
      sortable: true,
      cell: (inc) => (
        <span className="font-mono font-extrabold text-emerald-950 text-xs px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-950/10 inline-block">
          {inc.reference_id || `INC-2026-${String(inc.id).padStart(5, "0")}`}
        </span>
      ),
    },
    {
      header: "Animal Species",
      accessorKey: "animal",
      sortable: true,
      cell: (inc) => (
        <div>
          <span className="font-extrabold text-emerald-950 block">{inc.animal_species_name || inc.animal}</span>
          <span className="text-[11px] text-emerald-800/70 block">{inc.incident_category}</span>
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
      header: "Hierarchy & Location",
      accessorKey: "location",
      cell: (inc) => (
        <div>
          <span className="text-xs text-emerald-950 font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
            {inc.location || "Sector Range"}
          </span>
          <span className="text-[11px] text-emerald-800/70 block">
            {inc.station_name || "Station"} &bull; {inc.district_name || "District"}
          </span>
        </div>
      ),
    },
    {
      header: "Reported By",
      accessorKey: "reporter_name",
      cell: (inc) => (
        <div>
          <span className="font-bold text-emerald-950 block text-xs">{inc.reporter_name || "Field User"}</span>
          <span className="text-[11px] text-emerald-800/70 block">{inc.reporter_role || "Villager"}</span>
        </div>
      ),
    },
    {
      header: "Date",
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
          <Eye className="w-3.5 h-3.5" /> Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Management Master Stream"
        subtitle="System-wide real-time wildlife incident management across all administrative districts and monitoring stations"
        icon={AlertCircle}
        badge={`${incidents.length} Total Incidents`}
      />

      {/* Comprehensive Multi-Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-4 space-y-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700/60" />
            <input
              type="text"
              autoComplete="off"
              placeholder="Search reference ID, animal, location, reporter name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-emerald-950/10 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 text-emerald-950 font-semibold"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-amber-300" /> Search
          </button>
          <button
            type="button"
            onClick={fetchIncidents}
            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-950/10 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-emerald-950/10">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">Animal Species</label>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            >
              <option value="all">All Species</option>
              {speciesList.map((spec) => (
                <option key={spec.id} value={spec.id}>{spec.animal_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">Station</label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            >
              <option value="all">All Stations</option>
              {stationsList.map((st) => (
                <option key={st.id} value={st.id}>{st.station_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">District</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            >
              <option value="all">All Districts</option>
              {districtsList.map((d) => (
                <option key={d.id} value={d.id}>{d.district_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-emerald-800/70 mb-1">Specific Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded-xl border border-emerald-950/10 bg-white font-semibold text-emerald-950 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={incidents}
        keyExtractor={(inc) => inc.id}
        isLoading={loading}
        emptyMessage="No incidents matching current criteria."
      />

      {/* Inspection Modal */}
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
                <span className="text-emerald-800/70 font-semibold">Category & Severity:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.incident_category} ({selectedIncident.severity})</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusBadge(selectedIncident.status)}`}>{selectedIncident.status}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Reporter:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.reporter_name} ({selectedIncident.reporter_role})</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Station & District:</span>
                <span className="font-bold text-emerald-950">{selectedIncident.station_name || "Station"} &bull; {selectedIncident.district_name || "District"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">GPS Coordinates:</span>
                <span className="font-mono font-bold text-emerald-950">
                  {selectedIncident.latitude ? `${selectedIncident.latitude.toFixed(5)}, ${selectedIncident.longitude?.toFixed(5)}` : "N/A"}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-emerald-800/70 font-semibold block mb-1">Description:</span>
                <p className="text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-950/5">
                  {selectedIncident.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex justify-end">
              <button onClick={() => setSelectedIncident(null)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs">Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncidentsPage;
