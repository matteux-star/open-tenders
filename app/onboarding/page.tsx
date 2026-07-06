"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBillingPlanOptions } from "@/lib/billing-plans"
import {
  BILLING_ACCESS_STATES,
  createCheckoutSession,
  createOrganisation,
  getBillingAccessState,
  upsertOrganisationBillingProfile,
  useTenderFlowData,
} from "@/lib/tender-flow-data"
import { cn } from "@/lib/utils"

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
  const { organisation, currentMember, billingProfile, accessState, loading } =
    useTenderFlowData()
  const plans = useMemo(() => getBillingPlanOptions(), [])
  const [workspaceName, setWorkspaceName] = useState("")
  const [selectedPlanKey, setSelectedPlanKey] = useState("standard")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const billingAccessState = getBillingAccessState(billingProfile)
  const selectedPlan =
    plans.find((plan) => plan.key === selectedPlanKey) ?? plans[0]
  const hasExistingWorkspace = Boolean(organisation?.id)
  const canManageExistingWorkspace = currentMember?.role === "admin"

  useEffect(() => {
    if (
      !loading &&
      accessState === "ready" &&
      billingAccessState !== BILLING_ACCESS_STATES.blocked
    ) {
      router.replace("/app")
    }
  }, [accessState, billingAccessState, loading, router])

  async function startCheckout() {
    if (!selectedPlan) return
    setSubmitting(true)
    setError(null)

    try {
      const workspace =
        hasExistingWorkspace && canManageExistingWorkspace
          ? organisation
          : await createOrganisation({
              name: workspaceName.trim(),
              slug: slugify(workspaceName),
            })

      if (!workspace) throw new Error("Could not create workspace.")

      await upsertOrganisationBillingProfile({
        organisation_id: workspace.id,
        plan_key: selectedPlan.key,
        plan_name: selectedPlan.name,
        seat_quantity: selectedPlan.includedSeats,
        seat_allowance: selectedPlan.includedSeats,
        active_tender_limit: selectedPlan.activeTenderLimit,
        subscription_status: "not_configured",
      })

      const session = await createCheckoutSession(
        workspace.id,
        selectedPlan.key
      )
      window.location.href = session.url
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout."
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
              Sign up before choosing a TenderFlow workspace plan.
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
      <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-6 px-4 py-8">
        <div className="max-w-2xl">
          <BrandLogo />
          <h1 className="mt-6 text-2xl leading-tight font-semibold tracking-normal sm:text-3xl">
            Start your TenderFlow workspace
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose a paid plan with a 14-day trial. Stripe handles checkout,
            tax, and billing management.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Checkout could not start</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
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
                      Continue checkout for this workspace.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Ask a workspace admin to finish billing setup.
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
                onClick={() => void startCheckout()}
              >
                <CreditCard className="size-4" aria-hidden="true" />
                {submitting ? "Opening checkout..." : "Start 14-day trial"}
              </Button>
            </CardContent>
          </Card>

          <section className="grid min-w-0 gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const selected = plan.key === selectedPlanKey

              return (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedPlanKey(plan.key)}
                  className={cn(
                    "flex h-full min-w-0 flex-col rounded-lg border bg-card p-4 text-left shadow-sm transition",
                    selected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{plan.name}</h2>
                    {selected ? <Badge>Selected</Badge> : null}
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-2xl font-semibold sm:text-3xl">
                      GBP {plan.monthlyPriceGbp}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                      {plan.includedSeats} team members included
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                      {plan.activeTenderLimit} active tender soft limit
                    </li>
                  </ul>
                </button>
              )
            })}
          </section>
        </div>
      </main>
    </div>
  )
}
