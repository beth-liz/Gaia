import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Building2, Radio, MapPin, Phone, Mail, UserCheck, ShieldCheck, Activity, Loader2 } from "lucide-react";

export const RFOStationOverviewPage: React.FC = () => {
  const [station, setStation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStation = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStationOverviewMetrics();
      setStation(data);
    } catch (err) {
      console.error("Failed to load station overview metrics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStation();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-xs font-bold text-emerald-950">Loading Monitoring Station Overview...</p>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-emerald-950/10 text-xs font-bold text-emerald-950">
        No Station Details Found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Station Overview: ${station.station_name}`}
        subtitle={`Range Headquarters • ${station.district_name}, ${station.state_name}`}
        icon={Building2}
        badge={station.status}
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Total Guards</span>
            <span className="text-xl font-black text-emerald-950">{station.total_guards || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Available Guards</span>
            <span className="text-xl font-black text-emerald-950">{station.available_guards || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Busy Guards</span>
            <span className="text-xl font-black text-emerald-950">{station.busy_guards || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 border border-emerald-950/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800/70 block uppercase tracking-wider">Open Incidents</span>
            <span className="text-xl font-black text-emerald-950">{station.open_incidents || 0}</span>
          </div>
        </div>
      </div>

      {/* Station Details Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-950/10 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-950 border-b border-emerald-950/10 pb-3">
          Monitoring Station Command Headquarters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-800/70 font-semibold">Head Officer RFO:</span>
              <span className="font-extrabold text-emerald-950">{station.head_officer_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-800/70 font-semibold">HQ Phone:</span>
              <span className="font-bold text-emerald-950">{station.phone}</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-800/70 font-semibold">HQ Email:</span>
              <span className="font-bold text-emerald-950">{station.email}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-800/70 font-semibold">District Range:</span>
              <span className="font-extrabold text-emerald-950">{station.district_name}, {station.state_name}</span>
            </div>

            <div>
              <span className="text-emerald-800/70 font-semibold block mb-1">Station GPS Coordinates:</span>
              <span className="font-mono font-bold text-emerald-950 bg-emerald-50 p-2 rounded-xl border border-emerald-950/10 block">
                {station.latitude.toFixed(4)} N, {station.longitude.toFixed(4)} E
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFOStationOverviewPage;
