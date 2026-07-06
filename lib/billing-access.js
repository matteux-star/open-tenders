export const BILLING_ACCESS_STATES = {
  ready: "ready",
  recovery: "recovery",
  blocked: "blocked",
}

const readyStatuses = new Set(["trialing", "active"])
const recoveryStatuses = new Set(["past_due", "unpaid"])

export function getBillingAccessState(billingProfile) {
  const status = billingProfile?.subscription_status

  if (readyStatuses.has(status)) return BILLING_ACCESS_STATES.ready
  if (recoveryStatuses.has(status)) return BILLING_ACCESS_STATES.recovery

  return BILLING_ACCESS_STATES.blocked
}

export function hasBillableSubscription(billingProfile) {
  const state = getBillingAccessState(billingProfile)

  return (
    state === BILLING_ACCESS_STATES.ready ||
    state === BILLING_ACCESS_STATES.recovery
  )
}

export function isBillingRecoveryState(billingProfile) {
  return (
    getBillingAccessState(billingProfile) === BILLING_ACCESS_STATES.recovery
  )
}
