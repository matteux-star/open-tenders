import { createClient } from "npm:@supabase/supabase-js@2.105.4"

export type OrganisationRole = "admin" | "editor" | "viewer"

export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SECRET_KEY")

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase Edge Function service credentials.")
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function requireUser(req: Request, supabase: ReturnType<typeof createAdminClient>) {
  const authHeader = req.headers.get("Authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "")

  if (!token) throw new Error("Authentication is required.")

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error("Authentication is required.")

  return data.user
}

export async function requireOrgAdmin(
  supabase: ReturnType<typeof createAdminClient>,
  organisationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("organisation_members")
    .select("id, role")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data?.role !== "admin") {
    throw new Error("Only organisation admins can perform this action.")
  }
}

export async function getSeatState(
  supabase: ReturnType<typeof createAdminClient>,
  organisationId: string
) {
  const [{ count: activeCount, error: activeError }, { count: pendingCount, error: pendingError }, { data: billing, error: billingError }, { data: organisation, error: organisationError }] =
    await Promise.all([
      supabase
        .from("organisation_members")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", organisationId),
      supabase
        .from("organisation_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", organisationId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString()),
      supabase
        .from("organisation_billing_profiles")
        .select("seat_quantity, seat_allowance")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("seat_limit")
        .eq("id", organisationId)
        .maybeSingle(),
    ])

  const error = activeError ?? pendingError ?? billingError ?? organisationError
  if (error) throw new Error(error.message)

  const allowance =
    billing?.seat_quantity ??
    billing?.seat_allowance ??
    organisation?.seat_limit ??
    1
  const active = activeCount ?? 0
  const pending = pendingCount ?? 0

  return {
    active,
    pending,
    allowance,
    billable: active + pending,
  }
}
