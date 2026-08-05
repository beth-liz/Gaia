import React from "react";
import { RefreshCw, ServerOff, ShieldAlert } from "lucide-react";

interface InventoryErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isStationError?: boolean;
}

export const InventoryErrorCard: React.FC<InventoryErrorCardProps> = ({
  title = "Telemetry Connection Notice",
  message,
  onRetry,
  isStationError = false,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-950/15 shadow-xs space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="p-3 rounded-2xl bg-amber-100/80 text-amber-900 shrink-0">
          {isStationError ? <ShieldAlert className="w-6 h-6" /> : <ServerOff className="w-6 h-6" />}
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-emerald-950">{title}</h4>
          <p className="text-xs font-medium text-emerald-900/80 leading-relaxed max-w-2xl">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
