import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ className, currentPage, totalPages, onPageChange, ...props }: PaginationProps) {
  return (
    <div className={cn("flex items-center justify-between px-2 py-4", className)} {...props}>
      <div className="text-xs text-gray-500 font-semibold">
        Page <span className="text-gray-900 dark:text-white font-bold">{currentPage}</span> of{" "}
        <span className="text-gray-900 dark:text-white font-bold">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
