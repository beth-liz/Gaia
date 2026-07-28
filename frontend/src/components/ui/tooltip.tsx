import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  children: React.ReactNode
}

export function Tooltip({ className, content, children, ...props }: TooltipProps) {
  return (
    <div className="relative group inline-block" {...props}>
      {children}
      <div
        className={cn(
          "absolute z-50 scale-0 group-hover:scale-100 transition-all duration-150 origin-bottom bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap pointer-events-none",
          className
        )}
      >
        {content}
      </div>
    </div>
  )
}
