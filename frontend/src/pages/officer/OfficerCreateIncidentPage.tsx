import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";
import { AlertCircle } from "lucide-react";

export const OfficerCreateIncidentPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Incident Report (RFO Manual Entry)"
        subtitle="Log manual wildlife sightings or conflict reports received via telephone dispatch or patrol logs"
        icon={AlertCircle}
        badge="Station Dispatch Entry"
      />

      <CreateIncidentForm onSuccessRedirectPath="/officer/incidents" />
    </div>
  );
};

export default OfficerCreateIncidentPage;
