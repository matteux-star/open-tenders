"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { FilePlus2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createTender,
  labelFromValue,
  type OrganisationMember,
  type Profile,
  type Tender,
  updateTender,
} from "@/lib/tender-flow-data"
import {
  canUseHealthStatusForStage,
  deriveTenderStatusForStage,
  isHealthTenderStatus,
  tenderHealthStatuses,
} from "@/lib/tender-lifecycle"

type TenderStage = Tender["stage"]
type TenderStatus = Tender["status"]

type TenderFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organisationId: string | null
  currentMember: OrganisationMember | null
  profiles: Profile[]
  defaultStage?: TenderStage
  defaultStatus?: TenderStatus
  title?: string
  description?: string
  tender?: Tender | null
  onCreated?: () => void
  onSaved?: (tender: Tender) => void
}

const stages: TenderStage[] = [
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
]

const initialForm = {
  title: "",
  buyerName: "",
  sector: "",
  estimatedValue: "",
  ownerId: "unassigned",
  psqDueAt: "",
  ittDueAt: "",
  finalClarificationDeadline: "",
  notes: "",
}

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function formFromTender(tender: Tender) {
  return {
    title: tender.title,
    buyerName: tender.buyer_name,
    sector: tender.sector ?? "",
    estimatedValue: tender.estimated_value?.toString() ?? "",
    ownerId: tender.owner_id ?? "unassigned",
    psqDueAt: formatDateTimeLocal(tender.psq_due_at),
    ittDueAt: formatDateTimeLocal(tender.itt_due_at),
    finalClarificationDeadline: formatDateTimeLocal(
      tender.final_clarification_deadline
    ),
    notes: tender.notes ?? "",
  }
}

function healthStatusFor(value: TenderStatus) {
  return isHealthTenderStatus(value) ? value : "on_track"
}

export function TenderFormDialog({
  open,
  onOpenChange,
  organisationId,
  currentMember,
  profiles,
  defaultStage = "identified",
  defaultStatus = "on_track",
  title,
  description,
  tender = null,
  onCreated,
  onSaved,
}: TenderFormDialogProps) {
  const isEditing = Boolean(tender)
  const formKey = tender
    ? `edit-${tender.id}-${tender.updated_at}`
    : `create-${defaultStage}-${defaultStatus}-${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <TenderFormContent
          key={formKey}
          organisationId={organisationId}
          currentMember={currentMember}
          profiles={profiles}
          defaultStage={defaultStage}
          defaultStatus={defaultStatus}
          title={title ?? (isEditing ? "Edit tender" : "Add tender")}
          description={
            description ??
            (isEditing
              ? "Update the tender fields tracked in this workspace."
              : "Create a tender in the current organisation workspace.")
          }
          tender={tender}
          onOpenChange={onOpenChange}
          onCreated={onCreated}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  )
}

function TenderFormContent({
  organisationId,
  currentMember,
  profiles,
  defaultStage,
  defaultStatus,
  title,
  description,
  tender,
  onOpenChange,
  onCreated,
  onSaved,
}: Omit<TenderFormDialogProps, "open"> & {
  defaultStage: TenderStage
  defaultStatus: TenderStatus
  title: string
  description: string
}) {
  const isEditing = Boolean(tender)
  const [form, setForm] = useState(() =>
    tender ? formFromTender(tender) : initialForm
  )
  const [stage, setStage] = useState<TenderStage>(
    tender?.stage ?? defaultStage
  )
  const [healthStatus, setHealthStatus] = useState<TenderStatus>(
    healthStatusFor(tender?.status ?? defaultStatus)
  )
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canSubmit =
    currentMember?.role === "admin" || currentMember?.role === "editor"
  const derivedStatus = deriveTenderStatusForStage(stage, healthStatus)
  const usesHealthStatus = canUseHealthStatusForStage(stage)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentMember || !canSubmit || (!organisationId && !tender)) {
      setError(
        isEditing
          ? "You do not have permission to edit tenders."
          : "You do not have permission to create tenders."
      )
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const input = {
        title: form.title.trim(),
        buyer_name: form.buyerName.trim(),
        sector: form.sector.trim() || null,
        estimated_value: form.estimatedValue
          ? Number(form.estimatedValue)
          : null,
        owner_id: form.ownerId === "unassigned" ? null : form.ownerId,
        stage,
        status: derivedStatus,
        psq_due_at: form.psqDueAt
          ? new Date(form.psqDueAt).toISOString()
          : null,
        itt_due_at: form.ittDueAt
          ? new Date(form.ittDueAt).toISOString()
          : null,
        final_clarification_deadline: form.finalClarificationDeadline
          ? new Date(form.finalClarificationDeadline).toISOString()
          : null,
        submission_deadline: form.ittDueAt
          ? new Date(form.ittDueAt).toISOString()
          : null,
        notes: form.notes.trim() || null,
      }

      if (tender) {
        const savedTender = await updateTender(tender.id, input)

        setMessage("Tender updated.")
        onSaved?.(savedTender)
        onOpenChange(false)
        return
      }

      if (!organisationId) {
        setError("No organisation workspace is available.")
        return
      }

      await createTender({
        ...input,
        organisation_id: organisationId,
        currency: "GBP",
        created_by: currentMember.user_id,
      })

      setMessage("Tender created.")
      setForm(initialForm)
      setStage(defaultStage)
      setHealthStatus(healthStatusFor(defaultStatus))
      onCreated?.()
      onOpenChange(false)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEditing
            ? "Could not save tender."
            : "Could not create tender."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-3xl">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <FormSection
          title="Tender basics"
          description="The buyer, opportunity name, and commercial context used across the pipeline."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="tender-title" label="Tender name">
              <Input
                id="tender-title"
                value={form.title}
                onChange={(event) =>
                  setForm((value) => ({ ...value, title: event.target.value }))
                }
                required
              />
            </Field>
            <Field id="buyer-name" label="Authority">
              <Input
                id="buyer-name"
                value={form.buyerName}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    buyerName: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field id="sector" label="Sector">
              <Input
                id="sector"
                value={form.sector}
                onChange={(event) =>
                  setForm((value) => ({ ...value, sector: event.target.value }))
                }
              />
            </Field>
            <Field
              id="estimated-value"
              label="Estimated value"
              helper="Used for value-at-risk and dashboard exposure reporting."
            >
              <Input
                id="estimated-value"
                type="number"
                min="0"
                step="1000"
                value={form.estimatedValue}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    estimatedValue: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Ownership and status"
          description="Who owns the bid and where it sits in the active tender lifecycle."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field id="stage" label="Stage">
              <Select
                value={stage}
                onValueChange={(value) => setStage(value as TenderStage)}
              >
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {stages.map((item) => (
                      <SelectItem key={item} value={item}>
                        {labelFromValue(item)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field
              id="status"
              label={usesHealthStatus ? "Health" : "Lifecycle status"}
              helper={
                usesHealthStatus
                  ? "Health drives risk flags while the tender is live."
                  : "This stage uses a derived status."
              }
            >
              {usesHealthStatus ? (
                <Select
                  value={healthStatus}
                  onValueChange={(value) =>
                    setHealthStatus(value as TenderStatus)
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {tenderHealthStatuses.map((item) => (
                        <SelectItem key={item} value={item}>
                          {labelFromValue(item)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <div
                  id="status"
                  className="flex h-9 items-center rounded-md border border-input bg-muted/20 px-3 text-sm text-muted-foreground"
                >
                  {labelFromValue(derivedStatus)}
                </div>
              )}
            </Field>
            <Field id="owner" label="Owner">
              <Select
                value={form.ownerId}
                onValueChange={(ownerId) =>
                  setForm((value) => ({
                    ...value,
                    ownerId: ownerId ?? "unassigned",
                  }))
                }
              >
                <SelectTrigger id="owner" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name ?? profile.email ?? "Unnamed user"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Key dates"
          description="Dates here feed the calendar, deadline reminders, and Telegram/email notifications."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              id="psq-due-at"
              label="PSQ due date"
              helper="Creates the internal review reminder for PSQ work."
            >
              <Input
                id="psq-due-at"
                type="datetime-local"
                value={form.psqDueAt}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    psqDueAt: event.target.value,
                  }))
                }
              />
            </Field>
            <Field
              id="itt-due-at"
              label="ITT due date"
              helper="Primary submission deadline shown across OpenTenders."
            >
              <Input
                id="itt-due-at"
                type="datetime-local"
                value={form.ittDueAt}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    ittDueAt: event.target.value,
                  }))
                }
              />
            </Field>
            <Field
              id="final-clarification-deadline"
              label="Final clarification deadline"
              helper="Last safe moment for buyer clarification questions."
            >
              <Input
                id="final-clarification-deadline"
                type="datetime-local"
                value={form.finalClarificationDeadline}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    finalClarificationDeadline: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Working notes"
          description="Short internal context for the bid team."
        >
          <Field id="notes" label="Notes">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(event) =>
                setForm((value) => ({ ...value, notes: event.target.value }))
              }
              placeholder="Key risks, win themes, next steps, or handover notes..."
            />
          </Field>
        </FormSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}

        <DialogFooter showCloseButton>
          <Button type="submit" disabled={submitting || !canSubmit}>
            {isEditing ? (
              <Save className="size-4" aria-hidden="true" />
            ) : (
              <FilePlus2 className="size-4" aria-hidden="true" />
            )}
            {submitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save changes"
                : "Create tender"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function Field({
  id,
  label,
  helper,
  children,
}: {
  id: string
  label: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border bg-muted/15 p-3 sm:p-4">
      <div className="mb-4">
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}
