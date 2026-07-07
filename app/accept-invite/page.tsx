"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { acceptInvitation } from "@/lib/open-tenders-data"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const acceptingRef = useRef(false)

  useEffect(() => {
    if (!token || acceptingRef.current) return

    acceptingRef.current = true
    acceptInvitation(token)
      .then(() => {
        setStatus("done")
        setMessage("Invitation accepted. Your workspace is ready.")
      })
      .catch((error) => {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Could not accept invitation.")
      })
  }, [token])

  return (
    <AppShell
      activePage="Settings"
      eyebrow="Invitation"
      title="Accept invitation"
      description="Join your OpenTenders organisation."
      actionSlot={
        <Button size="sm" onClick={() => router.push("/app")}>
          Go to dashboard
        </Button>
      }
    >
      <div className="p-4 lg:p-6">
        <Alert variant={status === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {status === "done"
                ? "Invitation accepted"
                : status === "error"
                  ? "Invitation failed"
                  : "Invitation ready"}
          </AlertTitle>
          <AlertDescription>
            {message ??
              (token
                ? "We are validating your invitation."
                : "This invitation link is missing its token.")}
          </AlertDescription>
        </Alert>
      </div>
    </AppShell>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteContent />
    </Suspense>
  )
}
