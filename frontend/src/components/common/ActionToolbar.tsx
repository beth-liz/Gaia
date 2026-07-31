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
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-950/10 p-3.5 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
        {/* Search */}
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700/60" />
            <input
              type="text"
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-emerald-950/10 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 text-emerald-950 font-medium"
            />
          </div>
        )}

        {/* Filter Dropdown */}
        {onFilterChange && filterOptions.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-emerald-700 shrink-0" />
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-emerald-950/10 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 text-emerald-950 font-bold"
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
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 border border-gray-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        )}

        {/* Add Action Button (Green Primary) */}
        {addButtonLabel && onAddClick && (
          <button
            onClick={onAddClick}
            className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>{addButtonLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
