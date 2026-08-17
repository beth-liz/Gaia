import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Building2, Edit2, Trash2, ShieldAlert, CheckCircle } from "lucide-react";

interface DistrictItem {
  id: number;
  district_name: string;
  state_id: number;
  state_name?: string;
  station_count?: number;
  village_count?: number;
  status?: string;
  created_at?: string;
}

interface StateItem {
  id: number;
  state_name: string;
}

export const AdminDistrictsPage: React.FC = () => {
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<DistrictItem | null>(null);
  const [formName, setFormName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formStateId, setFormStateId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [distData, stateData] = await Promise.all([
        api.getDistricts(),
        api.getStates(),
      ]);
      setDistricts(distData);
      setStates(stateData);
    } catch (err: any) {
      setError(err.message || "Failed to load district data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDistrict(null);
    setFormName("");
    setFormStateId(states.length > 0 ? states[0].id : "");
    setNameError(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DistrictItem) => {
    setEditingDistrict(d);
    setFormName(d.district_name);
    setFormStateId(d.state_id);
    setNameError(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (val.trim() && !/^[a-zA-Z\s]+$/.test(val)) {
      setNameError("District name can contain only letters and spaces.");
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("District name is required.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(formName)) {
      setNameError("District name can contain only letters and spaces.");
      setError("District name can contain only letters and spaces.");
      return;
    }
    if (!formStateId) {
      setError("Please select a state.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        district_name: formName.trim(),
        state_id: Number(formStateId),
      };

      if (editingDistrict) {
        await api.updateDistrict(editingDistrict.id, payload);
        setSuccess(`District "${formName}" updated successfully.`);
      } else {
        await api.createDistrict(payload);
        setSuccess(`District "${formName}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save district.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d: DistrictItem) => {
    if ((d.station_count && d.station_count > 0) || (d.village_count && d.village_count > 0)) {
      setError(`Cannot delete ${d.district_name} because it has associated stations or villages.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete district "${d.district_name}"?`)) return;

    try {
      setError(null);
      await api.deleteDistrict(d.id);
      setSuccess(`District "${d.district_name}" deleted successfully.`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete district.");
    }
  };

  const filteredDistricts = districts.filter((d) => {
    const matchesSearch = d.district_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.state_name && d.state_name.toLowerCase().includes(search.toLowerCase()));
    const matchesState = selectedStateFilter === "all" || String(d.state_id) === selectedStateFilter;
    return matchesSearch && matchesState;
  });

  const stateFilterOptions = [
    { label: "All States", value: "all" },
    ...states.map((s) => ({ label: s.state_name, value: String(s.id) })),
  ];

  const columns: Column<DistrictItem>[] = [
    {
      header: "District Name",
      accessorKey: "district_name",
      sortable: true,
      cell: (d) => <span className="font-extrabold text-emerald-950">{d.district_name}</span>,
    },
    {
      header: "State",
      accessorKey: "state_name",
      sortable: true,
      cell: (d) => <span className="text-emerald-800 font-semibold">{d.state_name || "Kerala"}</span>,
    },
    {
      header: "No. of Stations",
      accessorKey: "station_count",
      sortable: true,
      cell: (d) => (
        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">
          {d.station_count || 0} Stations
        </span>
      ),
    },
    {
      header: "No. of Villages",
      accessorKey: "village_count",
      sortable: true,
      cell: (d) => (
        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-[11px]">
          {d.village_count || 0} Villages
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (d) => (
        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-[11px]">
          {d.status || "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (d) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(d)}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-200 flex items-center gap-1"
            title="Edit District"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(d)}
            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-all border border-red-200 flex items-center gap-1"
            title="Delete District"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Districts Management"
        subtitle="Regional Administrative District Boundaries & Stations Setup"
        icon={Building2}
        badge={`${districts.length} Districts`}
      />

      {/* Notifications */}
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

      {/* Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search district name..."
        filterValue={selectedStateFilter}
        onFilterChange={setSelectedStateFilter}
        filterOptions={stateFilterOptions}
        onRefresh={fetchData}
        isRefreshing={loading}
        addButtonLabel="Add District"
        onAddClick={handleOpenAdd}
      />

      {/* Standardized Table */}
      <DataTable
        columns={columns}
        data={filteredDistricts}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyMessage="No districts found."
      />

      {/* Add / Edit District Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingDistrict ? "Edit District" : "Add New District"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">State *</label>
                <select
                  required
                  value={formStateId}
                  onChange={(e) => setFormStateId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">District Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wayanad, Palakkad"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 text-xs rounded-xl border ${
                    nameError ? "border-red-500 ring-2 ring-red-100" : "border-emerald-950/15"
                  } bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold`}
                />
                {nameError && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{nameError}</p>
                )}
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
                  {submitting ? "Saving..." : editingDistrict ? "Update District" : "Create District"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDistrictsPage;
