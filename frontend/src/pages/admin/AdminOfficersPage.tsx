import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Plus, Search, Edit, Trash2, Power, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const AdminOfficersPage: React.FC = () => {
  const [officers, setOfficers] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<any | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designationId, setDesignationId] = useState<number | "">("");
  const [station, setStation] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [offData, desigData] = await Promise.all([
        api.getOfficers(),
        api.getDesignations(),
      ]);
      setOfficers(offData);
      setDesignations(desigData);
      if (desigData.length > 0 && !designationId) {
        setDesignationId(desigData[0].id);
      }
    } catch (err) {
      console.error("Failed to load officers data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingOfficer(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setStation("");
    setTempPassword("OfficerPass123");
    if (designations.length > 0) setDesignationId(designations[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (officer: any) => {
    setEditingOfficer(officer);
    setFullName(officer.full_name);
    setEmail(officer.email);
    setPhone(officer.phone || "");
    setStation(officer.station || "");
    setDesignationId(officer.designation_id || (designations[0]?.id ?? ""));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designationId) {
      alert("Please select a designation");
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingOfficer) {
        await api.updateOfficer(editingOfficer.id, {
          full_name: fullName,
          email,
          phone,
          station,
          designation_id: Number(designationId),
        });
      } else {
        await api.createOfficer({
          full_name: fullName,
          email,
          phone,
          station,
          designation_id: Number(designationId),
          temporary_password: tempPassword,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Officer save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.toggleOfficerStatus(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Status toggle failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this officer record?")) return;
    try {
      await api.deleteOfficer(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const filteredOfficers = officers.filter(
    (o) =>
      o.full_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      (o.designation_name && o.designation_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.station && o.station.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Officer Roster & Management</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Deploy Range Forest Officers and Forest Guards from PostgreSQL</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold shadow-md transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          Deploy New Officer
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-emerald-700 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search officers by name, station, designation..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 shadow-xs"
        />
      </div>

      {/* Officers Table */}
      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Officer Roster...</p>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium">
            No officer records found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">Officer Name</th>
                  <th className="py-3.5 px-6">Designation</th>
                  <th className="py-3.5 px-6">Station / Sector</th>
                  <th className="py-3.5 px-6">Duty Status</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {filteredOfficers.map((o) => (
                  <tr key={o.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-950">
                      <div>{o.full_name}</div>
                      <div className="text-[11px] font-normal text-emerald-800/70">{o.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        o.role === "Range Forest Officer" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}>
                        {o.designation_name || o.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">{o.station || "Central HQ"}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        o.work_status === "Available" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                      }`}>
                        {o.work_status || "Available"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {o.is_active ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(o)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-900/10 transition-all"
                        title="Edit Officer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(o.id)}
                        className={`p-2 rounded-xl border transition-all ${
                          o.is_active ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title={o.is_active ? "Deactivate Officer" : "Reactivate Officer"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all"
                        title="Delete Officer"
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

      {/* Deploy / Edit Officer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10">
              <h3 className="text-lg font-bold text-emerald-950">
                {editingOfficer ? "Edit Officer Details" : "Deploy New Officer"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-xl text-emerald-950/60 hover:bg-emerald-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@gaia.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Designation (From DB)</label>
                  <select
                    value={designationId}
                    onChange={(e) => setDesignationId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.designation_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Station / Range</label>
                  <input
                    type="text"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    placeholder="Station Location"
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              {!editingOfficer && (
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-900/15 text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              )}

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
                  {isSubmitting ? "Saving..." : editingOfficer ? "Update Officer" : "Deploy Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOfficersPage;
