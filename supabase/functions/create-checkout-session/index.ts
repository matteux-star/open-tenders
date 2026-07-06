import Stripe from "npm:stripe@22.1.1"
import {
  getBillingPlan,
  getBillingPlanEnvName,
  isBillingPlanKey,
} from "../_shared/billing-plans.js"
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
    if (!Deno.env.get("STRIPE_SECRET_KEY")) {
      return fail("Stripe is not configured.", 500)
    }

    const supabase = createAdminClient()
    const user = await requireUser(req, supabase)
    const { organisationId, planKey } = await req.json()
    if (!organisationId) return fail("Organisation is required.")
    if (!isBillingPlanKey(planKey)) return fail("Billing plan is required.")

    await requireOrgAdmin(supabase, organisationId, user.id)

    const plan = getBillingPlan(planKey)
    const priceId = Deno.env.get(getBillingPlanEnvName(plan.key))
    if (!priceId) {
      return fail(`${plan.name} Stripe price is not configured.`, 500)
    }

    const [
      { data: organisation, error: orgError },
      { data: billing, error: billingError },
    ] = await Promise.all([
      supabase
        .from("organisations")
        .select("name")
        .eq("id", organisationId)
        .single(),
      supabase
        .from("organisation_billing_profiles")
        .select("*")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
    ])
    if (orgError ?? billingError)
      throw new Error((orgError ?? billingError)?.message)

    const baseUrl = appUrl().replace(/\/$/, "")
    const taxEnabled = Deno.env.get("STRIPE_TAX_ENABLED") === "true"
    const customerId = billing?.provider_customer_id ?? undefined
    const customer = customerId
      ? customerId
      : await stripe.customers.create({
          email: user.email ?? billing?.billing_email ?? undefined,
          name: organisation.name,
          metadata: { organisation_id: organisationId },
        })

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: typeof customer === "string" ? customer : customer.id,
      client_reference_id: organisationId,
      success_url: `${baseUrl}/app?billing=success`,
      cancel_url: `${baseUrl}/onboarding?billing=cancelled`,
      automatic_tax: { enabled: taxEnabled },
      tax_id_collection: { enabled: taxEnabled },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: { organisation_id: organisationId, plan_key: plan.key },
      },
      metadata: { organisation_id: organisationId, plan_key: plan.key },
    })

    await supabase.from("organisation_billing_profiles").upsert({
      organisation_id: organisationId,
      plan_key: plan.key,
      plan_name: plan.name,
      billing_email: user.email,
      billing_admin_id: user.id,
      provider_customer_id:
        typeof customer === "string" ? customer : customer.id,
      provider_price_id: priceId,
      seat_quantity: plan.includedSeats,
      seat_allowance: plan.includedSeats,
      active_tender_limit: plan.activeTenderLimit,
    })

    if (!session.url) throw new Error("Stripe did not return a checkout URL.")

    return ok({ url: session.url })
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Could not start checkout.",
      500
    )
  }
})
