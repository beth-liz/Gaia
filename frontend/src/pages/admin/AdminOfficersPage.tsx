import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { OfficerTransferModal } from "@/components/officers/OfficerTransferModal";
import { ShieldAlert, Edit2, Trash2, Power, CheckCircle2, AlertCircle, ArrowRightLeft, AlertTriangle, ShieldCheck } from "lucide-react";

export const AdminOfficersPage: React.FC = () => {
  const [officers, setOfficers] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<any | null>(null);
  const [transferringOfficer, setTransferringOfficer] = useState<any | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designationId, setDesignationId] = useState<number | "">("");
  const [stationId, setStationId] = useState<number | "">("");
  const [tempPassword, setTempPassword] = useState("");
  const [status, setStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [offData, desigData, stData] = await Promise.all([
        api.getOfficers(),
        api.getDesignations(),
        api.getMonitoringStations(),
      ]);
      setOfficers(offData);
      setDesignations(desigData);
      setStations(stData);

      if (desigData.length > 0 && !designationId) {
        setDesignationId(desigData[0].id);
      }
      if (stData.length > 0 && !stationId) {
        setStationId(stData[0].id);
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
    setTempPassword("OfficerPass123");
    setStatus("Active");
    if (designations.length > 0) setDesignationId(designations[0].id);
    if (stations.length > 0) setStationId(stations[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (officer: any) => {
    setEditingOfficer(officer);
    setFullName(officer.full_name);
    setEmail(officer.email);
    setPhone(officer.phone || "");
    setDesignationId(officer.designation_id || (designations[0]?.id ?? ""));
    setStatus(officer.is_active ? "Active" : "Inactive");
    setIsModalOpen(true);
  };

  const selectedDesigObj = designations.find((d) => d.id === Number(designationId));
  const selectedStationObj = stations.find((s) => s.id === Number(stationId));

  const isGuardRoleSelected = selectedDesigObj?.designation_name === "Forest Guard" || selectedDesigObj?.role === "Forest Guard";
  const stationLacksRFO = selectedStationObj && (!selectedStationObj.head_officer_id && selectedStationObj.status === "No Head Officer Assigned");

  const isGuardCreationBlocked = !editingOfficer && isGuardRoleSelected && stationLacksRFO;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designationId) {
      alert("Please select a designation");
      return;
    }
    if (!editingOfficer && !stationId) {
      alert("Please select a monitoring station");
      return;
    }
    if (isGuardCreationBlocked) {
      alert("This station currently has no assigned Range Forest Officer. Please assign a head officer before adding Forest Guards.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingOfficer) {
        await api.updateOfficer(editingOfficer.id, {
          full_name: fullName,
          email,
          phone,
          designation_id: Number(designationId),
          is_active: status === "Active",
        });
        setSuccess(`Officer ${fullName} updated successfully.`);
      } else {
        await api.createOfficer({
          full_name: fullName,
          email,
          phone,
          station_id: Number(stationId),
          designation_id: Number(designationId),
          temporary_password: tempPassword,
          status,
        });
        setSuccess(`Officer ${fullName} deployed successfully.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Officer operation failed.");
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

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      o.full_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      (o.designation_name && o.designation_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.station_name && o.station_name.toLowerCase().includes(search.toLowerCase())) ||
      (o.district_name && o.district_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || o.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filterOptions = [
    { label: "All Roles", value: "all" },
    { label: "Range Forest Officer", value: "Range Forest Officer" },
    { label: "Forest Guard", value: "Forest Guard" },
  ];

  const columns: Column<any>[] = [
    {
      header: "Officer Name",
      accessorKey: "full_name",
      sortable: true,
      cell: (o) => (
        <div>
          <span className="font-extrabold text-emerald-950 block">{o.full_name}</span>
          <span className="text-[11px] font-normal text-emerald-800/70">{o.email}</span>
        </div>
      ),
    },
    {
      header: "Designation",
      accessorKey: "role",
      sortable: true,
      cell: (o) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
            o.role === "Range Forest Officer"
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
          }`}
        >
          {o.designation_name || o.role}
        </span>
      ),
    },
    {
      header: "Monitoring Station",
      accessorKey: "station_name",
      sortable: true,
      cell: (o) => <span className="font-semibold text-emerald-950">{o.station_name || o.station || "Muthanga Range HQ"}</span>,
    },
    {
      header: "Duty Work Status",
      accessorKey: "work_status",
      sortable: true,
      cell: (o) => {
        const ws = o.work_status || "Available";
        const getBadgeStyle = () => {
          switch (ws) {
            case "Available":
              return "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
            case "Busy":
              return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
            case "Transferred":
              return "bg-purple-100 text-purple-900 border-purple-300 font-extrabold";
            default:
              return "bg-gray-100 text-gray-800 border-gray-200 font-bold";
          }
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${getBadgeStyle()}`}>
            {ws}
          </span>
        );
      },
    },
    {
      header: "Account Status",
      accessorKey: "is_active",
      sortable: true,
      cell: (o) =>
        o.is_active ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        ) : (
          <span className="text-red-600 font-bold flex items-center gap-1 text-xs">
            <AlertCircle className="w-3.5 h-3.5" /> Deactivated
          </span>
        ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setTransferringOfficer(o)}
            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all font-bold text-xs flex items-center gap-1"
            title="Transfer Officer to New Station"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
          </button>
          <button
            onClick={() => openEditModal(o)}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
            title="Edit Profile"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleStatus(o.id)}
            className={`p-1.5 rounded-xl border transition-all ${
              o.is_active ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
            title={o.is_active ? "Deactivate Officer" : "Reactivate Officer"}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(o.id)}
            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all"
            title="Delete Officer"
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
        title="Officer Roster & Deployments"
        subtitle="Deploy Range Forest Officers and Forest Guards linked to Monitoring Stations"
        icon={ShieldAlert}
        badge={`${officers.length} Active Officers`}
      />

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search officers by name, station, district..."
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={filterOptions}
        onRefresh={loadData}
        isRefreshing={isLoading}
        addButtonLabel="Deploy New Officer"
        onAddClick={openCreateModal}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredOfficers}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No officer records found."
      />

      {/* Deploy / Edit Officer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-950/10 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
              <h3 className="text-base font-extrabold text-emerald-950">
                {editingOfficer ? "Edit Officer Profile" : "Deploy New Officer"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@gaia.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Designation *</label>
                  <select
                    required
                    value={designationId}
                    onChange={(e) => setDesignationId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.designation_name}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingOfficer && (
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Monitoring Station *</label>
                    <select
                      required
                      value={stationId}
                      onChange={(e) => setStationId(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                    >
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.station_name} {s.head_officer_id ? "(RFO Assigned)" : "(No RFO)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Guard Station RFO Validation Warning Banner */}
              {isGuardCreationBlocked && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    This station currently has no assigned Range Forest Officer. Please assign a head officer before adding Forest Guards.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {!editingOfficer && (
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Temporary Password *</label>
                    <input
                      type="text"
                      required
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-1.5">Account Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-950/15 text-xs text-emerald-950 font-semibold focus:ring-2 focus:ring-emerald-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  disabled={isSubmitting || isGuardCreationBlocked}
                  className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : editingOfficer ? "Update Profile" : "Deploy Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Officer Modal */}
      {transferringOfficer && (
        <OfficerTransferModal
          officer={transferringOfficer}
          isOpen={!!transferringOfficer}
          onClose={() => setTransferringOfficer(null)}
          onSuccess={(msg) => {
            setSuccess(msg);
            loadData();
            setTimeout(() => setSuccess(null), 4000);
          }}
        />
      )}
    </div>
  );
};

export default AdminOfficersPage;
