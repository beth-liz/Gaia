import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { AlertCircle } from "lucide-react";

export const VillagerReportIncident: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Wildlife Incident"
        subtitle="Report wildlife sightings or human-animal conflict to alert nearby villagers and Range Officers"
        icon={AlertCircle}
        badge="Field Emergency Report"
      />

      <CreateIncidentForm onSuccessRedirectPath="/villager/my-reports" />
    </div>
  );
};

export default VillagerReportIncident;
