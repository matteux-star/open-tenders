import Stripe from "npm:stripe@22.1.1"
import { fail, handleOptions, ok } from "../_shared/http.ts"
import {
  createAdminClient,
  requireOrgAdmin,
  requireUser,
} from "../_shared/supabase.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2026-02-25.clover",
})

function appUrl() {
  return (
    Deno.env.get("APP_URL") ??
    Deno.env.get("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:3000"
  )
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    if (!Deno.env.get("STRIPE_SECRET_KEY"))
      return fail("Stripe is not configured.", 500)

    const supabase = createAdminClient()
    const user = await requireUser(req, supabase)
    const { organisationId } = await req.json()
    if (!organisationId) return fail("Organisation is required.")

    await requireOrgAdmin(supabase, organisationId, user.id)

    const { data: billing, error } = await supabase
      .from("organisation_billing_profiles")
      .select("provider_customer_id")
      .eq("organisation_id", organisationId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!billing?.provider_customer_id) {
      return fail(
        "Create a subscription before opening the billing portal.",
        409
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.provider_customer_id,
      return_url: `${appUrl().replace(/\/$/, "")}/settings`,
    })

    return ok({ url: session.url })
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not open billing portal.",
      500
    )
  }
})
