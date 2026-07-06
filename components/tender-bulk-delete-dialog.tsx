"use client"

import { AlertTriangle, Trash2 } from "lucide-react"

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

export function TenderBulkDeleteDialog({
  open,
  onOpenChange,
  count,
  tenderNames,
  liveTenderCount,
  requiresTypedConfirmation,
  typedConfirmation,
  deleting,
  error,
  onTypedConfirmationChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  tenderNames: string[]
  liveTenderCount: number
  requiresTypedConfirmation: boolean
  typedConfirmation: string
  deleting: boolean
  error: string | null
  onTypedConfirmationChange: (value: string) => void
  onConfirm: () => void
}) {
  const remainingNameCount = Math.max(0, count - tenderNames.length)
  const canConfirm =
    count > 0 &&
    !deleting &&
    (!requiresTypedConfirmation || typedConfirmation === "DELETE")

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </div>
          <DialogTitle>
            Delete {count} {count === 1 ? "tender" : "tenders"}?
          </DialogTitle>
          <DialogDescription>
            This will permanently delete the selected{" "}
            {count === 1 ? "tender" : "tenders"} and their related milestones,
            reminders, and workflow records.
          </DialogDescription>
        </DialogHeader>

        {liveTenderCount > 0 ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm font-medium text-destructive">
            {liveTenderCount} of these{" "}
            {liveTenderCount === 1 ? "tenders is" : "tenders are"} currently
            live.
          </div>
        ) : null}

        {tenderNames.length > 0 ? (
          <div className="rounded-lg border bg-background p-3">
            <p className="text-sm font-medium text-foreground">
              Selected tenders
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {tenderNames.map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
              {remainingNameCount > 0 ? (
                <li className="font-medium text-foreground">
                  + {remainingNameCount} more
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
          Linked contracts will be preserved and detached from the deleted{" "}
          {count === 1 ? "tender" : "tenders"}. This action cannot be undone.
        </div>

        {requiresTypedConfirmation ? (
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">
              Type DELETE to confirm
            </span>
            <Input
              value={typedConfirmation}
              disabled={deleting}
              autoComplete="off"
              onChange={(event) =>
                onTypedConfirmationChange(event.currentTarget.value)
              }
            />
          </label>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {deleting
              ? "Deleting..."
              : count === 1
                ? "Delete tender"
                : `Delete ${count} tenders`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
