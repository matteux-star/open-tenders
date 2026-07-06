"use client"

import {
  Bell,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type Contract,
  type Tender,
  type TenderDeadline,
  formatCurrency,
  formatDate,
  formatDateTime,
  labelFromValue,
  primaryDeadline,
} from "@/lib/tender-flow-data"
import {
  tenderDeadlineClass,
  tenderStatusBadgeClass,
} from "@/lib/status-styles"
import { cn } from "@/lib/utils"

function deadlineState(value: string | null | undefined) {
  if (!value) return "normal"

  const due = new Date(value).getTime()
  const now = Date.now()
  const twoDays = 1000 * 60 * 60 * 24 * 2

  if (due < now) return "overdue"
  if (due - now <= twoDays) return "upcoming"
  return "normal"
}

export function TenderDetailSheet({
  tender,
  deadlines,
  contracts,
  owner,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: {
  tender: Tender | null
  deadlines: TenderDeadline[]
  contracts: Contract[]
  owner: string
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  if (!tender) return null

  const tenderDeadlines = deadlines.filter(
    (deadline) => deadline.tender_id === tender.id
  )
  const sortedTenderDeadlines = [...tenderDeadlines].sort(
    (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  )
  const primaryTenderDeadline = primaryDeadline(tender, deadlines)
  const primaryTenderDeadlineState = deadlineState(primaryTenderDeadline)
  const relatedContract = contracts.find(
    (contract) =>
      contract.tender_id === tender.id ||
      contract.contract_name
        .toLowerCase()
        .includes(tender.title.toLowerCase()) ||
      tender.title.toLowerCase().includes(contract.client_name.toLowerCase())
  )

  return (
    <SheetContent className="sm:max-w-xl">
      <SheetHeader>
        <div className="flex flex-wrap gap-2 pr-8">
          <Badge variant="secondary">{labelFromValue(tender.stage)}</Badge>
          <Badge className={tenderStatusBadgeClass(tender.status)}>
            {labelFromValue(tender.status)}
          </Badge>
        </div>
        <SheetTitle>{tender.title}</SheetTitle>
        <SheetDescription className="flex flex-wrap gap-x-2 gap-y-1">
          <span>{tender.id.slice(0, 8)}</span>
          <span aria-hidden="true">-</span>
          <span>{tender.buyer_name}</span>
        </SheetDescription>
      </SheetHeader>

      {canEdit || canDelete ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-background/80 px-5 py-3 backdrop-blur">
          {canEdit ? (
            <Button size="sm" onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          ) : null}
          {canDelete ? (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label="Contract value"
              value={formatCurrency(tender.estimated_value)}
              icon={CircleDollarSign}
            />
            <DetailItem
              label="Next deadline"
              value={formatDateTime(primaryTenderDeadline)}
              icon={CalendarClock}
              valueClassName={tenderDeadlineClass(primaryTenderDeadlineState)}
            />
            <DetailItem label="Lead bid manager" value={owner} icon={UserRound} />
            <DetailItem
              label="Last updated"
              value={formatDateTime(tender.updated_at)}
              icon={Clock3}
            />
          </div>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm font-semibold">
                  Key dates timeline
                </h2>
                <p className="text-xs text-muted-foreground">
                  These dates drive calendar visibility and reminder delivery.
                </p>
              </div>
              <Badge variant="outline">{sortedTenderDeadlines.length}</Badge>
            </div>
            <div className="space-y-2">
              {sortedTenderDeadlines.length ? (
                sortedTenderDeadlines.map((date) => {
                  const state = deadlineState(date.due_at)

                  return (
                    <div
                      key={date.id}
                      className="grid gap-2 rounded-lg border bg-muted/15 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {date.title}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-sm",
                              tenderDeadlineClass(state)
                            )}
                          >
                            {formatDateTime(date.due_at)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {labelFromValue(date.deadline_type)}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="rounded-lg border border-dashed bg-muted/15 p-3 text-sm text-muted-foreground">
                  No key dates tracked yet.
                </p>
              )}
            </div>
          </section>

          <Separator />

          <section className="rounded-lg border bg-primary/5 p-3">
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bell className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-semibold">
                  Reminder context
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Deadline reminders are generated from the key dates above.
                  Organisation name, tender title, deadline, type, due date, and
                  link are included in Telegram and email notifications.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-medium">
                Renewal information
              </h2>
              {relatedContract ? (
                <Badge className="border-primary/25 bg-primary/10 text-primary">
                  {labelFromValue(relatedContract.status)}
                </Badge>
              ) : null}
            </div>
            {relatedContract ? (
              <div className="grid gap-3 rounded-lg border bg-muted/15 p-3 sm:grid-cols-2">
                <DetailItem
                  label="Renewal due date"
                  value={formatDate(relatedContract.end_date)}
                />
                <DetailItem
                  label="Renewal window"
                  value={formatDate(relatedContract.renewal_window_start)}
                />
              </div>
            ) : (
              <p className="rounded-lg border bg-muted/15 p-3 text-sm text-muted-foreground">
                No renewal information is currently tracked for this tender.
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="font-heading text-sm font-medium">Internal notes</h2>
            <p className="rounded-lg border bg-muted/15 p-3 text-sm text-muted-foreground">
              {tender.notes ?? "No notes yet."}
            </p>
          </section>
        </div>
      </ScrollArea>
    </SheetContent>
  )
}

function DetailItem({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string
  value: string
  icon?: typeof CalendarClock
  valueClassName?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<div className="rounded-lg border bg-muted/15 p-3" />}
      >
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
          {label}
        </p>
        <p className={cn("mt-1 truncate text-sm font-medium", valueClassName)}>
          {value}
        </p>
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  )
}
