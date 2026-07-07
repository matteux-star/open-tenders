import { fail, handleOptions, ok } from "../_shared/http.ts"
import {
  createAdminClient,
  requireOrgAdmin,
  requireUser,
  type OrganisationRole,
} from "../_shared/supabase.ts"

const roles = new Set<OrganisationRole>(["admin", "editor", "viewer"])

function appUrl() {
  return Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
}

async function sendInviteEmail(input: {
  to: string
  organisationName: string
  role: OrganisationRole
  inviteUrl: string
  message?: string | null
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  const from = Deno.env.get("RESEND_FROM") ?? "OpenTenders <noreply@example.com>"

  if (!apiKey) return { sent: false, error: "RESEND_API_KEY is not configured." }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `You're invited to ${input.organisationName} on OpenTenders`,
      html: `
        <p>You have been invited to join <strong>${input.organisationName}</strong> as ${input.role}.</p>
        ${input.message ? `<p>${input.message}</p>` : ""}
        <p><a href="${input.inviteUrl}">Accept your invitation</a></p>
      `,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      sent: false,
      error: body?.message ?? `Resend returned ${response.status}.`,
    }
  }

  return { sent: true, id: body?.id as string | undefined }
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const supabase = createAdminClient()
    const user = await requireUser(req, supabase)
    const body = await req.json()
    const organisationId = String(body.organisationId ?? "")
    const email = String(body.email ?? "").trim().toLowerCase()
    const role = String(body.role ?? "viewer") as OrganisationRole
    const message = typeof body.message === "string" ? body.message.trim() : null

    if (!organisationId) return fail("Organisation is required.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.")
    if (!roles.has(role)) return fail("Invalid role.")

    await requireOrgAdmin(supabase, organisationId, user.id)

    const { data: organisation, error: orgError } = await supabase
      .from("organisations")
      .select("name")
      .eq("id", organisationId)
      .single()
    if (orgError) throw new Error(orgError.message)

    const { data: invitation, error: inviteError } = await supabase
      .from("organisation_invitations")
      .insert({
        organisation_id: organisationId,
        email,
        role,
        message,
        invited_by: user.id,
      })
      .select("*")
      .single()
    if (inviteError) throw new Error(inviteError.message)

    const inviteUrl = `${appUrl().replace(/\/$/, "")}/accept-invite?token=${invitation.token}`
    const delivery = await sendInviteEmail({
      to: email,
      organisationName: organisation.name,
      role,
      inviteUrl,
      message,
    })

    const { data: updatedInvitation, error: updateError } = await supabase
      .from("organisation_invitations")
      .update({
        sent_at: delivery.sent ? new Date().toISOString() : null,
        last_sent_error: delivery.sent ? null : delivery.error,
      })
      .eq("id", invitation.id)
      .select("*")
      .single()
    if (updateError) throw new Error(updateError.message)

    return ok(updatedInvitation)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not create invitation.", 500)
  }
})
