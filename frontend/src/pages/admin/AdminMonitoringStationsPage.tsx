import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import {
  Radio,
  Edit2,
  Trash2,
  Eye,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Power,
  Users,
  UserCheck,
} from "lucide-react";

interface MonitoringStationItem {
  id: number;
  station_name: string;
  district_id: number;
  head_officer_id?: number;
  head_officer_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  description?: string;
  district_name?: string;
  state_name?: string;
  officer_count?: number;
}

interface DistrictItem {
  id: number;
  district_name: string;
  state_name?: string;
}

export const AdminMonitoringStationsPage: React.FC = () => {
  const [stations, setStations] = useState<MonitoringStationItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<MonitoringStationItem | null>(null);
  const [viewingStation, setViewingStation] = useState<MonitoringStationItem | null>(null);
  const [warningModalMsg, setWarningModalMsg] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDistrictId, setFormDistrictId] = useState<number | "">("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLat, setFormLat] = useState<number | "">("");
  const [formLng, setFormLng] = useState<number | "">("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<string>("Active");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stData, distData] = await Promise.all([
        api.getMonitoringStations(),
        api.getDistricts(),
      ]);
      setStations(stData);
      setDistricts(distData);
    } catch (err: any) {
      setError(err.message || "Failed to load monitoring station data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStation(null);
    setFormName("");
    setFormDistrictId(districts.length > 0 ? districts[0].id : "");
    setFormAddress("");
    setFormPhone("");
    setFormEmail("");
    setFormLat("");
    setFormLng("");
    setFormDesc("");
    setFormStatus("Active");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: MonitoringStationItem) => {
    setEditingStation(st);
    setFormName(st.station_name);
    setFormDistrictId(st.district_id);
    setFormAddress(st.address || "");
    setFormPhone(st.phone || "");
    setFormEmail(st.email || "");
    setFormLat(st.latitude !== undefined && st.latitude !== null ? st.latitude : "");
    setFormLng(st.longitude !== undefined && st.longitude !== null ? st.longitude : "");
    setFormDesc(st.description || "");
    setFormStatus(st.status || "Active");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Station Name is required.");
      return;
    }
    if (!formDistrictId) {
      setError("Please select a District.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        station_name: formName.trim(),
        district_id: Number(formDistrictId),
        address: formAddress.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        latitude: formLat !== "" ? Number(formLat) : undefined,
        longitude: formLng !== "" ? Number(formLng) : undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };

      if (editingStation) {
        await api.updateMonitoringStation(editingStation.id, payload);
        setSuccess(`Monitoring Station "${formName}" updated successfully.`);
      } else {
        await api.createMonitoringStation(payload);
        setSuccess(`Monitoring Station "${formName}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save monitoring station.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (st: MonitoringStationItem) => {
    const newStatus = st.status === "Active" ? "Inactive" : "Active";
    try {
      setError(null);
      await api.updateMonitoringStation(st.id, { status: newStatus });
      setSuccess(`Station "${st.station_name}" status set to ${newStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update station status.");
    }
  };

  const handleDelete = async (st: MonitoringStationItem) => {
    if (st.officer_count && st.officer_count > 0) {
      setWarningModalMsg(
        `Cannot delete "${st.station_name}" because ${st.officer_count} officer(s) are currently assigned to this station.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete station "${st.station_name}"?`)) return;

    try {
      setError(null);
      await api.deleteMonitoringStation(st.id);
      setSuccess(`Station "${st.station_name}" deleted successfully.`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setWarningModalMsg(err.message || "Failed to delete monitoring station.");
    }
  };

  const activeCount = stations.filter((s) => s.status === "Active").length;
  const missingRfoCount = stations.filter((s) => !s.head_officer_id || s.status === "No Head Officer Assigned").length;
  const totalOfficersCount = stations.reduce((acc, curr) => acc + (curr.officer_count || 0), 0);

  const filteredStations = stations.filter((st) => {
    const query = search.toLowerCase();
    const matchesSearch = (
      st.station_name.toLowerCase().includes(query) ||
      (st.district_name && st.district_name.toLowerCase().includes(query)) ||
      (st.head_officer_name && st.head_officer_name.toLowerCase().includes(query)) ||
      (st.phone && st.phone.toLowerCase().includes(query))
    );
    const matchesDistrict = selectedDistrictFilter === "all" || String(st.district_id) === selectedDistrictFilter;
    return matchesSearch && matchesDistrict;
  });

  const districtFilterOptions = [
    { label: "All Districts", value: "all" },
    ...districts.map((d) => ({ label: d.district_name, value: String(d.id) })),
  ];

  const columns: Column<MonitoringStationItem>[] = [
    {
      header: "Station Name",
      accessorKey: "station_name",
      sortable: true,
      cell: (st) => (
        <div>
          <span className="font-extrabold text-emerald-950 block">{st.station_name}</span>
          {st.description && <span className="text-[10px] text-emerald-700/60 font-normal truncate max-w-xs block">{st.description}</span>}
        </div>
      ),
    },
    {
      header: "Head Officer (RFO)",
      cell: (st) => (
        st.head_officer_id ? (
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
            <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{st.head_officer_name || "Head RFO Assigned"}</span>
          </div>
        ) : (
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            No Head Officer Assigned
          </span>
        )
      ),
    },
    {
      header: "District",
      accessorKey: "district_name",
      sortable: true,
      cell: (st) => <span className="font-semibold text-emerald-900">{st.district_name || "Wayanad"}</span>,
    },
    {
      header: "Contact Info",
      accessorKey: "phone",
      cell: (st) => (
        <div className="text-[11px]">
          <div className="font-bold text-emerald-950">{st.phone || "N/A"}</div>
          <div className="text-emerald-700/60">{st.email || "N/A"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (st) => (
        <span
          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
            st.status === "Active"
              ? "bg-emerald-100 text-emerald-900"
              : st.status === "No Head Officer Assigned"
              ? "bg-red-100 text-red-800 border border-red-300 font-black"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {st.status}
        </span>
      ),
    },
    {
      header: "Total Officers",
      accessorKey: "officer_count",
      sortable: true,
      cell: (st) => (
        <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 font-extrabold text-[11px]">
          {st.officer_count || 0} Officers
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (st) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingStation(st)}
            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all"
            title="View Station Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(st)}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
            title="Edit Station"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleDeactivate(st)}
            className={`p-1.5 rounded-xl border transition-all ${
              st.status === "Active"
                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
            title={st.status === "Active" ? "Deactivate Station" : "Activate Station"}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(st)}
            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all"
            title="Delete Station"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Stations Management"
        subtitle="Forest Range Headquarters & Field Operations Monitoring Stations"
        icon={Radio}
        badge={`${stations.length} Stations`}
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold text-lg">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/10 text-emerald-900 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Total Stations</span>
            <span className="text-xl font-black text-emerald-950">{stations.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Active Stations</span>
            <span className="text-xl font-black text-emerald-950">{activeCount}</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3 ${missingRfoCount > 0 ? "bg-red-50 border-red-200" : "bg-white/90 border-emerald-950/10"}`}>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-800/70 block uppercase tracking-wider">Missing Head RFOs</span>
            <span className="text-xl font-black text-red-950">{missingRfoCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Total Officers</span>
            <span className="text-xl font-black text-emerald-950">{totalOfficersCount}</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search station name, RFO, district..."
        filterValue={selectedDistrictFilter}
        onFilterChange={setSelectedDistrictFilter}
        filterOptions={districtFilterOptions}
        onRefresh={fetchData}
        isRefreshing={loading}
        addButtonLabel="Add Station"
        onAddClick={handleOpenAdd}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredStations}
        keyExtractor={(st) => st.id}
        isLoading={loading}
        emptyMessage="No monitoring stations found."
      />

      {/* Add / Edit Station Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingStation ? "Edit Monitoring Station" : "Add Monitoring Station"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Station Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muthanga Range Office"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">District *</label>
                  <select
                    required
                    value={formDistrictId}
                    onChange={(e) => setFormDistrictId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.district_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Official Range Headquarters Address"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 04936-270001"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="station@forest.kerala.gov.in"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="11.6667"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="76.3667"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Status *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Range description or operational notes..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md active:scale-95"
                >
                  {submitting ? "Saving..." : editingStation ? "Update Station" : "Create Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Station Modal */}
      {viewingStation && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-900" />
                <h3 className="text-base font-black text-emerald-950">{viewingStation.station_name}</h3>
              </div>
              <button onClick={() => setViewingStation(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Head Officer RFO:</span>
                <span className="font-extrabold text-emerald-950">{viewingStation.head_officer_name || "No Head Officer Assigned"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">District / State:</span>
                <span className="font-bold text-emerald-950">{viewingStation.district_name || "Wayanad"}, {viewingStation.state_name || "Kerala"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Phone:</span>
                <span className="font-bold text-emerald-950">{viewingStation.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Email:</span>
                <span className="font-bold text-emerald-950">{viewingStation.email || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Address:</span>
                <span className="font-bold text-emerald-950">{viewingStation.address || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Coordinates:</span>
                <span className="font-bold text-emerald-950">{viewingStation.latitude && viewingStation.longitude ? `${viewingStation.latitude}, ${viewingStation.longitude}` : "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Status:</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${viewingStation.status === "Active" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{viewingStation.status}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-emerald-800/70 font-semibold">Total Officers:</span>
                <span className="font-bold text-emerald-950">{viewingStation.officer_count || 0} Officers</span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex justify-end">
              <button onClick={() => setViewingStation(null)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningModalMsg && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-emerald-950">Action Blocked</h3>
            <p className="text-xs text-emerald-900/80 font-medium">{warningModalMsg}</p>
            <div className="pt-2">
              <button
                onClick={() => setWarningModalMsg(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringStationsPage;
