import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Users, Loader2 } from "lucide-react";

export const RFOForestGuardsPage: React.FC = () => {
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Forest Guard Roster"
        subtitle="Manage field personnel readiness, duty work statuses, and active mission workloads"
        icon={Users}
        badge={`${guards.length} Forest Guards`}
      />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guards.map((g) => (
            <div
              key={g.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-emerald-950/10 pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-950 font-black text-lg flex items-center justify-center border border-amber-300 shadow-xs shrink-0">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      g.full_name.charAt(0)
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-emerald-950">{g.full_name}</h3>
                    <span className="text-[11px] font-bold text-emerald-800/70 block">{g.designation_name || "Forest Guard"}</span>
                    <span className="text-[10px] text-emerald-800/60 font-medium">Station: {g.station_name || "Muthanga HQ"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800/70">Duty Work Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      g.work_status === "Available"
                        ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                        : g.work_status === "Busy"
                        ? "bg-amber-100 text-amber-950 border border-amber-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {g.work_status || "Available"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Assignments Today</span>
                    <span className="font-extrabold text-emerald-950 text-base">{g.assignments_today || 0}</span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Active Workload</span>
                    <span className="font-extrabold text-amber-900 text-base">{g.current_workload || 0} Missions</span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-800/80 space-y-1">
                  <div><strong>Email:</strong> {g.email}</div>
                  <div><strong>Phone:</strong> {g.phone || "N/A"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RFOForestGuardsPage;
