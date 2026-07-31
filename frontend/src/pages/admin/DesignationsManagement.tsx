import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Award, Edit2, Trash2 } from "lucide-react";

const DesignationsManagement: React.FC = () => {
  const [designations, setDesignations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDesignations();
      setDesignations(data);
    } catch (err) {
      console.error("Failed to load designations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDesig(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingDesig(d);
    setName(d.designation_name);
    setDescription(d.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDesig) {
        await api.updateDesignation(editingDesig.id, {
          designation_name: name,
          description,
        });
      } else {
        await api.createDesignation({
          designation_name: name,
          description,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save designation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this designation?")) return;
    try {
      await api.deleteDesignation(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const filteredDesignations = designations.filter(
    (d) =>
      d.designation_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<any>[] = [
    {
      header: "ID",
      accessorKey: "id",
      sortable: true,
      cell: (d) => <span className="font-bold text-emerald-800">#{d.id}</span>,
    },
    {
      header: "Designation Title",
      accessorKey: "designation_name",
      sortable: true,
      cell: (d) => (
        <span className="font-extrabold text-emerald-950 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600 shrink-0" />
          {d.designation_name}
        </span>
      ),
    },
    {
      header: "Role Description",
      accessorKey: "description",
      cell: (d) => <span className="text-emerald-900/70 font-medium">{d.description || "No description specified"}</span>,
    },
    {
      header: "Actions",
      align: "right",
      cell: (d) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(d)}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs border border-gray-200 transition-all flex items-center gap-1"
            title="Edit Designation"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(d.id)}
            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all flex items-center gap-1"
            title="Delete Designation"
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
        title="Officer Designations"
        subtitle="Manage official officer roles stored directly in PostgreSQL"
        icon={Award}
        badge={`${designations.length} Active Designations`}
      />

      {/* Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search designations..."
        onRefresh={loadData}
        isRefreshing={isLoading}
        addButtonLabel="Add Designation"
        onAddClick={openCreateModal}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredDesignations}
        keyExtractor={(d) => d.id}
        isLoading={isLoading}
        emptyMessage="No designation entries found in database."
      />

      {/* Add / Edit Designation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-950/10 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingDesig ? "Edit Designation" : "Add New Designation"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Designation Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Range Forest Officer"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of duties..."
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-medium focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold shadow-md active:scale-95"
                >
                  {isSubmitting ? "Saving..." : "Save Designation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationsManagement;
