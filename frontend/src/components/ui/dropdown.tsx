import * as React from "react"
import { cn } from "@/lib/utils"

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  align?: "left" | "right"
}

export function Dropdown({ className, trigger, children, isOpen, setIsOpen, align = "right", ...props }: DropdownProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen])

  return (
    <div className="relative inline-block text-left" ref={ref} {...props}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-56 rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-lg focus:outline-none z-50 animate-in fade-in-0 zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  className,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
