import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const VillagersManagement: React.FC = () => {
  const [villagers, setVillagers] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 p-6 rounded-3xl border border-emerald-950/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight">Villager Account Approval</h1>
          <p className="text-xs text-emerald-900/70 mt-1">Review and approve villager registration requests stored in PostgreSQL</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-900/10 self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "all" ? "bg-emerald-900 text-white shadow-xs" : "text-emerald-950 hover:bg-emerald-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "pending" ? "bg-amber-500 text-emerald-950 shadow-xs" : "text-emerald-950 hover:bg-emerald-100"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "approved" ? "bg-emerald-900 text-white shadow-xs" : "text-emerald-950 hover:bg-emerald-100"
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-emerald-700 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search villager by name, email, or village..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-emerald-900/15 text-emerald-950 text-sm placeholder:text-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-800 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="gaia-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-emerald-950">Loading Villagers from Database...</p>
          </div>
        ) : filteredVillagers.length === 0 ? (
          <div className="p-12 text-center text-emerald-900/60 text-xs font-medium">
            No villager records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-emerald-950">
              <thead className="bg-emerald-50/80 border-b border-emerald-950/10 uppercase tracking-wider text-[11px] font-bold text-emerald-900">
                <tr>
                  <th className="py-3.5 px-6">Villager Name</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">Village Sector</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/10 font-medium">
                {filteredVillagers.map((v) => (
                  <tr key={v.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-emerald-950">{v.full_name}</td>
                    <td className="py-4 px-6">
                      <div>{v.email}</div>
                      <div className="text-[11px] text-emerald-800/70">{v.phone || "No phone"}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold">{v.village_name || "N/A"}</td>
                    <td className="py-4 px-6">
                      {v.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {!v.is_verified && (
                        <button
                          onClick={() => handleApprove(v.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-bold shadow-xs transition-all"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(v.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold border border-red-200 transition-all"
                      >
                        Reject / Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VillagersManagement;
