import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { AlertCircle, Shield, BellRing, Compass } from "lucide-react";

export const VillagerReportIncident: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Report Wildlife Incident"
        subtitle="Report wildlife sightings or human-animal conflict to alert nearby villagers and Range Officers"
        icon={AlertCircle}
        badge="Field Emergency Report"
        theme="light"
      />

      {/* Nature-themed introduction banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-800/80 text-white p-6 sm:p-8 shadow-lg border border-emerald-800/40 backdrop-blur-md">
        <img
          src="/images/nature2.jpg"
          alt="Wildlife Conservation Area"
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay"
        />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold uppercase tracking-wider border border-emerald-700/60">
            <Shield className="w-3.5 h-3.5" /> Community Wildlife Safety
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Protecting Our Village & Wildlife Together
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            Prompt reporting enables Range Forest Officers and patrol teams to respond quickly, safe-route animals back into protected corridors, and keep neighboring households informed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <BellRing className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Real-Time Alert Dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <Compass className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Precise GPS Coordination</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <Shield className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Coordinated Forest Guard Response</span>
            </div>
          </div>
        </div>
      </div>

      <CreateIncidentForm onSuccessRedirectPath="/villager/my-reports" />
    </div>
  );
};

export default VillagerReportIncident;
