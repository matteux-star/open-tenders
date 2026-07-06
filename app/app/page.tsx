"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  FilePlus2,
  MoreHorizontal,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { TenderDetailSheet } from "@/components/tender-detail-sheet"
import { TenderFormDialog } from "@/components/tender-form-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet } from "@/components/ui/sheet"
import {
  type Tender,
  formatCurrency,
  formatDate,
  formatDateTime,
  labelFromValue,
  profileName,
  updateTender,
  useTenderFlowData,
} from "@/lib/tender-flow-data"
import {
  type DashboardActionItem,
  dashboardCommandCentre,
} from "@/lib/tender-flow-metrics"
import { canUseHealthStatusForStage } from "@/lib/tender-lifecycle"
import { tenderDeadlineClass } from "@/lib/status-styles"
import { cn } from "@/lib/utils"

type AttentionFilter =
  | "all"
  | "overdue"
  | "dueSoon"
  | "blocked"
  | "atRisk"
  | "stale"
  | "highValue"
  | "unassigned"

type AttentionItem = {
  tender: Tender
  ownerName: string
  milestone: DashboardActionItem["milestone"]
  value: number
  badges: string[]
  filters: Set<AttentionFilter>
  primaryReason: string
  priority: number
}

const attentionFilterOptions: Array<{
  id: AttentionFilter
  label: string
  hidden?: (items: AttentionItem[]) => boolean
}> = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "dueSoon", label: "Due soon" },
  { id: "blocked", label: "Blocked" },
  { id: "atRisk", label: "At risk" },
  { id: "stale", label: "Stale" },
  { id: "highValue", label: "High value" },
  {
    id: "unassigned",
    label: "Unassigned",
    hidden: (items) => !items.some((item) => item.filters.has("unassigned")),
  },
]

function deadlineTime(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY

  const time = new Date(value).getTime()

  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

function dashboardBadgeClass(label: string) {
  return cn(
    "border",
    (label === "Blocked" || label === "Overdue") &&
      "border-destructive/25 bg-destructive/10 text-destructive",
    (label === "Urgent" || label === "At risk" || label === "Due soon") &&
      "border-amber-600/25 bg-amber-50 text-amber-700",
    label === "Stale" && "border-border bg-muted text-muted-foreground",
    label === "Unassigned" && "border-sky-600/25 bg-sky-50 text-sky-700",
    label === "High value" && "border-primary/25 bg-primary/10 text-primary"
  )
}

function milestoneState(item: Pick<AttentionItem, "milestone">) {
  const milestone = item.milestone

  if (!milestone) return "normal"
  if (milestone.daysPast !== null) return "overdue"
  if (milestone.daysUntil !== null && milestone.daysUntil <= 2) {
    return "upcoming"
  }

  return "normal"
}

function formatOptionalValue(value: number | null | undefined) {
  const numericValue = Number(value ?? 0)

  return numericValue > 0 ? formatCurrency(numericValue) : null
}

function capitalise(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values))
}

function updatedTime(tender: Tender) {
  const time = tender.updated_at ? new Date(tender.updated_at).getTime() : 0

  return Number.isNaN(time) ? 0 : time
}

function attentionPriority(filters: Set<AttentionFilter>) {
  if (filters.has("overdue")) return 1
  if (filters.has("blocked")) return 2
  if (filters.has("atRisk")) return 3
  if (filters.has("unassigned")) return 4
  if (filters.has("dueSoon")) return 5
  if (filters.has("stale")) return 6
  if (filters.has("highValue")) return 7

  return 99
}

function filterForBadge(badge: string): AttentionFilter | null {
  if (badge === "Overdue") return "overdue"
  if (badge === "Blocked") return "blocked"
  if (badge === "At risk" || badge === "Urgent") return "atRisk"
  if (badge === "Due soon") return "dueSoon"
  if (badge === "Stale") return "stale"
  if (badge === "High value") return "highValue"
  if (badge === "Unassigned") return "unassigned"

  return null
}

function addAttentionSignal(
  items: Map<string, AttentionItem>,
  {
    tender,
    ownerName,
    milestone,
    value,
    badges,
    reason,
    filters,
  }: {
    tender: Tender
    ownerName: string
    milestone?: DashboardActionItem["milestone"]
    value?: number
    badges: string[]
    reason: string
    filters?: AttentionFilter[]
  }
) {
  const existing =
    items.get(tender.id) ??
    ({
      tender,
      ownerName,
      milestone: milestone ?? null,
      value: Number(value ?? tender.estimated_value ?? 0),
      badges: [],
      filters: new Set<AttentionFilter>(),
      primaryReason: reason,
      priority: 99,
    } satisfies AttentionItem)

  existing.ownerName = ownerName
  existing.value = Math.max(existing.value, Number(value ?? 0))
  existing.badges = uniqueValues([...existing.badges, ...badges])

  for (const badge of badges) {
    const filter = filterForBadge(badge)
    if (filter) existing.filters.add(filter)
  }

  for (const filter of filters ?? []) {
    existing.filters.add(filter)
  }

  if (
    milestone &&
    (!existing.milestone ||
      deadlineTime(milestone.date) < deadlineTime(existing.milestone.date))
  ) {
    existing.milestone = milestone
  }

  const nextPriority = attentionPriority(existing.filters)

  if (nextPriority < existing.priority) {
    existing.primaryReason = reason
    existing.priority = nextPriority
  }

  items.set(tender.id, existing)
}

export default function Page() {
  const {
    tenders,
    deadlines,
    contracts,
    profiles,
    members,
    organisation,
    currentMember,
    loading,
    error,
    reload,
  } = useTenderFlowData()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [markingTenderId, setMarkingTenderId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter>("all")
  const [showAllAttention, setShowAllAttention] = useState(false)
  const canEditTenders =
    currentMember?.role === "admin" || currentMember?.role === "editor"
  const now = new Date()
  const dashboard = dashboardCommandCentre(
    tenders,
    deadlines,
    profiles,
    contracts,
    now
  )
  const ownerTenderRows = (() => {
    const tenderCounts = new Map<string, number>()
    let unassignedCount = 0

    for (const tender of dashboard.liveTenders) {
      if (!tender.owner_id) {
        unassignedCount += 1
        continue
      }

      tenderCounts.set(
        tender.owner_id,
        (tenderCounts.get(tender.owner_id) ?? 0) + 1
      )
    }

    const rows = members.map((member) => ({
      id: member.user_id,
      name: profileName(profiles, member.user_id),
      count: tenderCounts.get(member.user_id) ?? 0,
    }))

    rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    if (unassignedCount) {
      rows.push({
        id: "unassigned",
        name: "Unassigned",
        count: unassignedCount,
      })
    }

    return rows
  })()
  const attentionItems = (() => {
    const items = new Map<string, AttentionItem>()
    const priorityGroups = [
      ...dashboard.priorityGroups.critical,
      ...dashboard.priorityGroups.needsUpdate,
      ...dashboard.priorityGroups.atRisk,
      ...dashboard.priorityGroups.stale,
    ]

    for (const item of priorityGroups) {
      const badges = [...item.badges]

      if (
        item.milestone?.daysUntil !== null &&
        item.milestone?.daysUntil !== undefined &&
        item.milestone.daysUntil <= 7
      ) {
        badges.push("Due soon")
      }

      addAttentionSignal(items, {
        tender: item.tender,
        ownerName: item.ownerName,
        milestone: item.milestone,
        value: item.value,
        badges,
        reason: item.reason,
      })
    }

    for (const item of dashboard.upcoming[7].items) {
      addAttentionSignal(items, {
        tender: item.tender,
        ownerName: profileName(profiles, item.tender.owner_id),
        milestone: item.milestone,
        value: Number(item.tender.estimated_value ?? 0),
        badges: ["Due soon"],
        reason: `${capitalise(item.milestone.relativeLabel)}.`,
        filters: ["dueSoon"],
      })
    }

    for (const item of dashboard.valueAtRisk) {
      addAttentionSignal(items, {
        tender: item.tender,
        ownerName: profileName(profiles, item.tender.owner_id),
        milestone: item.milestone,
        value: item.value,
        badges: [item.reason, "High value"],
        reason: `${item.reason} tender with ${formatCurrency(item.value)} value exposure.`,
        filters: ["highValue"],
      })
    }

    for (const tender of dashboard.liveTenders) {
      const ownerName = profileName(profiles, tender.owner_id)
      const value = Number(tender.estimated_value ?? 0)

      if (tender.status === "blocked") {
        addAttentionSignal(items, {
          tender,
          ownerName,
          value,
          badges: ["Blocked"],
          reason: "Blocked tender needs review.",
          filters: ["blocked"],
        })
      }

      if (tender.status === "at_risk" || tender.status === "urgent") {
        addAttentionSignal(items, {
          tender,
          ownerName,
          value,
          badges: ["At risk"],
          reason:
            tender.status === "urgent" ? "Marked urgent." : "Marked at risk.",
          filters: ["atRisk"],
        })
      }

      if (!tender.owner_id) {
        addAttentionSignal(items, {
          tender,
          ownerName,
          value,
          badges: ["Unassigned"],
          reason: "No owner assigned.",
          filters: ["unassigned"],
        })
      }
    }

    return Array.from(items.values())
      .map((item) => ({
        ...item,
        priority: attentionPriority(item.filters),
      }))
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority

        const milestoneDelta =
          deadlineTime(a.milestone?.date) - deadlineTime(b.milestone?.date)

        if (milestoneDelta !== 0) return milestoneDelta
        if (a.value !== b.value) return b.value - a.value

        return updatedTime(b.tender) - updatedTime(a.tender)
      })
  })()
  const visibleFilterOptions = attentionFilterOptions.filter(
    (item) => !item.hidden?.(attentionItems)
  )
  const filteredAttentionItems =
    attentionFilter === "all"
      ? attentionItems
      : attentionItems.filter((item) => item.filters.has(attentionFilter))
  const visibleAttentionItems = showAllAttention
    ? filteredAttentionItems
    : filteredAttentionItems.slice(0, 8)
  const hiddenAttentionCount = Math.max(
    0,
    filteredAttentionItems.length - visibleAttentionItems.length
  )
  const nextMilestoneSummary =
    dashboard.upcoming[7].nextUpcoming ??
    dashboard.upcoming[14].nextUpcoming ??
    dashboard.upcoming[30].nextUpcoming
  const activeOwnerRows = ownerTenderRows.filter(
    (row) => row.id !== "unassigned" && row.count > 0
  )
  const showOperationalSummary =
    Boolean(nextMilestoneSummary) ||
    dashboard.kpis.unassigned.count > 0 ||
    activeOwnerRows.length > 1
  const kpiCards = [
    {
      label: "Live tenders",
      value: String(dashboard.kpis.liveTenders.count),
      detail: "Currently active",
      icon: Target,
      className: "border-primary/20 bg-primary/10 text-primary",
    },
    {
      label: "Overdue",
      value: String(dashboard.kpis.overdue.count),
      detail: `${dashboard.kpis.overdue.count} need action · ${dashboard.kpis.overdue.staleCount} stale`,
      icon: AlertTriangle,
      className: "border-destructive/25 bg-destructive/10 text-destructive",
    },
    {
      label: "Due next 7 days",
      value: String(dashboard.kpis.dueNext7Days.count),
      detail: dashboard.kpis.dueNext7Days.count
        ? "Open milestones"
        : dashboard.kpis.dueNext7Days.nextUpcoming
          ? `Next due: ${formatDate(dashboard.kpis.dueNext7Days.nextUpcoming.milestone.date)}`
          : "No upcoming milestones",
      icon: CalendarClock,
      className: "border-amber-600/25 bg-amber-50 text-amber-700",
    },
    {
      label: "Blocked / at risk",
      value: String(dashboard.kpis.blockedAtRisk.count),
      detail: dashboard.kpis.blockedAtRisk.value
        ? `${formatCurrency(dashboard.kpis.blockedAtRisk.value)} value affected`
        : "Live tenders needing review",
      icon: ShieldAlert,
      className: "border-primary/25 bg-primary/10 text-primary",
    },
    {
      label: "Unassigned",
      value: String(dashboard.kpis.unassigned.count),
      detail: dashboard.kpis.unassigned.count
        ? "Live tenders without owners"
        : "All live tenders owned",
      icon: UserRound,
      className: "border-sky-600/25 bg-sky-50 text-sky-700",
    },
  ]

  async function handleMarkBlocked(tender: Tender) {
    if (!canEditTenders) {
      setActionError("Only admins and editors can update tender status.")
      return
    }

    if (!canUseHealthStatusForStage(tender.stage)) {
      setActionError("This lifecycle stage has a derived status.")
      return
    }

    setMarkingTenderId(tender.id)
    setActionError(null)

    try {
      await updateTender(tender.id, { status: "blocked" })
      reload()
    } catch (markError) {
      setActionError(
        markError instanceof Error
          ? markError.message
          : "Could not mark tender as blocked."
      )
    } finally {
      setMarkingTenderId(null)
    }
  }

  return (
    <>
      <Sheet
        open={Boolean(selectedTender)}
        onOpenChange={(open) => {
          if (!open) setSelectedTender(null)
        }}
      >
        <AppShell
          activePage="Dashboard"
          title="Dashboard"
          showHeader={false}
          workspaceName={organisation?.name ?? null}
          workspaceUserName={profileName(
            profiles,
            currentMember?.user_id ?? null
          )}
          workspaceRole={currentMember?.role ?? null}
          mobileActionSlot={
            <Button
              size="icon-sm"
              aria-label="Add tender"
              onClick={() => setCreateOpen(true)}
            >
              <FilePlus2 className="size-4" aria-hidden="true" />
            </Button>
          }
        >
          <div className="flex flex-col gap-3 p-3 sm:p-4 lg:gap-5 lg:p-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading dashboard...
              </p>
            ) : error ? (
              <Alert variant="destructive">
                <ShieldAlert className="size-4" aria-hidden="true" />
                <AlertTitle>Could not load dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {actionError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Action failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
                ) : null}

                <section className="flex flex-col gap-3 xl:flex-row xl:items-start">
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
                    {kpiCards.map((item) => {
                      const Icon = item.icon

                      return (
                        <Card
                          key={item.label}
                          size="sm"
                          className={cn(
                            "tf-stat-tile gap-1.5 py-2.5 shadow-none sm:gap-4 sm:py-4 [&_[data-slot=card-content]]:px-3 sm:[&_[data-slot=card-content]]:px-4 [&_[data-slot=card-header]]:px-3 sm:[&_[data-slot=card-header]]:px-4",
                            item.className
                          )}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                              <CardDescription className="text-current/75">
                                {item.label}
                              </CardDescription>
                              <Icon
                                className="size-3.5 sm:size-4"
                                aria-hidden="true"
                              />
                            </div>
                            <CardTitle className="text-xl leading-none sm:text-3xl">
                              {item.value}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs font-medium text-current/75">
                              {item.detail}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  <Button
                    className="hidden shrink-0 xl:inline-flex"
                    onClick={() => setCreateOpen(true)}
                  >
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    Add tender
                  </Button>
                </section>

                {dashboard.isEmpty ? (
                  <EmptyWorkspace onCreate={() => setCreateOpen(true)} />
                ) : (
                  <>
                    <Card className="overflow-hidden">
                      <CardHeader className="gap-3 border-b">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <CardTitle>Needs attention</CardTitle>
                            <CardDescription>
                              The live tenders most likely to need action.
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {filteredAttentionItems.length} shown
                          </Badge>
                        </div>
                        <div
                          className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                          aria-label="Needs attention filters"
                        >
                          {visibleFilterOptions.map((item) => (
                            <Button
                              key={item.id}
                              size="sm"
                              variant={
                                attentionFilter === item.id
                                  ? "secondary"
                                  : "outline"
                              }
                              aria-pressed={attentionFilter === item.id}
                              className="shrink-0"
                              onClick={() => {
                                setAttentionFilter(item.id)
                                setShowAllAttention(false)
                              }}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {visibleAttentionItems.length ? (
                          <>
                            <div className="divide-y">
                              {visibleAttentionItems.map((item) => (
                                <AttentionRow
                                  key={item.tender.id}
                                  item={item}
                                  canEditTenders={canEditTenders}
                                  markingTenderId={markingTenderId}
                                  onView={() => setSelectedTender(item.tender)}
                                  onMarkBlocked={() =>
                                    void handleMarkBlocked(item.tender)
                                  }
                                />
                              ))}
                            </div>
                            <div className="flex flex-col gap-2 border-t bg-muted/15 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                              {hiddenAttentionCount ? (
                                <p className="text-muted-foreground">
                                  {hiddenAttentionCount} more attention items
                                  hidden.
                                </p>
                              ) : (
                                <p className="text-muted-foreground">
                                  Showing all matching attention items.
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                {hiddenAttentionCount ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAllAttention(true)}
                                  >
                                    View all
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  render={<a href="/app/tenders" />}
                                >
                                  View all tenders
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-4 text-sm">
                            <p className="font-medium">
                              No live tenders need attention.
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              Overdue, blocked, at-risk, stale, high-value, and
                              due-soon tenders will appear here.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {showOperationalSummary ? (
                      <Card size="sm">
                        <CardHeader className="border-b">
                          <CardTitle>Operational summary</CardTitle>
                          <CardDescription>
                            A compact readout for assignment and the next
                            milestone.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                          <div className="rounded-lg border bg-muted/15 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Assignment
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {dashboard.kpis.unassigned.count
                                ? `${dashboard.kpis.unassigned.count} unassigned`
                                : "All live tenders assigned"}
                            </p>
                          </div>
                          {nextMilestoneSummary ? (
                            <div className="rounded-lg border bg-muted/15 p-3 md:col-span-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Next milestone
                              </p>
                              <Button
                                variant="link"
                                className="mt-1 h-auto max-w-full justify-start truncate p-0 text-left text-sm font-medium"
                                onClick={() =>
                                  setSelectedTender(nextMilestoneSummary.tender)
                                }
                              >
                                {nextMilestoneSummary.tender.title}
                              </Button>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {nextMilestoneSummary.milestone.label} ·{" "}
                                {formatDate(
                                  nextMilestoneSummary.milestone.date
                                )}{" "}
                                · {nextMilestoneSummary.milestone.relativeLabel}
                              </p>
                            </div>
                          ) : null}
                          {activeOwnerRows.length > 1 ? (
                            <div className="rounded-lg border bg-muted/15 p-3 md:col-span-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Team workload
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {activeOwnerRows.slice(0, 4).map((owner) => (
                                  <Badge key={owner.id} variant="secondary">
                                    {owner.name}: {owner.count}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                )}
              </>
            )}
          </div>
        </AppShell>

        <TenderDetailSheet
          tender={selectedTender}
          deadlines={deadlines}
          contracts={contracts}
          owner={profileName(profiles, selectedTender?.owner_id ?? null)}
        />
      </Sheet>
      <TenderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organisationId={organisation?.id ?? null}
        currentMember={currentMember}
        profiles={profiles}
        onCreated={reload}
      />
    </>
  )
}

function AttentionRow({
  item,
  canEditTenders,
  markingTenderId,
  onView,
  onMarkBlocked,
}: {
  item: AttentionItem
  canEditTenders: boolean
  markingTenderId: string | null
  onView: () => void
  onMarkBlocked: () => void
}) {
  const value = formatOptionalValue(item.value)

  return (
    <article className="tf-row-lift grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="link"
            className="h-auto max-w-full justify-start truncate p-0 text-left text-sm font-medium"
            onClick={onView}
          >
            {item.tender.title}
          </Button>
          {item.badges.map((badge) => (
            <Badge key={badge} className={dashboardBadgeClass(badge)}>
              {badge}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{item.tender.buyer_name}</span>
          <span>{labelFromValue(item.tender.stage)}</span>
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3" aria-hidden="true" />
            {item.ownerName}
          </span>
          {value ? <span>{value}</span> : null}
        </div>
        <div className="space-y-1 text-xs">
          {item.milestone ? (
            <p
              className={cn(
                "flex flex-wrap gap-x-2 gap-y-1",
                tenderDeadlineClass(milestoneState(item))
              )}
            >
              <span>{item.milestone.label}</span>
              <span>{formatDateTime(item.milestone.date)}</span>
              <span>{item.milestone.relativeLabel}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">No open milestone recorded.</p>
          )}
          <p className="text-muted-foreground">Reason: {item.primaryReason}</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open tender actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onView}>View tender</DropdownMenuItem>
          </DropdownMenuGroup>
          {canEditTenders &&
          item.tender.status !== "blocked" &&
          canUseHealthStatusForStage(item.tender.stage) ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={markingTenderId === item.tender.id}
                  onClick={onMarkBlocked}
                >
                  {markingTenderId === item.tender.id
                    ? "Marking..."
                    : "Mark as blocked"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}

function EmptyWorkspace({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
        <div>
          <p className="font-heading text-base font-medium">
            No live tenders yet
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Add your first tender to start tracking deadlines, ownership, and
            blockers.
          </p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <FilePlus2 className="size-4" aria-hidden="true" />
          Add tender
        </Button>
      </CardContent>
    </Card>
  )
}
