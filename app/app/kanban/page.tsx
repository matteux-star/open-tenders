"use client"

import { useMemo, useState } from "react"
import { CalendarClock, FilePlus2, UserRound } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { TenderDeleteDialog } from "@/components/tender-delete-dialog"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet } from "@/components/ui/sheet"
import {
  type Tender,
  type Profile,
  type TenderDeadline,
  activeTenders,
  deleteTender,
  formatCurrency,
  formatShortCurrency,
  formatDate,
  labelFromValue,
  profileName,
  updateTender,
  useOpenTendersData,
  primaryDeadline,
} from "@/lib/open-tenders-data"
import { buildTenderStageUpdate } from "@/lib/tender-lifecycle"
import { tenderStatusBadgeClass } from "@/lib/status-styles"
import { cn } from "@/lib/utils"

type KanbanColumn = {
  id: string
  label: string
  stage: Tender["stage"]
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "psq", label: "PSQ", stage: "psq" },
  { id: "itt", label: "ITT", stage: "itt" },
  { id: "submitted", label: "Submitted", stage: "submitted" },
  { id: "presentation", label: "Presentation", stage: "presentation" },
  { id: "award", label: "Award", stage: "award" },
]

export default function KanbanPage() {
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
  } = useOpenTendersData()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [editTender, setEditTender] = useState<Tender | null>(null)
  const [deleteTarget, setDeleteTender] = useState<Tender | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatedTenders, setUpdatedTenders] = useState<Record<string, Tender>>(
    {}
  )

  const visibleTenders = useMemo(() => {
    return tenders.map((tender) => {
      const updatedTender = updatedTenders[tender.id]

      if (!updatedTender) return tender

      return new Date(updatedTender.updated_at).getTime() >
        new Date(tender.updated_at).getTime()
        ? updatedTender
        : tender
    })
  }, [tenders, updatedTenders])
  const activeBids = activeTenders(visibleTenders)
  const canEdit =
    currentMember?.role === "admin" || currentMember?.role === "editor"
  const canDelete = currentMember?.role === "admin"

  const handleDragStart = (e: React.DragEvent, tenderId: string) => {
    e.dataTransfer.setData("tenderId", tenderId)
  }

  async function moveTenderToStage(tender: Tender, stage: Tender["stage"]) {
    if (stage === tender.stage) return

    setUpdatingId(tender.id)
    try {
      const updatedTender = await updateTender(
        tender.id,
        buildTenderStageUpdate(tender, stage)
      )
      setUpdatedTenders((current) => ({
        ...current,
        [updatedTender.id]: updatedTender,
      }))
      reload()
    } catch (err) {
      console.error("Failed to update tender stage:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault()
    const tenderId = e.dataTransfer.getData("tenderId")
    if (!tenderId) return

    const tender = visibleTenders.find((t) => t.id === tenderId)
    if (!tender) return

    if (column.stage === tender.stage) return

    await moveTenderToStage(tender, column.stage)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  function handleSavedTender(savedTender: Tender) {
    setUpdatedTenders((current) => ({
      ...current,
      [savedTender.id]: savedTender,
    }))
    setSelectedTender((current) =>
      current?.id === savedTender.id ? savedTender : current
    )
    reload()
  }

  async function handleDeleteTender() {
    if (!deleteTarget || !canDelete) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteTender(deleteTarget)
      setUpdatedTenders((current) => {
        const next = { ...current }
        delete next[deleteTarget.id]
        return next
      })
      setSelectedTender((current) =>
        current?.id === deleteTarget.id ? null : current
      )
      setDeleteTender(null)
      reload()
    } catch (deleteError) {
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete tender."
      )
    } finally {
      setDeleting(false)
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
          activePage="Kanban"
          title="Live tender stages"
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
            {loading && !tenders.length ? (
              <div className="flex h-64 items-center justify-center">
                <p className="animate-pulse text-sm text-muted-foreground">
                  Loading Kanban board...
                </p>
              </div>
            ) : error ? (
              <div className="p-5">
                <Alert variant="destructive">
                  <AlertTitle>Could not load tenders</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="hidden flex-col gap-2 border-b bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between lg:flex">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      {activeBids.length} live bids
                    </Badge>
                    <Badge variant="outline">
                      {KANBAN_COLUMNS.length} stages
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="w-full sm:w-fit"
                    onClick={() => setCreateOpen(true)}
                  >
                    <FilePlus2 className="size-4" aria-hidden="true" />
                    Add tender
                  </Button>
                </div>
                <MobileKanbanBoard
                  tenders={activeBids}
                  profiles={profiles}
                  deadlines={deadlines}
                  updatingId={updatingId}
                  onStageChange={(tender, stage) =>
                    void moveTenderToStage(tender, stage)
                  }
                  onView={(tender) => setSelectedTender(tender)}
                />
                <div className="hidden min-h-0 flex-1 grid-cols-3 gap-2.5 p-3 lg:grid xl:grid-cols-5">
                  {KANBAN_COLUMNS.map((column) => {
                    const columnTenders = activeBids.filter(
                      (tender) => tender.stage === column.stage
                    )
                    const columnValue = columnTenders.reduce(
                      (total, tender) =>
                        total + Number(tender.estimated_value ?? 0),
                      0
                    )

                    return (
                      <div
                        key={column.id}
                        data-stage-column={column.stage}
                        className="flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-md bg-muted/60"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column)}
                      >
                        <div className="border-b border-background/80 px-3 py-3">
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <h3 className="truncate font-heading text-sm font-semibold text-foreground">
                              {column.label}
                            </h3>
                            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {columnTenders.length}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(columnValue)}
                          </p>
                        </div>

                        <ScrollArea className="min-h-0 flex-1">
                          <div className="flex min-h-40 flex-col gap-2 p-2">
                            {columnTenders.map((tender) => (
                              <TenderCard
                                key={tender.id}
                                tender={tender}
                                profiles={profiles}
                                deadlines={deadlines}
                                isUpdating={updatingId === tender.id}
                                onDragStart={(e) =>
                                  handleDragStart(e, tender.id)
                                }
                                onView={() => setSelectedTender(tender)}
                              />
                            ))}
                            {columnTenders.length === 0 && (
                              <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-background/30 text-xs text-muted-foreground italic">
                                Empty
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </AppShell>

        <TenderDetailSheet
          tender={selectedTender}
          deadlines={deadlines}
          contracts={contracts}
          owner={profileName(profiles, selectedTender?.owner_id ?? null)}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            if (selectedTender) setEditTender(selectedTender)
          }}
          onDelete={() => {
            if (selectedTender) setDeleteTender(selectedTender)
          }}
        />
      </Sheet>
      <TenderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organisationId={organisation?.id ?? null}
        currentMember={currentMember}
        profiles={profiles}
        defaultStage="psq"
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
        onSaved={handleSavedTender}
      />
      <TenderDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTender(null)
            setDeleteError(null)
          }
        }}
        tender={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onConfirm={handleDeleteTender}
      />
    </>
  )
}

function MobileKanbanBoard({
  tenders,
  profiles,
  deadlines,
  updatingId,
  onStageChange,
  onView,
}: {
  tenders: Tender[]
  profiles: Profile[]
  deadlines: TenderDeadline[]
  updatingId: string | null
  onStageChange: (tender: Tender, stage: Tender["stage"]) => void
  onView: (tender: Tender) => void
}) {
  const [selectedStage, setSelectedStage] = useState<Tender["stage"]>(
    KANBAN_COLUMNS[0].stage
  )
  const selectedColumn =
    KANBAN_COLUMNS.find((column) => column.stage === selectedStage) ??
    KANBAN_COLUMNS[0]
  const selectedTenders = tenders.filter(
    (tender) => tender.stage === selectedColumn.stage
  )
  const selectedValue = selectedTenders.reduce(
    (total, tender) => total + Number(tender.estimated_value ?? 0),
    0
  )

  return (
    <div className="grid gap-3 p-3 lg:hidden">
      <div
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        aria-label="Kanban stages"
      >
        {KANBAN_COLUMNS.map((column) => {
          const count = tenders.filter(
            (tender) => tender.stage === column.stage
          ).length
          const isActive = column.stage === selectedStage

          return (
            <Button
              key={column.id}
              type="button"
              size="sm"
              variant={isActive ? "secondary" : "outline"}
              className="shrink-0"
              aria-pressed={isActive}
              onClick={() => setSelectedStage(column.stage)}
            >
              {column.label}
              <Badge variant="outline" className="ml-1 h-5 px-1.5">
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      <section className="rounded-md border bg-background shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b p-3">
          <div className="min-w-0">
            <h2 className="truncate font-heading text-sm font-semibold">
              {selectedColumn.label}
            </h2>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(selectedValue)}
            </p>
          </div>
          <Badge variant="outline">{selectedTenders.length}</Badge>
        </div>
        <div className="grid gap-2 p-2">
          {selectedTenders.length ? (
            selectedTenders.map((tender) => (
              <TenderCard
                key={tender.id}
                tender={tender}
                profiles={profiles}
                deadlines={deadlines}
                isUpdating={updatingId === tender.id}
                onStageChange={(stage) => onStageChange(tender, stage)}
                onView={() => onView(tender)}
              />
            ))
          ) : (
            <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/20 text-xs text-muted-foreground italic">
              Empty
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function TenderCard({
  tender,
  profiles,
  deadlines,
  isUpdating,
  onDragStart,
  onStageChange,
  onView,
}: {
  tender: Tender
  profiles: Profile[]
  deadlines: TenderDeadline[]
  isUpdating: boolean
  onDragStart?: (e: React.DragEvent) => void
  onStageChange?: (stage: Tender["stage"]) => void
  onView?: () => void
}) {
  const deadline = primaryDeadline(tender, deadlines)

  return (
    <Card
      draggable={Boolean(onDragStart)}
      data-tender-card={tender.id}
      onDragStart={onDragStart}
      className={cn(
        "tf-kanban-card gap-0 rounded-md border border-border bg-card py-0 shadow-none ring-0 transition-colors hover:border-primary/35 hover:bg-card/95",
        onDragStart && "cursor-grab active:cursor-grabbing",
        isUpdating && "pointer-events-none opacity-50 grayscale"
      )}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge
            className={cn(
              "px-1.5 py-0 text-[10px]",
              tenderStatusBadgeClass(tender.status)
            )}
          >
            {labelFromValue(tender.status)}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground">
            {formatShortCurrency(tender.estimated_value)}
          </span>
        </div>
        <CardTitle className="mt-1.5 text-sm leading-tight">
          <button
            type="button"
            className="line-clamp-2 text-left hover:text-primary"
            onClick={onView}
          >
            {tender.title}
          </button>
        </CardTitle>
        <CardDescription className="line-clamp-1 text-xs">
          {tender.buyer_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CalendarClock className="size-3" />
            <span>{formatDate(deadline)}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <UserRound className="size-3" />
            <span>{profileName(profiles, tender.owner_id)}</span>
          </div>
          {onStageChange ? (
            <Select
              value={tender.stage}
              onValueChange={(value) => onStageChange(value as Tender["stage"])}
            >
              <SelectTrigger
                size="sm"
                className="mt-2 w-full"
                disabled={isUpdating}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {KANBAN_COLUMNS.map((column) => (
                    <SelectItem key={column.id} value={column.stage}>
                      Move to {column.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
