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
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  initialRowsPerPage = 10,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialRowsPerPage);

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

  // Pagination Math
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-950/10 shadow-xs overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* Sticky Table Header */}
          <thead className="bg-emerald-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-emerald-950/10 text-[11px] font-extrabold uppercase text-emerald-900 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  className={`py-3.5 px-4 ${col.sortable ? "cursor-pointer select-none hover:bg-emerald-100/60" : ""} ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                    <span>{col.header}</span>
                    {col.sortable && col.accessorKey && (
                      <span className="text-emerald-800">
                        {sortColumn === col.accessorKey ? (
                          sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <span className="opacity-30">↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-emerald-950/5 text-xs font-semibold text-emerald-950">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-emerald-800/60">
                  Loading records...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-emerald-800/60 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-emerald-50/50 transition-colors">
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
        <div className="p-3.5 bg-emerald-50/50 border-t border-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950 font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-emerald-800/70 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg border border-emerald-950/10 bg-white font-bold text-emerald-950 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-emerald-800/70 font-medium pl-2">
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-bold text-emerald-900 bg-white border border-emerald-950/10 rounded-lg">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-emerald-950/10 bg-white text-emerald-950 hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white"
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
