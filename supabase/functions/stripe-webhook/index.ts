import Stripe from "npm:stripe@22.1.1"
import {
  getBillingPlan,
  getBillingPlanByPriceId,
  isBillingPlanKey,
} from "../_shared/billing-plans.js"
import { corsHeaders } from "../_shared/http.ts"
import { createAdminClient } from "../_shared/supabase.ts"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2026-02-25.clover",
})

const statusMap: Record<string, string> = {
  incomplete: "incomplete",
  incomplete_expired: "incomplete_expired",
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "cancelled",
  cancelled: "cancelled",
  unpaid: "unpaid",
  paused: "paused",
}

function response(status = 200) {
  return new Response(JSON.stringify({ received: status < 400 }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  })
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const organisationId = subscription.metadata.organisation_id
  if (!organisationId) return

  const item = subscription.items.data[0]
  const priceId = item?.price?.id ?? null
  const plan = isBillingPlanKey(subscription.metadata.plan_key)
    ? getBillingPlan(subscription.metadata.plan_key)
    : getBillingPlanByPriceId(priceId, Deno.env.toObject())
  const currentPeriodEnd =
    typeof (subscription as { current_period_end?: number })
      .current_period_end === "number"
      ? new Date(
          (subscription as { current_period_end: number }).current_period_end *
            1000
        ).toISOString()
      : null

  await supabase.from("organisation_billing_profiles").upsert({
    organisation_id: organisationId,
    ...(plan
      ? {
          plan_key: plan.key,
          plan_name: plan.name,
          active_tender_limit: plan.activeTenderLimit,
          seat_quantity: plan.includedSeats,
          seat_allowance: plan.includedSeats,
        }
      : {}),
    provider_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    provider_subscription_id: subscription.id,
    provider_subscription_item_id: item?.id ?? null,
    provider_price_id: priceId,
    provider_status: subscription.status,
    subscription_status: statusMap[subscription.status] ?? "not_configured",
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    checkout_completed_at:
      subscription.status === "active" || subscription.status === "trialing"
        ? new Date().toISOString()
        : undefined,
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")
  if (!Deno.env.get("STRIPE_SECRET_KEY") || !webhookSecret) return response(500)

  const signature = req.headers.get("stripe-signature")
  if (!signature) return response(400)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret
    )
  } catch {
    return response(400)
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      if (typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        )
        await syncSubscription(subscription)
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription)
    }
  } catch {
    return response(500)
  }

  return response()
})
