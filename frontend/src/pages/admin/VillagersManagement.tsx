import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ActionToolbar } from "@/components/common/ActionToolbar";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Users, CheckCircle2, AlertCircle } from "lucide-react";

const VillagersManagement: React.FC = () => {
  const [villagers, setVillagers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadVillagers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVillagers(filter === "all" ? undefined : filter);
      setVillagers(data);
    } catch (err: any) {
      console.error("Failed to load villagers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVillagers();
  }, [filter]);

  const handleApprove = async (id: number) => {
    try {
      await api.approveVillager(id);
      loadVillagers();
    } catch (err: any) {
      alert(err.message || "Approve failed");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject and remove this registration request?")) return;
    try {
      await api.rejectVillager(id);
      loadVillagers();
    } catch (err: any) {
      alert(err.message || "Reject failed");
    }
  };

  const filteredVillagers = villagers.filter(
    (v) =>
      v.full_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      (v.village_name && v.village_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filterOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
  ];

  const columns: Column<any>[] = [
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
      header: "Village Sector",
      accessorKey: "village_name",
      sortable: true,
      cell: (v) => <span className="font-semibold text-emerald-900">{v.village_name || "N/A"}</span>,
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
              onClick={() => handleApprove(v.id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95"
            >
              Approve
            </button>
          )}
          <button
            onClick={() => handleReject(v.id)}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-all"
          >
            Reject / Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Villager Account Approval"
        subtitle="Review and approve villager registration requests stored in PostgreSQL"
        icon={Users}
        badge={`${villagers.length} Registered`}
      />

      {/* Action Toolbar */}
      <ActionToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search villager by name, email, or village..."
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={filterOptions}
        onRefresh={loadVillagers}
        isRefreshing={isLoading}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredVillagers}
        keyExtractor={(v) => v.id}
        isLoading={isLoading}
        emptyMessage="No villager records found matching your filters."
      />
    </div>
  );
};

export default VillagersManagement;
