import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback: string
  src?: string
  alt?: string
}

export function Avatar({ className, fallback, src, alt, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-gray-50 dark:bg-zinc-800 items-center justify-center font-extrabold text-xs text-primary select-none",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <span className="uppercase">{fallback}</span>
      )}
    </div>
  )
}
