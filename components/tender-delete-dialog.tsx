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
import type { Tender } from "@/lib/open-tenders-data"

export function TenderDeleteDialog({
  open,
  onOpenChange,
  tender,
  deleting,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tender: Tender | null
  deleting: boolean
  error: string | null
  onConfirm: () => void
}) {
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
          <DialogTitle>Delete tender</DialogTitle>
          <DialogDescription>
            This will permanently delete
            {tender ? ` "${tender.title}"` : " this tender"}. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
          The tender&apos;s deadlines and activity will be removed.
          Linked contracts will be preserved and detached from this tender.
        </div>

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
            disabled={!tender || deleting}
            onClick={onConfirm}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {deleting ? "Deleting..." : "Delete tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
