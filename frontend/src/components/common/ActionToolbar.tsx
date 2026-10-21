import React from "react";
import { Search, Filter, RefreshCw, Plus } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface ActionToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  extraActions?: React.ReactNode;
  theme?: "default" | "green";
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  onRefresh,
  isRefreshing = false,
  addButtonLabel,
  onAddClick,
  extraActions,
  theme = "default",
}) => {
  const isGreen = theme === "green";

  return (
    <div
      className={`rounded-2xl p-3.5 mb-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md transition-all ${
        isGreen
          ? "bg-emerald-950/50 border border-emerald-500/30 text-white shadow-black/10"
          : "bg-white/80 border border-emerald-950/10 shadow-xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
        {/* Search */}
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isGreen ? "text-emerald-300" : "text-emerald-700/60"
              }`}
            />
            <input
              type="text"
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl font-medium focus:outline-none transition-all ${
                isGreen
                  ? "bg-emerald-900/60 border border-emerald-500/30 text-white placeholder:text-emerald-300/60 focus:bg-emerald-900/90 focus:border-emerald-400"
                  : "border border-emerald-950/10 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-900/20"
              }`}
            />
          </div>
        )}

        {/* Filter Dropdown */}
        {onFilterChange && filterOptions.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className={`w-4 h-4 shrink-0 ${isGreen ? "text-emerald-300" : "text-emerald-700"}`} />
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className={`w-full sm:w-44 px-3 py-2 text-xs rounded-xl font-bold focus:outline-none transition-all cursor-pointer ${
                isGreen
                  ? "bg-emerald-900/80 border border-emerald-500/30 text-white focus:border-emerald-400 [&>option]:bg-emerald-950 [&>option]:text-white"
                  : "border border-emerald-950/10 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-900/20"
              }`}
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {extraActions}
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border active:scale-95 ${
              isGreen
                ? "bg-emerald-900/80 hover:bg-emerald-800 text-white border-emerald-500/30 shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        )}

        {/* Add Action Button */}
        {addButtonLabel && onAddClick && (
          <button
            onClick={onAddClick}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5 shrink-0 ${
              isGreen
                ? "bg-amber-400 hover:bg-amber-300 text-emerald-950 border border-amber-300 shadow-amber-950/20"
                : "bg-emerald-900 hover:bg-emerald-950 text-white"
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-950" />
            <span>{addButtonLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
