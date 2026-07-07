"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Rocket } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createOrganisation,
  useOpenTendersData,
} from "@/lib/open-tenders-data"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export default function OnboardingPage() {
  const router = useRouter()
  const { organisation, currentMember, accessState, loading } =
    useOpenTendersData()
  const [workspaceName, setWorkspaceName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasExistingWorkspace = Boolean(organisation?.id)
  const canManageExistingWorkspace = currentMember?.role === "admin"

  useEffect(() => {
    if (!loading && accessState === "ready") {
      router.replace("/app")
    }
  }, [accessState, loading, router])

  async function createWorkspace() {
    setSubmitting(true)
    setError(null)

    try {
      if (hasExistingWorkspace && canManageExistingWorkspace) {
        router.replace("/app")
        return
      }

      await createOrganisation({
        name: workspaceName.trim(),
        slug: slugify(workspaceName),
      })

      router.replace("/app")
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create workspace."
      )
      setSubmitting(false)
    }
  }

  const workspaceNameError =
    !hasExistingWorkspace && workspaceName.trim().length < 2
      ? "Enter a workspace name."
      : !hasExistingWorkspace && !slugify(workspaceName)
        ? "Use a workspace name with letters or numbers."
        : null
  const canSubmit =
    (hasExistingWorkspace && canManageExistingWorkspace) ||
    (!hasExistingWorkspace && !workspaceNameError)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (accessState === "signed_out") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader>
            <BrandLogo />
            <CardTitle>Create an account first</CardTitle>
            <CardDescription>
              Sign up before creating an OpenTenders workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.replace("/signup")}
            >
              Go to signup
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-8">
        <div>
          <BrandLogo />
          <h1 className="mt-6 text-2xl leading-tight font-semibold tracking-normal sm:text-3xl">
            Create your OpenTenders workspace
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your workspace is the shared organisation for your bid team. All
            features are free and open source.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not create workspace</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              This becomes the shared organisation for your bid team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingWorkspace ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{organisation?.name}</p>
                {canManageExistingWorkspace ? (
                  <p className="text-muted-foreground">
                    Continue to your workspace.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Ask a workspace admin to set up your access.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  placeholder="Acme Bid Team"
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
                {workspaceNameError ? (
                  <p className="text-xs text-muted-foreground">
                    {workspaceNameError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Slug: {slugify(workspaceName) || "workspace"}
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canSubmit || submitting}
              onClick={() => void createWorkspace()}
            >
              <Rocket className="size-4" aria-hidden="true" />
              {submitting
                ? "Creating..."
                : hasExistingWorkspace
                  ? "Continue to workspace"
                  : "Create workspace"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
