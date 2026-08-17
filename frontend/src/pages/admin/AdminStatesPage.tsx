import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Globe, Edit2, Trash2, ShieldAlert, CheckCircle } from "lucide-react";

interface StateItem {
  id: number;
  state_name: string;
  district_count: number;
  created_at?: string;
  updated_at?: string;
}

export const AdminStatesPage: React.FC = () => {
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateItem | null>(null);
  const [formStateName, setFormStateName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStates();
      setStates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load states.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleOpenAdd = () => {
    setEditingState(null);
    setFormStateName("");
    setNameError(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: StateItem) => {
    setEditingState(st);
    setFormStateName(st.state_name);
    setNameError(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormStateName(val);
    if (val.trim() && !/^[a-zA-Z\s]+$/.test(val)) {
      setNameError("State name can contain only letters and spaces.");
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStateName.trim()) {
      setError("State name is required.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(formStateName)) {
      setNameError("State name can contain only letters and spaces.");
      setError("State name can contain only letters and spaces.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingState) {
        await api.updateState(editingState.id, { state_name: formStateName.trim() });
        setSuccess(`State "${formStateName}" updated successfully.`);
      } else {
        await api.createState({ state_name: formStateName.trim() });
        setSuccess(`State "${formStateName}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchStates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save state.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (st: StateItem) => {
    if (st.district_count > 0) {
      setError(`Cannot delete ${st.state_name} because ${st.district_count} district(s) exist under it.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete state "${st.state_name}"?`)) return;

    try {
      setError(null);
      await api.deleteState(st.id);
      setSuccess(`State "${st.state_name}" deleted successfully.`);
      fetchStates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete state.");
    }
  };

  const filteredStates = states.filter((s) =>
    s.state_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<StateItem>[] = [
    {
      header: "ID",
      accessorKey: "id",
      sortable: true,
      cell: (st) => <span className="text-emerald-800/70 font-bold">#{st.id}</span>,
    },
    {
      header: "State Name",
      accessorKey: "state_name",
      sortable: true,
      cell: (st) => <span className="font-extrabold text-emerald-950">{st.state_name}</span>,
    },
    {
      header: "Districts Count",
      accessorKey: "district_count",
      sortable: true,
      cell: (st) => (
        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">
          {st.district_count} Districts
        </span>
      ),
    },
    {
      header: "Created At",
      accessorKey: "created_at",
      sortable: true,
      cell: (st) => (
        <span className="text-emerald-800/70 font-medium">
          {st.created_at ? new Date(st.created_at).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (st) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(st)}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-200 flex items-center gap-1"
            title="Edit State"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(st)}
            disabled={st.district_count > 0}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all border flex items-center gap-1 ${
              st.district_count > 0
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            }`}
            title={st.district_count > 0 ? "Cannot delete state with districts" : "Delete State"}
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
        title="States Management"
        subtitle="Administrative State Boundaries & Regional Configurations"
        icon={Globe}
        badge={`${states.length} Total States`}
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

      {/* Standard Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search states..."
        onRefresh={fetchStates}
        isRefreshing={loading}
        addButtonLabel="Add State"
        onAddClick={handleOpenAdd}
      />

      {/* Standardized Table */}
      <DataTable
        columns={columns}
        data={filteredStates}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        emptyMessage="No states found."
      />

      {/* Add / Edit State Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingState ? "Edit State" : "Add New State"}
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
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">State Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerala, Karnataka"
                  value={formStateName}
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
                  {submitting ? "Saving..." : editingState ? "Update State" : "Create State"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatesPage;
