import assert from "node:assert/strict"
import test from "node:test"

import {
  BILLING_ACCESS_STATES,
  getBillingAccessState,
  hasBillableSubscription,
  isBillingRecoveryState,
} from "../lib/billing-access.js"

test("billing access allows trialing and active subscriptions", () => {
  for (const status of ["trialing", "active"]) {
    const profile = {
      subscription_status: status,
      provider_customer_id: "cus_123",
    }

    assert.equal(getBillingAccessState(profile), BILLING_ACCESS_STATES.ready)
    assert.equal(hasBillableSubscription(profile), true)
  }
})

test("billing access treats past_due and unpaid as graceful recovery states", () => {
  for (const status of ["past_due", "unpaid"]) {
    const profile = {
      subscription_status: status,
      provider_customer_id: "cus_123",
    }

    assert.equal(getBillingAccessState(profile), BILLING_ACCESS_STATES.recovery)
    assert.equal(isBillingRecoveryState(profile), true)
    assert.equal(hasBillableSubscription(profile), true)
  }
})

test("billing access blocks missing, cancelled, and expired checkout states", () => {
  for (const profile of [
    null,
    { subscription_status: "not_configured", provider_customer_id: null },
    { subscription_status: "cancelled", provider_customer_id: "cus_123" },
    {
      subscription_status: "incomplete_expired",
      provider_customer_id: "cus_123",
    },
    { subscription_status: "incomplete", provider_customer_id: "cus_123" },
    { subscription_status: "paused", provider_customer_id: "cus_123" },
  ]) {
    assert.equal(getBillingAccessState(profile), BILLING_ACCESS_STATES.blocked)
    assert.equal(hasBillableSubscription(profile), false)
  }
})
