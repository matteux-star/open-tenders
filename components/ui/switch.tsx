import * as React from "react"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <span
      data-slot="switch"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full",
        className
      )}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span className="absolute inset-0 rounded-full border border-input bg-muted shadow-xs transition-colors peer-checked:bg-primary peer-disabled:opacity-50 peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 dark:bg-input/30" />
      <span className="pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-4 peer-disabled:opacity-80" />
    </span>
  )
}

export { Switch }
