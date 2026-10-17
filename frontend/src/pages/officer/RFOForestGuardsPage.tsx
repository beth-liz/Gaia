import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Users, Loader2, Search, ArrowRight, Shield, Briefcase, Mail, Phone, UserCheck } from "lucide-react";

export const RFOForestGuardsPage: React.FC = () => {
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuardId, setSelectedGuardId] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadGuards = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStationGuardsWorkflow();
      setGuards(data);
    } catch (err) {
      console.error("Failed to load station guards workflow", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuards();
  }, []);

  const filteredGuards = useMemo(() => {
    if (!searchQuery.trim()) return guards;
    const q = searchQuery.toLowerCase();
    return guards.filter(
      (g) =>
        g.full_name?.toLowerCase().includes(q) ||
        g.badge_number?.toLowerCase().includes(q) ||
        g.designation_name?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q)
    );
  }, [guards, searchQuery]);

  const selectedGuard = useMemo(() => {
    return guards.find((g) => g.id === selectedGuardId) || null;
  }, [guards, selectedGuardId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-all duration-300">
      <PageHeader
        title="Station Forest Guard Roster"
        subtitle="Manage field personnel readiness, duty work statuses, active mission workloads, and assigned gear."
        icon={Users}
        badge={`${guards.length} Forest Guards`}
      />

      {/* Top Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-700" /> Station Field Roster
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            Click on any guard card to inspect details, workload, or proceed to issue field equipment.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-700/50" />
          <input
            type="text"
            placeholder="Search guard name, badge, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-emerald-950/10 bg-emerald-950/5 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800 placeholder-emerald-900/40"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-emerald-950">Loading Forest Guard Roster...</p>
        </div>
      ) : guards.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Users className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-extrabold text-emerald-950">No Forest Guards Stationed</h3>
          <p className="text-xs text-emerald-800/70">Contact Admin to deploy Forest Guards to this monitoring station.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* GUARD CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredGuards.map((g) => {
              const isSelected = selectedGuardId === g.id;
              const isAvailable = g.work_status === "Available";
              const isBusy = g.work_status === "Busy";

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuardId(isSelected ? null : g.id)}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "bg-emerald-950 text-white border-emerald-950 shadow-lg ring-4 ring-emerald-600/30 scale-[1.01]"
                      : "bg-white border-emerald-950/10 hover:border-emerald-700 shadow-xs hover:scale-[1.005]"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name, Designation & Role Badge */}
                    <div className="flex items-start justify-between gap-3 border-b pb-3 border-emerald-950/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 border shadow-xs ${
                            isSelected
                              ? "bg-amber-400 text-emerald-950 border-amber-300"
                              : "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 border-amber-300"
                          }`}
                        >
                          {g.avatar_url ? (
                            <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            g.full_name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className={`text-sm font-black truncate ${isSelected ? "text-white" : "text-emerald-950"}`}>
                            {g.full_name}
                          </h4>
                          <span className={`text-[11px] font-bold block truncate ${isSelected ? "text-emerald-300" : "text-emerald-800/80"}`}>
                            {g.designation_name || "Forest Guard"}
                          </span>
                          <span className={`text-[10px] font-mono block ${isSelected ? "text-emerald-400" : "text-emerald-800/60"}`}>
                            {g.badge_number || `FG-${g.id}`}
                          </span>
                        </div>
                      </div>

                      {/* Work Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isAvailable
                            ? isSelected
                              ? "bg-emerald-400 text-emerald-950"
                              : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                            : isBusy
                            ? isSelected
                              ? "bg-amber-400 text-amber-950"
                              : "bg-amber-100 text-amber-950 border border-amber-300"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {g.work_status || "Available"}
                      </span>
                    </div>

                    {/* Operational Details Box */}
                    <div
                      className={`p-3 rounded-2xl text-xs font-semibold space-y-2 ${
                        isSelected
                          ? "bg-emerald-900/80 border border-emerald-800 text-emerald-100"
                          : "bg-emerald-50/60 border border-emerald-100 text-emerald-950"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="opacity-75 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" /> Station Sector:
                        </span>
                        <span className="font-extrabold truncate">{g.station_name || "Muthanga HQ"}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-950/5">
                        <div>
                          <span className="text-[10px] opacity-75 uppercase block">Today's Missions</span>
                          <span className="font-mono font-black text-sm">{g.assignments_today || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] opacity-75 uppercase block">Active Workload</span>
                          <span className="font-mono font-black text-sm">{g.current_workload || 0} Missions</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className={`text-[11px] space-y-1 pt-1 ${isSelected ? "text-emerald-200" : "text-emerald-900/80"}`}>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3 h-3 opacity-60 shrink-0" />
                        <span className="truncate">{g.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 opacity-60 shrink-0" />
                        <span>{g.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Selection Action Indicator */}
                  <div className="flex justify-end pt-2 border-t border-emerald-950/10">
                    <span
                      className={`text-xs font-extrabold flex items-center gap-1 ${
                        isSelected ? "text-amber-300" : "text-emerald-800"
                      }`}
                    >
                      {isSelected ? "Selected ✓" : "Click to Select →"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredGuards.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-emerald-950/10 text-xs font-semibold text-gray-400 italic">
                No Forest Guards found matching your search query.
              </div>
            )}
          </div>

          {/* CONFIRMATION CALLOUT & ACTION BANNER */}
          {selectedGuard && (
            <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-xl border border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Forest Guard Selected</h4>
                  <p className="text-xs text-emerald-300 font-semibold">
                    {selectedGuard.full_name} ({selectedGuard.badge_number || `FG-${selectedGuard.id}`}) • {selectedGuard.station_name || "Muthanga HQ"} • Status: {selectedGuard.work_status || "Available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedGuardId(null)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all"
                >
                  Deselect
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/officer/inventory/issue?guardId=${selectedGuard.id}`)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-emerald-950" />
                  <span>Issue Field Equipment</span>
                  <ArrowRight className="w-4 h-4 text-emerald-950 stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RFOForestGuardsPage;
