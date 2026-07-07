import type { Tender } from "@/lib/open-tenders-data"
import { cn } from "@/lib/utils"

export function tenderStatusBadgeClass(status: Tender["status"]) {
  return cn(
    "border",
    status === "on_track" &&
      "border-emerald-600/20 bg-emerald-50 text-emerald-700",
    status === "submitted" && "border-sky-600/20 bg-sky-50 text-sky-700",
    status === "awaiting_result" &&
      "border-primary/25 bg-primary/10 text-primary",
    status === "closed" && "border-border bg-muted text-muted-foreground",
    status === "blocked" &&
      "border-destructive/25 bg-destructive/10 text-destructive",
    status === "urgent" && "border-amber-600/25 bg-amber-50 text-amber-700",
    status === "at_risk" && "border-orange-600/25 bg-orange-50 text-orange-700"
  )
}

export function tenderRiskIndicatorClass(status: Tender["status"]) {
  return cn(
    "h-full w-1 rounded-full bg-transparent",
    status === "blocked" && "bg-destructive",
    status === "urgent" && "bg-amber-500",
    status === "at_risk" && "bg-orange-500"
  )
}

export function tenderDeadlineClass(state: string) {
  if (state === "overdue") return "text-destructive"
  if (state === "upcoming") return "text-amber-700"
  return "text-muted-foreground"
}
