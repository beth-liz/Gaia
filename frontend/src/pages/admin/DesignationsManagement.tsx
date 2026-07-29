import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Plus, Award, Trash2, Edit, X, Loader2 } from "lucide-react";

const DesignationsManagement: React.FC = () => {
  const [designations, setDesignations] = useState<any[]>([]);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Officer Designations Table</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Manage official officer roles stored directly in PostgreSQL</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          Add New Designation
        </button>
      </div>

      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Designations from Database...</p>
          </div>
        ) : designations.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium">
            No designation entries found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Designation Title</th>
                  <th className="py-3.5 px-6">Role Description</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {designations.map((d) => (
                  <tr key={d.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-800">#{d.id}</td>
                    <td className="py-4 px-6 font-bold text-emerald-950 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      {d.designation_name}
                    </td>
                    <td className="py-4 px-6 text-emerald-900/70">{d.description || "No description specified"}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-900/10"
                        title="Edit Designation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                        title="Delete Designation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
              <h3 className="text-lg font-bold text-emerald-950">
                {editingDesig ? "Edit Designation" : "Add New Designation"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-emerald-950/60 hover:bg-emerald-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Designation Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Range Forest Officer"
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of duties..."
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-emerald-950/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-950 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md"
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
