import React from "react";
import type { IncidentActivity } from "@/types";
import { Clock, User, MessageSquare } from "lucide-react";

interface IncidentActivityTimelineProps {
  activities: IncidentActivity[];
}

export const IncidentActivityTimeline: React.FC<IncidentActivityTimelineProps> = ({
  activities,
}) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-emerald-800/60 font-medium bg-emerald-50/40 rounded-2xl border border-emerald-950/10">
        No activity logs recorded for this incident yet.
      </div>
    );
  }

  const getActionBadge = (act: string) => {
    switch (act) {
      case "Created":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "Assigned":
        return "bg-amber-100 text-amber-900 border-amber-200 font-bold";
      case "Resolved":
        return "bg-purple-100 text-purple-900 border-purple-200 font-bold";
      case "Closed":
      case "Verified & Closed":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
      case "Rejected":
        return "bg-red-100 text-red-900 border-red-200 font-bold";
      case "Returned for Correction":
        return "bg-orange-100 text-orange-900 border-orange-200 font-bold";
      default:
        return "bg-emerald-50 text-emerald-900 border-emerald-950/10 font-semibold";
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-5 space-y-4">
      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-700" />
        Activity Audit Timeline ({activities.length})
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-950/10">
        {activities.map((act) => (
          <div key={act.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-900 text-white flex items-center justify-center text-[10px] font-black shadow-xs ring-4 ring-white">
              &bull;
            </div>

            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-950/10 space-y-1.5 transition-all group-hover:bg-emerald-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${getActionBadge(act.action)}`}>
                    {act.action}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-700" />
                    {act.user_name || "System"} ({act.user_role || "User"})
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800/70">
                  {new Date(act.created_at).toLocaleString()}
                </span>
              </div>

              {act.remarks && (
                <div className="text-xs text-emerald-900 font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-950/5 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{act.remarks}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
