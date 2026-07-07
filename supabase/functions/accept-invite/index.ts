import { fail, handleOptions, ok } from "../_shared/http.ts"
import { createAdminClient, requireUser } from "../_shared/supabase.ts"

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const supabase = createAdminClient()
    const user = await requireUser(req, supabase)
    const body = await req.json()
    const tokenOrInvitationId = String(body.tokenOrInvitationId ?? "").trim()

    if (!tokenOrInvitationId) return fail("Invitation token is required.")

    const invitationQuery = supabase
      .from("organisation_invitations")
      .select("*")

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        tokenOrInvitationId
      )
    const { data: invitation, error: inviteError } = await (isUuid
      ? invitationQuery.or(`token.eq.${tokenOrInvitationId},id.eq.${tokenOrInvitationId}`)
      : invitationQuery.eq("token", tokenOrInvitationId)
    ).maybeSingle()
    if (inviteError) throw new Error(inviteError.message)
    if (!invitation) return fail("Invitation not found.", 404)
    if (invitation.status !== "pending") return fail("This invitation is no longer pending.", 409)

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await supabase
        .from("organisation_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id)
      return fail("This invitation has expired.", 410)
    }

    if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
      return fail("Sign in with the email address this invitation was sent to.", 403)
    }

    const { data: existingMember, error: existingError } = await supabase
      .from("organisation_members")
      .select("id")
      .eq("organisation_id", invitation.organisation_id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)

    let membership = existingMember
    if (!membership) {
      const { data: createdMember, error: memberError } = await supabase
        .from("organisation_members")
        .insert({
          organisation_id: invitation.organisation_id,
          user_id: user.id,
          role: invitation.role,
        })
        .select("id")
        .single()
      if (memberError) throw new Error(memberError.message)
      membership = createdMember
    }

    const { error: updateError } = await supabase
      .from("organisation_invitations")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)
    if (updateError) throw new Error(updateError.message)

    return ok({
      organisationId: invitation.organisation_id,
      membershipId: membership.id,
    })
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not accept invitation.", 500)
  }
})
