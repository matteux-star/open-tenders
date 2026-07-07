"use client"

import { useMemo, useState } from "react"
import {
  CalendarClock,
  ChevronDown,
  FilePlus2,
  MoreHorizontal,
  Search,
} from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { TenderBulkDeleteDialog } from "@/components/tender-bulk-delete-dialog"
import { TenderDeleteDialog } from "@/components/tender-delete-dialog"
import { TenderDetailSheet } from "@/components/tender-detail-sheet"
import { TenderFormDialog } from "@/components/tender-form-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type Contract,
  type Tender,
  activeTenders,
  deleteTender,
  deleteTenders,
  formatCurrency,
  formatDateTime,
  labelFromValue,
  primaryDeadline,
  profileName,
  useOpenTendersData,
} from "@/lib/open-tenders-data"
import {
  PRICE_RANGE_MIN,
  PRICE_RANGE_STEP,
  type PriceRange,
  contractValueSliderMax,
  formatPriceRangeLabel,
  isDefaultPriceRange,
  normalizePriceRange,
  tenderValueInPriceRange,
} from "@/lib/tender-price-range"
import {
  hasReachedSubmission,
  tenderHealthStatuses,
} from "@/lib/tender-lifecycle"
import {
  tenderDeadlineClass,
  tenderStatusBadgeClass,
} from "@/lib/status-styles"
import { cn } from "@/lib/utils"

const allOption = "All"

type TenderQuickView =
  | "all"
  | "active"
  | "dueSoon"
  | "atRisk"
  | "blocked"
  | "renewalWatch"

type TenderNotice = {
  message: string
  variant: "success" | "error"
}

function deadlineState(value: string | null | undefined) {
  if (!value) return "normal"

  const due = new Date(value).getTime()
  const now = Date.now()
  const twoDays = 1000 * 60 * 60 * 24 * 2

  if (due < now) return "overdue"
  if (due - now <= twoDays) return "upcoming"
  return "normal"
}

function selectOptions(values: string[]) {
  return [allOption, ...values]
}

function contractMatchesTender(contract: Contract, tender: Tender) {
  const tenderTitle = tender.title.toLowerCase()
  const contractName = contract.contract_name.toLowerCase()
  const clientName = contract.client_name.toLowerCase()
  const hasTenderTitle = tenderTitle.length > 0

  return (
    contract.tender_id === tender.id ||
    (hasTenderTitle &&
      contractName.length > 0 &&
      contractName.includes(tenderTitle)) ||
    (clientName.length > 0 && tenderTitle.includes(clientName))
  )
}

function isTenderOnRenewalWatch(tender: Tender, contracts: Contract[]) {
  return contracts.some(
    (contract) =>
      contract.status === "renewal_watch" &&
      contractMatchesTender(contract, tender)
  )
}

export default function TendersPage() {
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
  const [quickView, setQuickView] = useState<TenderQuickView>("all")
  const [health, setHealth] = useState(allOption)
  const [stage, setStage] = useState(allOption)
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null)
  const [deadline, setDeadline] = useState(allOption)
  const [owner, setOwner] = useState(allOption)
  const [query, setQuery] = useState("")
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [editTender, setEditTender] = useState<Tender | null>(null)
  const [deleteTarget, setDeleteTender] = useState<Tender | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedTenderIds, setSelectedTenderIds] = useState<Set<string>>(
    () => new Set()
  )
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState("")
  const [notice, setNotice] = useState<TenderNotice | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const contractValueMax = useMemo(
    () =>
      contractValueSliderMax(tenders.map((tender) => tender.estimated_value)),
    [tenders]
  )
  const selectedPriceRange = useMemo(
    () =>
      normalizePriceRange(
        priceRange ?? [PRICE_RANGE_MIN, contractValueMax],
        contractValueMax
      ),
    [contractValueMax, priceRange]
  )
  const activePriceRange =
    priceRange && !isDefaultPriceRange(selectedPriceRange, contractValueMax)
      ? selectedPriceRange
      : null
  const activeTenderList = useMemo(() => activeTenders(tenders), [tenders])
  const activeTenderIds = useMemo(
    () => new Set(activeTenderList.map((tender) => tender.id)),
    [activeTenderList]
  )
  const quickViewMetrics = useMemo(
    () => [
      {
        label: "All",
        value: "all" as const,
        count: tenders.length,
      },
      {
        label: "Active",
        value: "active" as const,
        count: activeTenderList.length,
      },
      {
        label: "Due soon",
        value: "dueSoon" as const,
        count: activeTenderList.filter(
          (tender) =>
            deadlineState(primaryDeadline(tender, deadlines)) === "upcoming"
        ).length,
      },
      {
        label: "At risk",
        value: "atRisk" as const,
        count: activeTenderList.filter((tender) => tender.status === "at_risk")
          .length,
      },
      {
        label: "Blocked",
        value: "blocked" as const,
        count: activeTenderList.filter((tender) => tender.status === "blocked")
          .length,
      },
      {
        label: "Renewal watch",
        value: "renewalWatch" as const,
        count: tenders.filter((tender) =>
          isTenderOnRenewalWatch(tender, contracts)
        ).length,
      },
    ],
    [activeTenderList, contracts, deadlines, tenders]
  )

  const filteredTenders = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()

    return tenders.filter((tender) => {
      const tenderDeadline = primaryDeadline(tender, deadlines)
      const state = deadlineState(tenderDeadline)
      const isActive = activeTenderIds.has(tender.id)
      const isRenewalWatch = isTenderOnRenewalWatch(tender, contracts)

      const matchesSearch =
        !searchTerm ||
        tender.id.toLowerCase().includes(searchTerm) ||
        tender.title.toLowerCase().includes(searchTerm) ||
        tender.buyer_name.toLowerCase().includes(searchTerm)
      const matchesQuickView =
        quickView === "all" ||
        (quickView === "active" && isActive) ||
        (quickView === "dueSoon" && isActive && state === "upcoming") ||
        (quickView === "atRisk" && isActive && tender.status === "at_risk") ||
        (quickView === "blocked" && isActive && tender.status === "blocked") ||
        (quickView === "renewalWatch" && isRenewalWatch)
      const matchesHealth = health === allOption || tender.status === health
      const matchesStage = stage === allOption || tender.stage === stage
      const matchesValue =
        !activePriceRange ||
        tenderValueInPriceRange(tender.estimated_value, activePriceRange)
      const matchesDeadline =
        deadline === allOption ||
        (deadline === "Upcoming" && state === "upcoming") ||
        (deadline === "Overdue" && state === "overdue") ||
        (deadline === "Submitted" && hasReachedSubmission(tender))
      const matchesOwner =
        owner === allOption ||
        (owner === "unassigned" && !tender.owner_id) ||
        tender.owner_id === owner

      return (
        matchesSearch &&
        matchesQuickView &&
        matchesHealth &&
        matchesStage &&
        matchesValue &&
        matchesDeadline &&
        matchesOwner
      )
    })
  }, [
    activeTenderIds,
    contracts,
    activePriceRange,
    deadline,
    deadlines,
    health,
    owner,
    query,
    quickView,
    stage,
    tenders,
  ])

  const hasFilters =
    quickView !== "all" ||
    health !== allOption ||
    stage !== allOption ||
    Boolean(activePriceRange) ||
    deadline !== allOption ||
    owner !== allOption ||
    query.trim().length > 0
  const ownerOptions = (() => {
    const ownerIds = new Set<string>()
    let hasUnassigned = false

    for (const tender of tenders) {
      if (tender.owner_id) {
        ownerIds.add(tender.owner_id)
      } else {
        hasUnassigned = true
      }
    }

    const sortedOwnerIds = [...ownerIds].sort((a, b) =>
      profileName(profiles, a).localeCompare(profileName(profiles, b))
    )

    return hasUnassigned ? ["unassigned", ...sortedOwnerIds] : sortedOwnerIds
  })()
  const canEdit =
    currentMember?.role === "admin" || currentMember?.role === "editor"
  const canDelete = currentMember?.role === "admin"
  const currentTenderIds = useMemo(
    () => new Set(tenders.map((tender) => tender.id)),
    [tenders]
  )
  const visibleTenderIds = useMemo(
    () => filteredTenders.map((tender) => tender.id),
    [filteredTenders]
  )
  const validSelectedTenderIds = useMemo(() => {
    const next = new Set<string>()

    for (const tenderId of selectedTenderIds) {
      if (currentTenderIds.has(tenderId)) {
        next.add(tenderId)
      }
    }

    return next
  }, [currentTenderIds, selectedTenderIds])
  const selectedTenders = useMemo(
    () =>
      filteredTenders.filter((tender) =>
        validSelectedTenderIds.has(tender.id)
      ),
    [filteredTenders, validSelectedTenderIds]
  )
  const selectedTenderCount = selectedTenders.length
  const liveSelectedTenderCount = selectedTenders.filter((tender) =>
    activeTenderIds.has(tender.id)
  ).length
  const selectedTenderNames = selectedTenders
    .slice(0, 5)
    .map((tender) => tender.title)
  const requiresBulkDeleteTypedConfirmation =
    selectedTenderCount >= 5 || liveSelectedTenderCount > 0
  const allVisibleSelected =
    visibleTenderIds.length > 0 &&
    visibleTenderIds.every((id) => validSelectedTenderIds.has(id))
  const someVisibleSelected =
    visibleTenderIds.some((id) => validSelectedTenderIds.has(id)) &&
    !allVisibleSelected

  function clearSelection() {
    setSelectedTenderIds(new Set())
    setBulkDeleteError(null)
    setBulkDeleteConfirmation("")
  }

  function showNotice(nextNotice: TenderNotice) {
    setNotice(nextNotice)

    if (typeof window === "undefined") return

    window.setTimeout(() => {
      setNotice(null)
    }, 4200)
  }

  function clearSelectionForScopeChange() {
    if (validSelectedTenderIds.size === 0) return

    clearSelection()
    setBulkDeleteOpen(false)
  }

  function handleQuickViewChange(value: string) {
    clearSelectionForScopeChange()
    setQuickView(value as TenderQuickView)
  }

  function handleSearchChange(value: string) {
    clearSelectionForScopeChange()
    setQuery(value)
  }

  function handleHealthChange(value: string) {
    clearSelectionForScopeChange()
    setHealth(value)
  }

  function handleStageChange(value: string) {
    clearSelectionForScopeChange()
    setStage(value)
  }

  function handlePriceRangeChange(nextRange: PriceRange) {
    clearSelectionForScopeChange()
    setPriceRange(
      isDefaultPriceRange(nextRange, contractValueMax) ? null : nextRange
    )
  }

  function handlePriceRangeReset() {
    clearSelectionForScopeChange()
    setPriceRange(null)
  }

  function handleDeadlineChange(value: string) {
    clearSelectionForScopeChange()
    setDeadline(value)
  }

  function handleOwnerChange(value: string) {
    clearSelectionForScopeChange()
    setOwner(value)
  }

  function setTenderSelected(tenderId: string, selected: boolean) {
    setSelectedTenderIds((current) => {
      const next = new Set(
        [...current].filter((selectedTenderId) =>
          currentTenderIds.has(selectedTenderId)
        )
      )

      if (selected) {
        next.add(tenderId)
      } else {
        next.delete(tenderId)
      }

      return next
    })
  }

  function setVisibleTendersSelected(selected: boolean) {
    setSelectedTenderIds(selected ? new Set(visibleTenderIds) : new Set())
    setBulkDeleteConfirmation("")
  }

  function handleSavedTender(savedTender: Tender) {
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
      setSelectedTender((current) =>
        current?.id === deleteTarget.id ? null : current
      )
      setSelectedTenderIds((current) => {
        const next = new Set(current)
        next.delete(deleteTarget.id)
        return next
      })
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

  async function handleBulkDeleteTenders() {
    if (!canDelete) return

    if (selectedTenders.length === 0) {
      clearSelection()
      setBulkDeleteOpen(false)
      showNotice({
        message: "Selected tenders are no longer available.",
        variant: "error",
      })
      return
    }

    const tendersToDelete = selectedTenders
    const deleteCount = tendersToDelete.length
    const deletedTenderIds = new Set(tendersToDelete.map((tender) => tender.id))

    setBulkDeleting(true)
    setBulkDeleteError(null)

    try {
      if (
        requiresBulkDeleteTypedConfirmation &&
        bulkDeleteConfirmation !== "DELETE"
      ) {
        setBulkDeleteError("Type DELETE to confirm this deletion.")
        return
      }

      await deleteTenders(tendersToDelete)
      setSelectedTender((current) =>
        current && deletedTenderIds.has(current.id) ? null : current
      )
      setEditTender((current) =>
        current && deletedTenderIds.has(current.id) ? null : current
      )
      setDeleteTender((current) =>
        current && deletedTenderIds.has(current.id) ? null : current
      )
      clearSelection()
      setBulkDeleteOpen(false)
      reload()
      showNotice({
        message:
          deleteCount === 1 ? "1 tender deleted." : `${deleteCount} tenders deleted.`,
        variant: "success",
      })
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete selected tenders. Please try again."

      setBulkDeleteError(message)
      showNotice({
        message: "Could not delete selected tenders. Please try again.",
        variant: "error",
      })
    } finally {
      setBulkDeleting(false)
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
          activePage="Tenders"
          title="Tenders"
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
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading tenders...
              </p>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load tenders</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                  value={quickView}
                  onValueChange={handleQuickViewChange}
                  className="min-w-0"
                >
                  <TabsList
                    variant="line"
                    aria-label="Tender quick views"
                    className="flex !h-auto max-w-full [scrollbar-width:none] justify-start gap-1 overflow-x-auto rounded-none p-0 lg:flex-wrap [&::-webkit-scrollbar]:hidden"
                  >
                    {quickViewMetrics.map((metric) => (
                      <TabsTrigger
                        key={metric.value}
                        value={metric.value}
                        className="h-8 flex-none rounded-md border bg-background px-3 text-xs data-active:border-primary/35 data-active:bg-primary/10 data-active:text-primary"
                      >
                        <span>{metric.label}</span>
                        <span className="font-semibold">{metric.count}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Button
                  size="lg"
                  className="w-full max-lg:hidden sm:w-fit lg:ml-auto"
                  onClick={() => setCreateOpen(true)}
                >
                  <FilePlus2 data-icon="inline-start" />
                  Add tender
                </Button>
              </div>

              <div
                aria-label="Tender table toolbar"
                className="flex gap-2 lg:flex-row lg:items-center"
              >
                <label className="relative min-w-0 flex-1 lg:max-w-sm">
                  <span className="sr-only">Search tenders</span>
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    className="h-8 pl-8"
                    placeholder="Search tenders"
                    aria-label="Search tenders"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filters
                  {hasFilters ? (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      On
                    </Badge>
                  ) : null}
                </Button>
                <div className="hidden flex-wrap gap-2 lg:flex">
                  <TenderSelect
                    label="Health"
                    value={health}
                    onValueChange={handleHealthChange}
                    options={selectOptions([...tenderHealthStatuses])}
                  />
                  <TenderSelect
                    label="Stage"
                    value={stage}
                    onValueChange={handleStageChange}
                    options={selectOptions([
                      "identified",
                      "psq",
                      "itt",
                      "submitted",
                      "presentation",
                      "award",
                      "standstill",
                      "won",
                      "lost",
                      "withdrawn",
                      "no_bid",
                    ])}
                  />
                  <PriceRangePopover
                    value={selectedPriceRange}
                    max={contractValueMax}
                    onValueChange={handlePriceRangeChange}
                    onReset={handlePriceRangeReset}
                  />
                  <TenderSelect
                    label="Deadline"
                    value={deadline}
                    onValueChange={handleDeadlineChange}
                    options={selectOptions([
                      "Upcoming",
                      "Overdue",
                      "Submitted",
                    ])}
                  />
                  <TenderSelect
                    label="Owner"
                    value={owner}
                    onValueChange={handleOwnerChange}
                    options={selectOptions(ownerOptions)}
                    formatOptionLabel={(option) =>
                      option === "unassigned"
                        ? "Unassigned"
                        : profileName(profiles, option)
                    }
                  />
                </div>
              </div>
            </section>

            {filteredTenders.length === 0 ? (
              <EmptyState
                title={hasFilters ? "No filtered results" : "No tenders yet"}
                description={
                  hasFilters
                    ? "No tenders match the current search and filter combination."
                    : "Add tender data in Supabase to populate this register."
                }
              />
            ) : (
              <>
                <div className="grid gap-3 lg:hidden">
                  {canDelete && selectedTenderCount > 0 ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="sticky top-2 z-10 flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-background/95 px-3 py-2 shadow-sm backdrop-blur"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {selectedTenderCount} selected
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={bulkDeleting}
                          onClick={clearSelection}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={bulkDeleting}
                          onClick={() => {
                            setBulkDeleteError(null)
                            setBulkDeleteConfirmation("")
                            setBulkDeleteOpen(true)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {filteredTenders.map((tender) => (
                    <MobileTenderCard
                      key={tender.id}
                      tender={tender}
                      deadlines={deadlines}
                      profiles={profiles}
                      canSelect={canDelete}
                      selectionMode={
                        canDelete && validSelectedTenderIds.size > 0
                      }
                      selected={validSelectedTenderIds.has(tender.id)}
                      onView={() => setSelectedTender(tender)}
                      onSelect={(selected) =>
                        setTenderSelected(tender.id, selected)
                      }
                    />
                  ))}
                </div>
                {canDelete && selectedTenderCount > 0 ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="hidden items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 lg:flex"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {selectedTenderCount}{" "}
                      {selectedTenderCount === 1 ? "selected" : "selected"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={bulkDeleting}
                        onClick={clearSelection}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={bulkDeleting}
                        onClick={() => {
                          setBulkDeleteError(null)
                          setBulkDeleteConfirmation("")
                          setBulkDeleteOpen(true)
                        }}
                      >
                        Delete selected
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="hidden overflow-hidden rounded-lg border lg:block">
                  <Table>
                    <TableHeader className="bg-muted/35">
                      <TableRow className="hover:bg-muted/35">
                        {canDelete ? (
                          <TableHead className="w-10">
                            <Checkbox
                              aria-label="Select all visible tenders"
                              aria-checked={
                                someVisibleSelected ? "mixed" : undefined
                              }
                              checked={allVisibleSelected}
                              onChange={(event) =>
                                setVisibleTendersSelected(
                                  event.currentTarget.checked
                                )
                              }
                            />
                          </TableHead>
                        ) : null}
                        <TableHead className="w-[112px]">Tender ID</TableHead>
                        <TableHead className="min-w-[260px]">
                          Tender Name
                        </TableHead>
                        <TableHead className="min-w-[220px]">
                          Authority
                        </TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="min-w-[150px]">
                          Deadline
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          Lead Bid Manager
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Last Updated
                        </TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenders.map((tender) => {
                        const tenderDeadline = primaryDeadline(
                          tender,
                          deadlines
                        )
                        const state = deadlineState(tenderDeadline)

                        return (
                          <TableRow
                            key={tender.id}
                            data-state={
                              validSelectedTenderIds.has(tender.id)
                                ? "selected"
                                : undefined
                            }
                            className="tf-row-lift h-14 data-[state=selected]:bg-primary/5"
                          >
                            {canDelete ? (
                              <TableCell>
                                <Checkbox
                                  aria-label={`Select ${tender.title}`}
                                  checked={validSelectedTenderIds.has(
                                    tender.id
                                  )}
                                  onChange={(event) =>
                                    setTenderSelected(
                                      tender.id,
                                      event.currentTarget.checked
                                    )
                                  }
                                />
                              </TableCell>
                            ) : null}
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {tender.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="max-w-[320px]">
                              <button
                                className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary"
                                onClick={() => setSelectedTender(tender)}
                              >
                                {tender.title}
                              </button>
                            </TableCell>
                            <TableCell className="max-w-[260px] truncate text-muted-foreground">
                              {tender.buyer_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {labelFromValue(tender.stage)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={tenderStatusBadgeClass(
                                  tender.status
                                )}
                              >
                                {labelFromValue(tender.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(tender.estimated_value)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 text-sm",
                                  tenderDeadlineClass(state)
                                )}
                              >
                                <CalendarClock className="size-3.5" />
                                {formatDateTime(tenderDeadline)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {profileName(profiles, tender.owner_id)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(tender.updated_at)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button variant="ghost" size="icon-sm" />
                                  }
                                >
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">
                                    Open tender actions
                                  </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44"
                                >
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => setSelectedTender(tender)}
                                    >
                                      View tender
                                    </DropdownMenuItem>
                                    {canDelete ? (
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setDeleteTender(tender)}
                                      >
                                        Delete tender
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
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
      <TenderBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteError(null)
            setBulkDeleteConfirmation("")
          }
          setBulkDeleteOpen(open)
        }}
        count={selectedTenderCount}
        tenderNames={selectedTenderNames}
        liveTenderCount={liveSelectedTenderCount}
        requiresTypedConfirmation={requiresBulkDeleteTypedConfirmation}
        typedConfirmation={bulkDeleteConfirmation}
        deleting={bulkDeleting}
        error={bulkDeleteError}
        onTypedConfirmationChange={(value) => {
          setBulkDeleteConfirmation(value)
          if (bulkDeleteError) setBulkDeleteError(null)
        }}
        onConfirm={handleBulkDeleteTenders}
      />
      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed right-3 bottom-3 z-50 max-w-[calc(100vw-1.5rem)] rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg",
            notice.variant === "success"
              ? "border-primary/25 text-foreground"
              : "border-destructive/35 text-destructive"
          )}
        >
          {notice.message}
        </div>
      ) : null}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="top-auto h-[86svh] rounded-t-xl border-t border-l-0 sm:max-w-none data-open:slide-in-from-bottom data-closed:slide-out-to-bottom">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-4">
            <TenderSelect
              label="Health"
              value={health}
              onValueChange={handleHealthChange}
              options={selectOptions([...tenderHealthStatuses])}
              className="w-full"
            />
            <TenderSelect
              label="Stage"
              value={stage}
              onValueChange={handleStageChange}
              options={selectOptions([
                "identified",
                "psq",
                "itt",
                "submitted",
                "presentation",
                "award",
                "standstill",
                "won",
                "lost",
                "withdrawn",
                "no_bid",
              ])}
              className="w-full"
            />
            <div className="rounded-md border p-3">
              <PriceRangeFilter
                value={selectedPriceRange}
                max={contractValueMax}
                onValueChange={handlePriceRangeChange}
                onReset={handlePriceRangeReset}
              />
            </div>
            <TenderSelect
              label="Deadline"
              value={deadline}
              onValueChange={handleDeadlineChange}
              options={selectOptions(["Upcoming", "Overdue", "Submitted"])}
              className="w-full"
            />
            <TenderSelect
              label="Owner"
              value={owner}
              onValueChange={handleOwnerChange}
              options={selectOptions(ownerOptions)}
              className="w-full"
              formatOptionLabel={(option) =>
                option === "unassigned"
                  ? "Unassigned"
                  : profileName(profiles, option)
              }
            />
          </div>
          <SheetFooter className="grid grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearSelectionForScopeChange()
                setHealth(allOption)
                setStage(allOption)
                setPriceRange(null)
                setDeadline(allOption)
                setOwner(allOption)
              }}
            >
              Clear
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Apply
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileTenderCard({
  tender,
  deadlines,
  profiles,
  canSelect,
  selectionMode,
  selected,
  onView,
  onSelect,
}: {
  tender: Tender
  deadlines: Parameters<typeof primaryDeadline>[1]
  profiles: Parameters<typeof profileName>[0]
  canSelect: boolean
  selectionMode: boolean
  selected: boolean
  onView: () => void
  onSelect: (selected: boolean) => void
}) {
  const tenderDeadline = primaryDeadline(tender, deadlines)
  const state = deadlineState(tenderDeadline)

  return (
    <article
      data-state={selected ? "selected" : undefined}
      className="rounded-lg border bg-background p-3 shadow-xs data-[state=selected]:border-primary/35 data-[state=selected]:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        {selectionMode ? (
          <Checkbox
            aria-label={`Select ${tender.title}`}
            checked={selected}
            className="mt-1"
            onChange={(event) => onSelect(event.currentTarget.checked)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] text-muted-foreground">
            {tender.id.slice(0, 8)}
          </p>
          <button
            className="mt-1 text-left text-sm leading-5 font-medium text-foreground hover:text-primary"
            onClick={onView}
          >
            {tender.title}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            {tender.buyer_name}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" variant="outline" onClick={onView}>
            View
          </Button>
          {canSelect && !selectionMode ? (
            <Button size="sm" variant="ghost" onClick={() => onSelect(true)}>
              Select
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{labelFromValue(tender.stage)}</Badge>
        <Badge className={tenderStatusBadgeClass(tender.status)}>
          {labelFromValue(tender.status)}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <MobileField
          label="Value"
          value={formatCurrency(tender.estimated_value)}
        />
        <MobileField
          label="Deadline"
          value={formatDateTime(tenderDeadline)}
          valueClassName={tenderDeadlineClass(state)}
        />
        <MobileField
          label="Lead"
          value={profileName(profiles, tender.owner_id)}
        />
        <MobileField
          label="Updated"
          value={formatDateTime(tender.updated_at)}
        />
      </dl>
    </article>
  )
}

function MobileField({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-0 rounded-md bg-muted/25 p-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 font-medium break-words", valueClassName)}>
        {value}
      </dd>
    </div>
  )
}

function PriceRangePopover({
  value,
  max,
  onValueChange,
  onReset,
}: {
  value: PriceRange
  max: number
  onValueChange: (value: PriceRange) => void
  onReset: () => void
}) {
  const hasActiveRange = !isDefaultPriceRange(value, max)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "h-8 w-full justify-between sm:w-auto",
              hasActiveRange && "border-primary text-primary"
            )}
            aria-label="Contract value filter"
          />
        }
      >
        <span>Contract value</span>
        {hasActiveRange ? (
          <Badge
            variant="secondary"
            className="ml-1 h-5 rounded-sm px-1.5 text-[0.6875rem]"
          >
            Active
          </Badge>
        ) : null}
        <ChevronDown data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
        <PopoverHeader>
          <PopoverTitle>Contract value</PopoverTitle>
        </PopoverHeader>
        <PriceRangeFilter
          value={value}
          max={max}
          onValueChange={onValueChange}
          onReset={onReset}
        />
      </PopoverContent>
    </Popover>
  )
}

function PriceRangeFilter({
  value,
  max,
  onValueChange,
  onReset,
}: {
  value: PriceRange
  max: number
  onValueChange: (value: PriceRange) => void
  onReset: () => void
}) {
  const hasActiveRange = !isDefaultPriceRange(value, max)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium">Selected range</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatPriceRangeLabel(value, max)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasActiveRange}
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      <Slider
        value={value}
        min={PRICE_RANGE_MIN}
        max={max}
        step={PRICE_RANGE_STEP}
        minStepsBetweenValues={1}
        aria-label="Contract value range"
        onValueChange={(nextValue) => {
          if (!Array.isArray(nextValue)) return

          onValueChange(normalizePriceRange(nextValue, max))
        }}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>From {formatCurrency(value[0])}</span>
        <span>To {formatCurrency(value[1])}</span>
      </div>
    </div>
  )
}

function TenderSelect({
  label,
  value,
  onValueChange,
  options,
  className,
  formatOptionLabel,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: string[]
  className?: string
  formatOptionLabel?: (option: string) => string
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onValueChange(nextValue)
      }}
    >
      <SelectTrigger
        size="sm"
        className={cn("w-full min-w-36 sm:w-auto", className)}
        aria-label={label}
      >
        <SelectValue>{label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option === allOption
                ? label
                : (formatOptionLabel?.(option) ?? labelFromValue(option))}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 text-center">
      <p className="font-heading text-base font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
