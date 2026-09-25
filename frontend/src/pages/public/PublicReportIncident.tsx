import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const PublicReportIncident: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple Header for Public Visitor */}
      <header className="bg-emerald-950 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/images/gaia-logo.png" alt="Gaia Logo" className="w-10 h-10 object-contain drop-shadow-md bg-white rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">Gaia</h1>
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest leading-none">
              Public Portal
            </p>
          </div>
        </div>
        <Link to="/" className="text-sm font-bold text-emerald-200 hover:text-white transition-colors">
          Back to Home
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <PageHeader
            title="Report Wildlife Incident"
            subtitle="Report wildlife sightings or human-animal conflict to alert nearby Rangers immediately. You do not need an account to file a report."
            icon={AlertCircle}
            badge="Public Report System"
          />

          <CreateIncidentForm onSuccessRedirectPath="/" />
        </div>
      </main>
    </div>
  );
};

export default PublicReportIncident;
