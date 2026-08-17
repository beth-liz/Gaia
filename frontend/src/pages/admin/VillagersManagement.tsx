import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface Villager {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  is_active: boolean;
  village_name?: string;
  district_name?: string;
  state_name?: string;
  created_at: string;
}

// Small reusable label/value row used inside the modals
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-2 text-xs">
    <span className="mt-0.5 shrink-0">{icon}</span>
    <span className="font-semibold text-gray-500 w-16 shrink-0">{label}</span>
    <span className="font-bold text-emerald-950 break-all">{value}</span>
  </div>
);

const VillagersManagement: React.FC = () => {
  const [villagers, setVillagers] = useState<Villager[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Verify confirmation modal
  const [verifyTarget, setVerifyTarget] = useState<Villager | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Reject confirmation modal
  const [rejectTarget, setRejectTarget] = useState<Villager | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadVillagers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVillagers(filter === "all" ? undefined : filter);
      setVillagers(data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load villagers.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVillagers();
  }, [filter]);

  // ── VERIFY ──────────────────────────────────────────────────────────────
  const handleVerifyClick = (v: Villager) => setVerifyTarget(v);

  const handleVerifyCancel = () => {
    if (!isVerifying) setVerifyTarget(null);
  };

  const handleVerifyConfirm = async () => {
    if (!verifyTarget || isVerifying) return;
    setIsVerifying(true);
    try {
      await api.approveVillager(verifyTarget.id);
      const name = verifyTarget.full_name;
      setVerifyTarget(null);
      showToast(`${name} has been verified successfully.`, "success");
      await loadVillagers();
    } catch (err: any) {
      showToast(err.message || "Verification failed. Please try again.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── REJECT ───────────────────────────────────────────────────────────────
  const handleRejectClick = (v: Villager) => setRejectTarget(v);

  const handleRejectCancel = () => {
    if (!isRejecting) setRejectTarget(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || isRejecting) return;
    setIsRejecting(true);
    try {
      await api.rejectVillager(rejectTarget.id);
      const name = rejectTarget.full_name;
      setRejectTarget(null);
      showToast(`${name}'s registration has been removed.`, "success");
      await loadVillagers();
    } catch (err: any) {
      showToast(err.message || "Rejection failed. Please try again.", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredVillagers = villagers.filter(
    (v) =>
      (v.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.village_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const filterOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
  ];

  const columns: Column<Villager>[] = [
    {
      header: "Villager Name",
      accessorKey: "full_name",
      sortable: true,
      cell: (v) => <span className="font-extrabold text-emerald-950">{v.full_name}</span>,
    },
    {
      header: "Contact Info",
      accessorKey: "email",
      cell: (v) => (
        <div className="text-[11px]">
          <div className="font-bold text-emerald-950">{v.email}</div>
          <div className="text-emerald-800/70">{v.phone || "No phone"}</div>
        </div>
      ),
    },
    {
      header: "Village / District",
      accessorKey: "village_name",
      sortable: true,
      cell: (v) => (
        <div className="text-[11px]">
          <div className="font-semibold text-emerald-900">{v.village_name || "N/A"}</div>
          {v.district_name && (
            <div className="text-emerald-800/60">{v.district_name}</div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_verified",
      sortable: true,
      cell: (v) =>
        v.is_verified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
            Pending Approval
          </span>
        ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (v) => (
        <div className="flex items-center justify-end gap-2">
          {!v.is_verified && (
            <button
              onClick={() => handleVerifyClick(v)}
              className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify
            </button>
          )}
          <button
            onClick={() => handleRejectClick(v)}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all cursor-pointer"
          >
            Reject / Delete
          </button>
        </div>
      ),
    },
  ];

  const pendingCount = villagers.filter((v) => !v.is_verified).length;

  return (
    <div className="space-y-6">
      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            toast.type === "success" ? "bg-emerald-900 text-white" : "bg-red-700 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      <PageHeader
        title="Villager Account Approval"
        subtitle="Review and approve villager registration requests stored in PostgreSQL"
        icon={Users}
        badge={pendingCount > 0 ? `${pendingCount} Pending` : `${villagers.length} Registered`}
      />

      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or village..."
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={filterOptions}
        onRefresh={loadVillagers}
        isRefreshing={isLoading}
      />

      <DataTable
        columns={columns}
        data={filteredVillagers}
        keyExtractor={(v) => v.id}
        isLoading={isLoading}
        emptyMessage="No villager records found matching your filters."
      />

      {/* ── VERIFY CONFIRMATION MODAL ─────────────────────────────────────── */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-950/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-950/10 pb-4">
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Verify Villager
              </h3>
              <button
                onClick={handleVerifyCancel}
                disabled={isVerifying}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Are you sure you want to verify this villager? This will grant them access to the
              Gaia platform.
            </p>

            <div className="bg-emerald-50 rounded-2xl p-4 space-y-2.5 border border-emerald-100">
              <InfoRow icon={<User className="w-3.5 h-3.5 text-emerald-700" />} label="Name" value={verifyTarget.full_name} />
              <InfoRow icon={<Mail className="w-3.5 h-3.5 text-emerald-700" />} label="Email" value={verifyTarget.email} />
              {verifyTarget.phone && (
                <InfoRow icon={<Phone className="w-3.5 h-3.5 text-emerald-700" />} label="Phone" value={verifyTarget.phone} />
              )}
              {verifyTarget.village_name && (
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-emerald-700" />} label="Village" value={verifyTarget.village_name} />
              )}
              {verifyTarget.district_name && (
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-emerald-700" />} label="District" value={verifyTarget.district_name} />
              )}
              {verifyTarget.state_name && (
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-emerald-700" />} label="State" value={verifyTarget.state_name} />
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleVerifyCancel}
                disabled={isVerifying}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyConfirm}
                disabled={isVerifying}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-extrabold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm Verification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT CONFIRMATION MODAL ─────────────────────────────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
              <h3 className="text-base font-black text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Reject Registration
              </h3>
              <button
                onClick={handleRejectCancel}
                disabled={isRejecting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Are you sure you want to reject and permanently remove this villager's registration
              request? This action cannot be undone.
            </p>

            <div className="bg-red-50 rounded-2xl p-4 space-y-2.5 border border-red-100">
              <InfoRow icon={<User className="w-3.5 h-3.5 text-red-700" />} label="Name" value={rejectTarget.full_name} />
              <InfoRow icon={<Mail className="w-3.5 h-3.5 text-red-700" />} label="Email" value={rejectTarget.email} />
              {rejectTarget.village_name && (
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-red-700" />} label="Village" value={rejectTarget.village_name} />
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleRejectCancel}
                disabled={isRejecting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isRejecting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-extrabold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VillagersManagement;