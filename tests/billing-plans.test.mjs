import assert from "node:assert/strict"
import test from "node:test"

import {
  BILLING_PLAN_KEYS,
  billingPlans,
  getBillingPlan,
  getBillingPlanByPriceId,
  getBillingPlanEnvName,
  getBillingPlanOptions,
  isBillingPlanKey,
} from "../lib/billing-plans.js"

test("billing plan config maps tiers to pricing, seats, tender limits, and env vars", () => {
  assert.deepEqual(BILLING_PLAN_KEYS, ["standard", "pro"])

  assert.equal(billingPlans.standard.name, "Standard")
  assert.equal(billingPlans.standard.monthlyPriceGbp, 30)
  assert.equal(billingPlans.standard.includedSeats, 6)
  assert.equal(billingPlans.standard.activeTenderLimit, 15)
  assert.equal(
    getBillingPlanEnvName("standard"),
    "STRIPE_PRICE_STANDARD_MONTHLY"
  )

  assert.equal(billingPlans.pro.name, "Pro")
  assert.equal(billingPlans.pro.monthlyPriceGbp, 50)
  assert.equal(billingPlans.pro.includedSeats, 10)
  assert.equal(billingPlans.pro.activeTenderLimit, 30)
  assert.equal(getBillingPlanEnvName("pro"), "STRIPE_PRICE_PRO_MONTHLY")
})

test("billing plan helpers reject invalid plan keys", () => {
  assert.equal(isBillingPlanKey("standard"), true)
  assert.equal(isBillingPlanKey("pro"), true)
  assert.equal(isBillingPlanKey("starter"), false)
  assert.equal(isBillingPlanKey("team"), false)
  assert.equal(isBillingPlanKey("business"), false)
  assert.equal(isBillingPlanKey("enterprise"), false)
  assert.equal(isBillingPlanKey(null), false)

  assert.throws(
    () => getBillingPlan("enterprise"),
    /Unknown billing plan: enterprise/
  )
  assert.throws(
    () => getBillingPlanEnvName("enterprise"),
    /Unknown billing plan/
  )
})

test("billing plan helpers expose ordered UI options and price lookup", () => {
  const options = getBillingPlanOptions()

  assert.deepEqual(
    options.map((option) => option.key),
    ["standard", "pro"]
  )
  assert.notEqual(options[0], billingPlans.standard)

  assert.equal(
    getBillingPlanByPriceId("price_pro", {
      STRIPE_PRICE_STANDARD_MONTHLY: "price_standard",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro",
    })?.key,
    "pro"
  )
  assert.equal(getBillingPlanByPriceId("price_missing", {}), null)
})
