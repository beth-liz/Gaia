import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (val: string) => void
}

export const SearchBox = React.forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ className, onSearchChange, ...props }, ref) => {
    return (
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          className={cn(
            "w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs font-semibold shadow-xs transition-all duration-300 placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10",
            className
          )}
          onChange={(e) => onSearchChange?.(e.target.value)}
          {...props}
        />
      </div>
    )
  }
)
SearchBox.displayName = "SearchBox"
