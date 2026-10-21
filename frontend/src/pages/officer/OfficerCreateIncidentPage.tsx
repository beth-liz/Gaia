import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { AlertCircle } from "lucide-react";

export const OfficerCreateIncidentPage: React.FC = () => {
  return (
    <div className="relative min-h-full -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* 
        BACKGROUND LAYER:
        - Full-cover nature5.jpg background image matching Public Incident Report
        - Subtle, transparent forest-green gradient overlay (25-40% opacity)
      */}
      <div
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(6, 28, 20, 0.35) 0%, rgba(13, 40, 24, 0.25) 50%, rgba(6, 28, 20, 0.40) 100%),
            url('/images/nature5.jpg')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Create Incident Report (RFO Manual Entry)"
          subtitle="Log manual wildlife sightings or conflict reports received via telephone dispatch or patrol logs"
          icon={AlertCircle}
          badge="Station Dispatch Entry"
          theme="light"
        />

        <CreateIncidentForm onSuccessRedirectPath="/officer/incidents" />
      </div>
    </div>
  );
};

export default OfficerCreateIncidentPage;
