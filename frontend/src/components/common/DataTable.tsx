import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  initialRowsPerPage?: number;
  theme?: "default" | "green";
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  initialRowsPerPage = 10,
  theme = "default",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialRowsPerPage);

  const isGreen = theme === "green";

  const handleSort = (key?: string) => {
    if (!key) return;
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a: any, b: any) => {
      const valA = a[sortColumn] ?? "";
      const valB = b[sortColumn] ?? "";

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  return (
    <div
      className={`rounded-2xl border shadow-lg overflow-hidden backdrop-blur-md transition-all ${
        isGreen
          ? "bg-emerald-950/45 border-emerald-500/25 shadow-black/10"
          : "bg-white/90 border-emerald-950/10 shadow-xs"
      }`}
    >
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* Sticky Table Header */}
          <thead
            className={`sticky top-0 z-10 border-b text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
              isGreen
                ? "bg-emerald-900/80 border-emerald-500/30 text-white"
                : "bg-emerald-50/90 border-emerald-950/10 text-emerald-900"
            }`}
          >
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  className={`py-3.5 px-4 ${
                    col.sortable
                      ? isGreen
                        ? "cursor-pointer select-none hover:bg-emerald-800/80"
                        : "cursor-pointer select-none hover:bg-emerald-100/60"
                      : ""
                  } ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 ${
                      col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && col.accessorKey && (
                      <span className={isGreen ? "text-amber-300" : "text-emerald-800"}>
                        {sortColumn === col.accessorKey ? (
                          sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <span className="opacity-40">↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody
            className={`divide-y text-xs font-semibold ${
              isGreen
                ? "divide-emerald-800/30 text-emerald-100"
                : "divide-emerald-950/5 text-emerald-950"
            }`}
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`py-12 text-center ${isGreen ? "text-emerald-200" : "text-emerald-800/60"}`}
                >
                  Loading records...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`py-12 text-center font-medium ${isGreen ? "text-emerald-200" : "text-emerald-800/60"}`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={`transition-colors ${
                    isGreen ? "hover:bg-emerald-900/40 text-emerald-100" : "hover:bg-emerald-50/50 text-emerald-950"
                  }`}
                >
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`py-3.5 px-4 ${
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String((row as any)[col.accessorKey] ?? "N/A")
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > 0 && (
        <div
          className={`p-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold ${
            isGreen
              ? "bg-emerald-950/60 border-emerald-500/25 text-white"
              : "bg-emerald-50/50 border-emerald-950/10 text-emerald-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={isGreen ? "text-emerald-200/90 font-medium" : "text-emerald-800/70 font-medium"}>
              Rows per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-xs rounded-lg border font-bold focus:outline-none cursor-pointer ${
                isGreen
                  ? "bg-emerald-900/80 border-emerald-500/30 text-white [&>option]:bg-emerald-950 [&>option]:text-white"
                  : "border-emerald-950/10 bg-white text-emerald-950"
              }`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className={`pl-2 font-medium ${isGreen ? "text-emerald-200/90" : "text-emerald-800/70"}`}>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className={`p-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                isGreen
                  ? "border-emerald-500/30 bg-emerald-900/60 text-white hover:bg-emerald-800"
                  : "border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:hover:bg-white"
              }`}
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safeCurrentPage === 1}
              className={`p-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                isGreen
                  ? "border-emerald-500/30 bg-emerald-900/60 text-white hover:bg-emerald-800"
                  : "border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:hover:bg-white"
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span
              className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                isGreen
                  ? "text-white bg-emerald-900/80 border-emerald-500/30"
                  : "text-emerald-900 bg-white border-emerald-950/10"
              }`}
            >
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className={`p-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                isGreen
                  ? "border-emerald-500/30 bg-emerald-900/60 text-white hover:bg-emerald-800"
                  : "border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:hover:bg-white"
              }`}
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className={`p-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                isGreen
                  ? "border-emerald-500/30 bg-emerald-900/60 text-white hover:bg-emerald-800"
                  : "border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:hover:bg-white"
              }`}
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
