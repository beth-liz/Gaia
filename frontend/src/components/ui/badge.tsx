import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-[#e8f4ec] text-[#0b2316] border-[#bfe3c8]",
        emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
        critical: "bg-rose-50 text-rose-700 border-rose-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        info: "bg-sky-50 text-sky-700 border-sky-200",
        neutral: "bg-slate-100 text-slate-700 border-slate-200",
        outline: "bg-white text-slate-700 border-slate-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "critical" && "bg-rose-500",
            variant === "warning" && "bg-amber-500",
            (variant === "default" || variant === "emerald" || !variant) && "bg-emerald-500",
            variant === "info" && "bg-sky-500",
            variant === "neutral" && "bg-slate-400",
            variant === "outline" && "bg-slate-400"
          )}
        />
      )}
      <span>{children}</span>
    </div>
  )
}

export { Badge, badgeVariants }
