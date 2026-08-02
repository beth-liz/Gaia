import React from "react";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";

interface IncidentProgressTrackerProps {
  currentStatus: string;
}

export const IncidentProgressTracker: React.FC<IncidentProgressTrackerProps> = ({
  currentStatus,
}) => {
  const steps = [
    { key: "Pending Review", label: "Reported" },
    { key: "Under Review", label: "RFO Review" },
    { key: "Assigned", label: "Guard Assigned" },
    { key: "In Progress", label: "Field Operation" },
    { key: "Resolved", label: "Report Submitted" },
    { key: "Closed", label: "Closed & Verified" },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case "New":
      case "Pending Review":
      case "Pending":
        return 0;
      case "Under Review":
      case "Awaiting Information":
        return 1;
      case "Assigned":
        return 2;
      case "In Progress":
      case "Travelling":
      case "Reached Site":
      case "Assessment Completed":
      case "Action Taken":
        return 3;
      case "Resolved":
        return 4;
      case "Closed":
      case "Completed":
        return 5;
      case "Rejected":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isRejected = currentStatus === "Rejected";

  if (isRejected) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>Incident Rejected by Range Forest Officer. No field action required.</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-extrabold uppercase text-[10px]">
          Rejected
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">Incident Lifecycle Progress</h4>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">
          Current Status: {currentStatus}
        </span>
      </div>

      {/* Progress Bar Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || (idx === currentIndex && currentStatus === "Closed");
          const isCurrent = idx === currentIndex && currentStatus !== "Closed";

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-1.5 ${
                isCompleted
                  ? "bg-emerald-900 text-white border-emerald-950 shadow-xs"
                  : isCurrent
                  ? "bg-amber-100 text-amber-950 border-amber-300 font-extrabold ring-2 ring-amber-400"
                  : "bg-emerald-50/40 text-emerald-950/50 border-emerald-950/10"
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-extrabold">Step {idx + 1}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              <span className="text-xs font-bold leading-tight truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
