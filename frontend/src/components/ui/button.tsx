import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0b2316] text-white hover:bg-[#123c27] shadow-sm hover:shadow-md border border-[#0b2316]",
        emerald:
          "bg-[#10b981] text-white hover:bg-[#059669] shadow-sm hover:shadow-emerald-500/20 border border-[#10b981]",
        secondary:
          "bg-[#e8f4ec] text-[#0b2316] hover:bg-[#d5ebd9] border border-[#c3e3ca]",
        outline:
          "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-xs",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 border border-amber-500 shadow-xs",
        link: "text-[#10b981] underline-offset-4 hover:underline p-0 h-auto font-bold"
      },
      size: {
        default: "h-10 px-4 py-2 text-xs",
        sm: "h-8 px-3 py-1 text-[11px]",
        lg: "h-11 px-6 py-2.5 text-sm rounded-2xl",
        icon: "h-9 w-9 p-0 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
