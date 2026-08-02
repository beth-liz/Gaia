import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import type { Incident } from "@/types";
import { Radio, MapPin, Calendar, Loader2, ArrowRight, CheckCircle2, User } from "lucide-react";

export const RFOIncidentQueuePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getIncidentQueue();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load RFO incident queue", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filtered = incidents.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.reference_id && i.reference_id.toLowerCase().includes(q)) ||
      i.animal.toLowerCase().includes(q) ||
      (i.location && i.location.toLowerCase().includes(q)) ||
      (i.reporter_name && i.reporter_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Incident Queue"
        subtitle="Review, verify, and dispatch field personnel for incoming station incidents"
        icon={Radio}
        badge={`${incidents.length} Pending Review`}
      />

      <div className="flex items-center justify-between gap-4 bg-white/90 p-4 rounded-2xl border border-emerald-950/10 shadow-xs">
        <input
          type="text"
          placeholder="Filter queue by reference ID, animal, village, or reporter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 text-xs rounded-xl border border-emerald-950/15 font-semibold text-emerald-950 bg-emerald-50/30"
        />
        <button
          onClick={loadQueue}
          className="px-4 py-2.5 rounded-xl bg-emerald-900 text-white font-extrabold text-xs shadow-xs hover:bg-emerald-950"
        >
          Refresh Queue
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-emerald-950">Loading Range Station Queue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-extrabold text-emerald-950">Incident Queue Clear</h3>
          <p className="text-xs text-emerald-800/70">All station incidents have been reviewed and dispatched.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950/10 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 block">{inc.reference_id}</span>
                    <h3 className="text-base font-black text-emerald-950">{inc.incident_title || `${inc.animal} Sighting`}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
                    {inc.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Animal</span>
                    <span className="font-extrabold text-emerald-950 truncate block">{inc.animal_species_name || inc.animal}</span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Severity</span>
                    <span className="font-extrabold text-amber-900">{inc.severity}</span>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-950/5">
                    <span className="text-[10px] font-extrabold text-emerald-800/70 block uppercase">Distance</span>
                    <span className="font-extrabold text-emerald-950">~3.2 km</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-emerald-950">{inc.location} ({inc.village_name || "Sector Range"})</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-emerald-800/80">
                    <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Reporter: {inc.reporter_name} ({inc.reporter_role})</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-emerald-800/80">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Logged: {inc.date_reported} @ {inc.time_reported}</span>
                  </div>
                </div>

                {inc.description && (
                  <p className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-950/5 text-xs text-emerald-950 font-medium line-clamp-2">
                    {inc.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-end gap-2">
                <Link
                  to={`/incidents/${inc.id}`}
                  className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  View Details & Decision Panel <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RFOIncidentQueuePage;
