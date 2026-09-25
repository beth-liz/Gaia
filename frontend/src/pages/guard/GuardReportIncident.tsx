import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { ShieldAlert } from "lucide-react";

export const GuardReportIncident: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Wildlife Incident"
        subtitle="Report wildlife sightings or human-animal conflict during your patrol"
        icon={ShieldAlert}
        badge="Guard Incident Report"
      />

      <CreateIncidentForm onSuccessRedirectPath="/guard/my-reports" />
    </div>
  );
};

export default GuardReportIncident;
