export const BILLING_PLAN_KEYS = ["standard", "pro"]

export const billingPlans = {
  standard: {
    key: "standard",
    name: "Standard",
    monthlyPriceGbp: 30,
    includedSeats: 6,
    activeTenderLimit: 15,
    envName: "STRIPE_PRICE_STANDARD_MONTHLY",
    description: "For small teams replacing one tender spreadsheet.",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPriceGbp: 50,
    includedSeats: 10,
    activeTenderLimit: 30,
    envName: "STRIPE_PRICE_PRO_MONTHLY",
    description:
      "For SMEs managing tender work as a recurring team process.",
  },
}

export function isBillingPlanKey(value) {
  return typeof value === "string" && BILLING_PLAN_KEYS.includes(value)
}

export function getBillingPlan(planKey) {
  if (!isBillingPlanKey(planKey)) {
    throw new Error(`Unknown billing plan: ${String(planKey)}`)
  }

  return billingPlans[planKey]
}

export function getBillingPlanOptions() {
  return BILLING_PLAN_KEYS.map((key) => ({ ...billingPlans[key] }))
}

export function getBillingPlanEnvName(planKey) {
  return getBillingPlan(planKey).envName
}

export function getBillingPlanByPriceId(priceId, env = {}) {
  if (!priceId) return null

  for (const key of BILLING_PLAN_KEYS) {
    const plan = billingPlans[key]
    if (env[plan.envName] === priceId) return plan
  }

  return null
}
