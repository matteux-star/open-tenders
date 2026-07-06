"use client"

import { useMemo, useState } from "react"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePlus2,
  RotateCcw,
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
import { Sheet } from "@/components/ui/sheet"
import {
  type CalendarDeadlineEvent,
  calendarDayKey,
  calendarDeadlineEvents,
  calendarEventsForDay,
  calendarMonthDays,
} from "@/lib/tender-flow-metrics"
import {
  type Profile,
  type Tender,
  formatDate,
  formatDateTime,
  labelFromValue,
  profileName,
  useTenderFlowData,
} from "@/lib/tender-flow-data"
import { tenderStatusBadgeClass } from "@/lib/status-styles"
import { cn } from "@/lib/utils"

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const overflowTemplate = "+N more"

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function moveMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function calendarEventToneClass(tone: CalendarDeadlineEvent["tone"]) {
  return cn(
    "border",
    tone === "sky" && "border-sky-600/20 bg-sky-50 text-sky-700",
    tone === "primary" && "border-primary/25 bg-primary/10 text-primary",
    tone === "amber" && "border-amber-600/25 bg-amber-50 text-amber-700"
  )
}

export default function CalendarPage() {
  const {
    tenders,
    deadlines,
    contracts,
    profiles,
    organisation,
    currentMember,
    loading,
    error,
    reload,
  } = useTenderFlowData()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [editTender, setEditTender] = useState<Tender | null>(null)
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const now = useMemo(() => new Date(), [])
  const canEditTenders =
    currentMember?.role === "admin" || currentMember?.role === "editor"

  const calendarEvents = useMemo(
    () => calendarDeadlineEvents(tenders),
    [tenders]
  )
  const monthDays = useMemo(
    () => calendarMonthDays(calendarEvents, monthDate, now),
    [calendarEvents, monthDate, now]
  )
  const selectedDayEvents = useMemo(
    () => calendarEventsForDay(calendarEvents, selectedDate),
    [calendarEvents, selectedDate]
  )
  const selectedDayKey = useMemo(
    () => calendarDayKey(selectedDate),
    [selectedDate]
  )
  const monthEventCount = monthDays
    .filter((day) => day.inCurrentMonth)
    .reduce((count, day) => count + day.events.length, 0)

  function openTender(event: CalendarDeadlineEvent) {
    setSelectedTender(event.tender)
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
          activePage="Calendar"
          title="Calendar"
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
          <div className="flex flex-col gap-3 overflow-x-clip p-3 sm:p-4 lg:gap-5 lg:p-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading tender calendar...
              </p>
            ) : error ? (
              <Alert variant="destructive">
                <CalendarClock className="size-4" aria-hidden="true" />
                <AlertTitle>Could not load calendar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="border-b px-3 py-3 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <CardTitle>{monthLabel(monthDate)}</CardTitle>
                      <CardDescription>
                        {monthEventCount
                          ? `${monthEventCount} live tender deadline${
                              monthEventCount === 1 ? "" : "s"
                            } this month.`
                          : "No live tender deadlines this month."}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="max-sm:hidden"
                        onClick={() => setCreateOpen(true)}
                      >
                        <FilePlus2 className="size-4" aria-hidden="true" />
                        Add tender
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label="Previous month"
                        onClick={() => {
                          const previousMonth = moveMonth(monthDate, -1)

                          setMonthDate(previousMonth)
                          setSelectedDate(previousMonth)
                        }}
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const today = new Date()

                          setMonthDate(startOfMonth(today))
                          setSelectedDate(today)
                        }}
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Today
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label="Next month"
                        onClick={() => {
                          const nextMonth = moveMonth(monthDate, 1)

                          setMonthDate(nextMonth)
                          setSelectedDate(nextMonth)
                        }}
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 border-b bg-muted/25 text-center text-xs font-medium text-muted-foreground">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="px-1 py-2">
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {monthDays.map((day) => (
                      <CalendarDayCell
                        key={day.dayKey}
                        day={day}
                        selected={day.dayKey === selectedDayKey}
                        onSelect={() => setSelectedDate(day.date)}
                        onOpenTender={openTender}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <SelectedDayAgenda
                date={selectedDate}
                events={selectedDayEvents}
                profiles={profiles}
                onOpenTender={openTender}
              />
            </section>
          </div>
        </AppShell>

        <TenderDetailSheet
          tender={selectedTender}
          deadlines={deadlines}
          contracts={contracts}
          owner={profileName(profiles, selectedTender?.owner_id ?? null)}
          canEdit={canEditTenders}
          onEdit={() => {
            if (selectedTender) setEditTender(selectedTender)
          }}
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
      <TenderFormDialog
        open={Boolean(editTender)}
        onOpenChange={(open) => {
          if (!open) setEditTender(null)
        }}
        organisationId={organisation?.id ?? null}
        currentMember={currentMember}
        profiles={profiles}
        tender={editTender}
        onSaved={(savedTender) => {
          setSelectedTender(savedTender)
          reload()
        }}
      />
    </>
  )
}

function CalendarDayCell({
  day,
  selected,
  onSelect,
  onOpenTender,
}: {
  day: ReturnType<typeof calendarMonthDays>[number]
  selected: boolean
  onSelect: () => void
  onOpenTender: (event: CalendarDeadlineEvent) => void
}) {
  const desktopOverflowCount = Math.max(day.events.length - 3, 0)
  const mobileOverflowCount = Math.max(day.events.length - 2, 0)

  return (
    <div
      data-selected={selected ? "true" : "false"}
      className={cn(
        "min-h-20 min-w-0 border-r border-b p-1 transition-colors sm:min-h-32 sm:p-2",
        "data-[selected=true]:bg-primary/5",
        !day.inCurrentMonth && "bg-muted/15 text-muted-foreground"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <Button
          size="icon-sm"
          variant={selected ? "default" : "ghost"}
          className={cn(
            "size-7 text-xs",
            day.isToday && !selected && "border border-primary/30 text-primary"
          )}
          aria-label={`Select ${formatDate(day.date.toISOString())}`}
          onClick={onSelect}
        >
          {day.date.getDate()}
        </Button>
        {day.events.length ? (
          <span className="text-[10px] font-medium text-muted-foreground">
            {day.events.length}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex min-w-0 flex-col gap-1 max-[380px]:hidden">
        {day.events.slice(0, 3).map((event, index) => (
          <button
            key={event.id}
            className={cn(
              "inline-flex h-5 max-w-full items-center rounded-full px-2 text-left text-[11px] leading-none transition-colors outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50",
              calendarEventToneClass(event.tone),
              index >= 2 && "max-sm:hidden"
            )}
            title={event.label}
            onClick={() => onOpenTender(event)}
          >
            <span className="truncate">{event.label}</span>
          </button>
        ))}

        {mobileOverflowCount ? (
          <button
            className="inline-flex h-5 max-w-full items-center rounded-full border border-border px-2 text-left text-[11px] leading-none text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:hidden"
            aria-label={`${overflowTemplate}: ${mobileOverflowCount} additional deadlines on ${formatDate(
              day.date.toISOString()
            )}`}
            onClick={onSelect}
          >
            +{mobileOverflowCount} more
          </button>
        ) : null}

        {desktopOverflowCount ? (
          <button
            className="hidden h-5 max-w-full items-center rounded-full border border-border px-2 text-left text-[11px] leading-none text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:inline-flex"
            aria-label={`${overflowTemplate}: ${desktopOverflowCount} additional deadlines on ${formatDate(
              day.date.toISOString()
            )}`}
            onClick={onSelect}
          >
            +{desktopOverflowCount} more
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SelectedDayAgenda({
  date,
  events,
  profiles,
  onOpenTender,
}: {
  date: Date
  events: CalendarDeadlineEvent[]
  profiles: Profile[]
  onOpenTender: (event: CalendarDeadlineEvent) => void
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <CardTitle>Selected day</CardTitle>
        <CardDescription>
          {formatDate(date.toISOString())} - {events.length} deadline
          {events.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {events.length ? (
          <div className="divide-y">
            {events.map((event) => (
              <button
                key={event.id}
                className="grid w-full gap-2 p-4 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={() => onOpenTender(event)}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {event.label}
                  </span>
                  <Badge className={calendarEventToneClass(event.tone)}>
                    {labelFromValue(event.eventType)}
                  </Badge>
                  <Badge className={tenderStatusBadgeClass(event.status)}>
                    {labelFromValue(event.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{event.buyerName}</span>
                  <span>{labelFromValue(event.stage)}</span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3" aria-hidden="true" />
                    {profileName(profiles, event.ownerId)}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  <Clock3 className="size-3" aria-hidden="true" />
                  {formatDateTime(event.date.toISOString())}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No live tender deadlines on this day.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
