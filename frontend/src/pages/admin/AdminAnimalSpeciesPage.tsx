import React, { useEffect, useState, useRef } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import type { AnimalSpecies } from "@/types";
import {
  Trees,
  Edit2,
  Trash2,
  Eye,
  Power,
  ShieldAlert,
  CheckCircle,
  Upload,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export const AdminAnimalSpeciesPage: React.FC = () => {
  const [speciesList, setSpeciesList] = useState<AnimalSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<AnimalSpecies | null>(null);
  const [viewingSpecies, setViewingSpecies] = useState<AnimalSpecies | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Form State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [animalName, setAnimalName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [category, setCategory] = useState("Mammal");
  const [dangerLevel, setDangerLevel] = useState("Medium");
  const [conservationStatus, setConservationStatus] = useState("Least Concern");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSpecies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAnimalSpecies();
      setSpeciesList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load animal species data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  const openAddModal = () => {
    setEditingSpecies(null);
    setAnimalName("");
    setScientificName("");
    setCategory("Mammal");
    setDangerLevel("Medium");
    setConservationStatus("Least Concern");
    setDescription("");
    setIsActive(true);
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (spec: AnimalSpecies) => {
    setEditingSpecies(spec);
    setAnimalName(spec.animal_name);
    setScientificName(spec.scientific_name || "");
    setCategory(spec.category || "Mammal");
    setDangerLevel(spec.danger_level || "Medium");
    setConservationStatus(spec.conservation_status || "Least Concern");
    setDescription(spec.description || "");
    setIsActive(spec.is_active);
    setSelectedFile(null);
    setImagePreview(spec.image ? (spec.image.startsWith("/static") ? `http://127.0.0.1:8000${spec.image}` : spec.image) : null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalName.trim()) {
      setError("Animal Name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        animal_name: animalName.trim(),
        scientific_name: scientificName.trim() || undefined,
        category,
        danger_level: dangerLevel,
        conservation_status: conservationStatus,
        description: description.trim() || undefined,
        is_active: isActive,
      };

      let savedSpecies: AnimalSpecies;
      if (editingSpecies) {
        savedSpecies = await api.updateAnimalSpecies(editingSpecies.id, payload);
        setSuccess(`Species "${animalName}" updated successfully.`);
      } else {
        savedSpecies = await api.createAnimalSpecies(payload);
        setSuccess(`Species "${animalName}" created successfully.`);
      }

      // Handle image upload if selected
      if (selectedFile && savedSpecies) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        await api.uploadSpeciesImage(savedSpecies.id, formData);
      }

      setIsModalOpen(false);
      fetchSpecies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save animal species.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (spec: AnimalSpecies) => {
    try {
      setError(null);
      await api.updateAnimalSpecies(spec.id, { is_active: !spec.is_active });
      setSuccess(`Species "${spec.animal_name}" set to ${!spec.is_active ? "Active" : "Inactive"}.`);
      fetchSpecies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update species status.");
    }
  };

  const handleDelete = async (spec: AnimalSpecies) => {
    if (!window.confirm(`Are you sure you want to delete species "${spec.animal_name}"?`)) return;
    try {
      setError(null);
      await api.deleteAnimalSpecies(spec.id);
      setSuccess(`Species "${spec.animal_name}" deleted successfully.`);
      fetchSpecies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setWarningMsg(err.message || "Cannot delete this species.");
    }
  };

  const filteredSpecies = speciesList.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch =
      s.animal_name.toLowerCase().includes(query) ||
      (s.scientific_name && s.scientific_name.toLowerCase().includes(query)) ||
      (s.category && s.category.toLowerCase().includes(query));
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryFilterOptions = [
    { label: "All Categories", value: "all" },
    { label: "Mammal", value: "Mammal" },
    { label: "Bird", value: "Bird" },
    { label: "Reptile", value: "Reptile" },
    { label: "Amphibian", value: "Amphibian" },
  ];

  const getDangerBadge = (lvl: string) => {
    switch (lvl) {
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

  const getConservationBadge = (st: string) => {
    switch (st) {
      case "Critically Endangered":
      case "Endangered":
        return "bg-red-50 text-red-800 border-red-200 font-extrabold";
      case "Vulnerable":
      case "Near Threatened":
        return "bg-amber-50 text-amber-800 border-amber-200 font-bold";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
    }
  };

  const columns: Column<AnimalSpecies>[] = [
    {
      header: "Image",
      cell: (spec) => {
        const imgUrl = spec.image ? (spec.image.startsWith("/static") ? `http://127.0.0.1:8000${spec.image}` : spec.image) : null;
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-900/10 text-emerald-900 font-extrabold text-xs flex items-center justify-center overflow-hidden border border-emerald-950/10 shrink-0">
            {imgUrl ? (
              <img src={imgUrl} alt={spec.animal_name} className="w-full h-full object-cover" />
            ) : (
              spec.animal_name.charAt(0).toUpperCase()
            )}
          </div>
        );
      },
    },
    {
      header: "Animal Name",
      accessorKey: "animal_name",
      sortable: true,
      cell: (spec) => (
        <div>
          <span className="font-extrabold text-emerald-950 block">{spec.animal_name}</span>
          {spec.scientific_name && <span className="text-[11px] text-emerald-800/70 italic block">{spec.scientific_name}</span>}
        </div>
      ),
    },
    {
      header: "Scientific Name",
      accessorKey: "scientific_name",
      sortable: true,
      cell: (spec) => <span className="text-emerald-900 italic font-medium">{spec.scientific_name || "N/A"}</span>,
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (spec) => <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-[11px]">{spec.category}</span>,
    },
    {
      header: "Danger Level",
      accessorKey: "danger_level",
      sortable: true,
      cell: (spec) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getDangerBadge(spec.danger_level)}`}>
          {spec.danger_level}
        </span>
      ),
    },
    {
      header: "Conservation",
      accessorKey: "conservation_status",
      sortable: true,
      cell: (spec) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] border ${getConservationBadge(spec.conservation_status)}`}>
          {spec.conservation_status}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      sortable: true,
      cell: (spec) => (
        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${spec.is_active ? "bg-emerald-100 text-emerald-900" : "bg-gray-100 text-gray-600"}`}>
          {spec.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (spec) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingSpecies(spec)}
            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openEditModal(spec)}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
            title="Edit Species"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleActive(spec)}
            className={`p-1.5 rounded-xl border transition-all ${
              spec.is_active ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
            title={spec.is_active ? "Deactivate Species" : "Activate Species"}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(spec)}
            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all"
            title="Delete Species"
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
        title="Animal Species Management"
        subtitle="Manage wildlife species available in the Gaia system for incident reporting and AI detection"
        icon={Trees}
        badge={`${speciesList.length} Registered Species`}
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
        searchPlaceholder="Search animal name, scientific name, category..."
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterOptions={categoryFilterOptions}
        onRefresh={fetchSpecies}
        isRefreshing={loading}
        addButtonLabel="Add Species"
        onAddClick={openAddModal}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredSpecies}
        keyExtractor={(s) => s.id}
        isLoading={loading}
        emptyMessage="No wildlife species found in master database."
      />

      {/* Add / Edit Species Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingSpecies ? "Edit Animal Species" : "Add New Animal Species"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Animal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elephant, Tiger"
                    value={animalName}
                    onChange={(e) => setAnimalName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Scientific Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Elephas maximus"
                    value={scientificName}
                    onChange={(e) => setScientificName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold italic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  >
                    <option value="Mammal">Mammal</option>
                    <option value="Bird">Bird</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Amphibian">Amphibian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Danger Level *</label>
                  <select
                    value={dangerLevel}
                    onChange={(e) => setDangerLevel(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Conservation *</label>
                  <select
                    value={conservationStatus}
                    onChange={(e) => setConservationStatus(e.target.value)}
                    className="w-full px-2.5 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                  >
                    <option value="Least Concern">Least Concern</option>
                    <option value="Near Threatened">Near Threatened</option>
                    <option value="Vulnerable">Vulnerable</option>
                    <option value="Endangered">Endangered</option>
                    <option value="Critically Endangered">Critically Endangered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Species Image</label>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-emerald-950/10 overflow-hidden shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-950/10 text-xs font-bold flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-emerald-700" />
                    {selectedFile ? selectedFile.name : "Choose Image File"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Field description, behaviors, conflict guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Status *</label>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-emerald-950 font-semibold"
                >
                  <option value="active">Active (Available for reporting & detection)</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? "Saving..." : editingSpecies ? "Update Species" : "Create Species"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Species Modal */}
      {viewingSpecies && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-emerald-950/10 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-black text-emerald-950">{viewingSpecies.animal_name}</h3>
              <button onClick={() => setViewingSpecies(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>

            {viewingSpecies.image && (
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-gray-100 border border-emerald-950/10">
                <img
                  src={viewingSpecies.image.startsWith("/static") ? `http://127.0.0.1:8000${viewingSpecies.image}` : viewingSpecies.image}
                  alt={viewingSpecies.animal_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Scientific Name:</span>
                <span className="font-bold italic text-emerald-950">{viewingSpecies.scientific_name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Category:</span>
                <span className="font-bold text-emerald-950">{viewingSpecies.category}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Danger Level:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getDangerBadge(viewingSpecies.danger_level)}`}>{viewingSpecies.danger_level}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-emerald-800/70 font-semibold">Conservation Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${getConservationBadge(viewingSpecies.conservation_status)}`}>{viewingSpecies.conservation_status}</span>
              </div>
              <div className="pt-1">
                <span className="text-emerald-800/70 font-semibold block mb-1">Description:</span>
                <p className="text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                  {viewingSpecies.description || "No specific description available."}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex justify-end">
              <button onClick={() => setViewingSpecies(null)} className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningMsg && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-emerald-950">Deletion Protected</h3>
            <p className="text-xs text-emerald-900/80 font-medium">{warningMsg}</p>
            <div className="pt-2">
              <button onClick={() => setWarningMsg(null)} className="w-full py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs">Understood</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnimalSpeciesPage;
