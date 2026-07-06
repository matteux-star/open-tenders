"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import type { Database, Json } from "@/lib/supabase/database.types"
import { isTerminalStage } from "@/lib/tender-lifecycle"
type Tables = Database["public"]["Tables"]

export type Profile = Tables["profiles"]["Row"]
export type Organisation = Tables["organisations"]["Row"]
export type OrganisationMember = Tables["organisation_members"]["Row"]
export type OrganisationInvitation = Tables["organisation_invitations"]["Row"]
export type SettingsAccessRequest = Tables["settings_access_requests"]["Row"]
export type OrganisationNotificationSettings =
  Tables["organisation_notification_settings"]["Row"]
export type MemberNotificationPreference =
  Tables["member_notification_preferences"]["Row"]
export type TelegramLink = Tables["telegram_links"]["Row"]
export type Tender = Tables["tenders"]["Row"]
export type TenderDeadline = Tables["tender_deadlines"]["Row"]
export type TenderActivity = Tables["tender_activity"]["Row"]
export type Contract = Tables["contracts"]["Row"]
export type TenderInsert = Tables["tenders"]["Insert"]
export type TenderUpdate = Tables["tenders"]["Update"]
export type TenderDeadlineInsert = Tables["tender_deadlines"]["Insert"]
export type TenderDeadlineUpdate = Tables["tender_deadlines"]["Update"]
export type OrganisationUpdate = Tables["organisations"]["Update"]
export type OrganisationInvitationInsert =
  Tables["organisation_invitations"]["Insert"]
export type OrganisationInvitationUpdate =
  Tables["organisation_invitations"]["Update"]
export type OrganisationMemberUpdate = Tables["organisation_members"]["Update"]
export type SettingsAccessRequestInsert =
  Tables["settings_access_requests"]["Insert"]
export type SettingsAccessRequestUpdate =
  Tables["settings_access_requests"]["Update"]
export type OrganisationNotificationSettingsInsert =
  Tables["organisation_notification_settings"]["Insert"]
export type MemberNotificationPreferenceInsert =
  Tables["member_notification_preferences"]["Insert"]
export type TenderActivityInsert = Tables["tender_activity"]["Insert"]
export type EdgeFunctionResponse<T> = {
  data: T | null
  error: { message: string } | null
}

export type TenderFlowAccessState =
  | "loading"
  | "signed_out"
  | "ready"
  | "no_membership"
  | "error"

export type TenderFlowData = {
  organisation: Organisation | null
  currentMember: OrganisationMember | null
  profiles: Profile[]
  members: OrganisationMember[]
  invitations: OrganisationInvitation[]
  accessRequests: SettingsAccessRequest[]
  notificationSettings: OrganisationNotificationSettings | null
  notificationPreferences: MemberNotificationPreference[]
  telegramLink: TelegramLink | null
  tenders: Tender[]
  deadlines: TenderDeadline[]
  activities: TenderActivity[]
  contracts: Contract[]
}

const emptyData: TenderFlowData = {
  organisation: null,
  currentMember: null,
  profiles: [],
  members: [],
  invitations: [],
  accessRequests: [],
  notificationSettings: null,
  notificationPreferences: [],
  telegramLink: null,
  tenders: [],
  deadlines: [],
  activities: [],
  contracts: [],
}

const tenderUpdatedEventName = "tender-flow:tender-updated"

function dispatchTenderUpdated(tender: Tender) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<Tender>(tenderUpdatedEventName, { detail: tender })
  )
}

export function useTenderFlowData() {
  const supabase = createBrowserSupabaseClient()
  const [data, setData] = useState<TenderFlowData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [accessState, setAccessState] =
    useState<TenderFlowAccessState>("loading")
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    function handleTenderUpdated(event: Event) {
      const tender = (event as CustomEvent<Tender>).detail

      if (!tender?.id) return

      setData((current) => ({
        ...current,
        tenders: current.tenders.some((item) => item.id === tender.id)
          ? current.tenders.map((item) =>
              item.id === tender.id ? tender : item
            )
          : current.organisation?.id === tender.organisation_id
            ? [...current.tenders, tender]
            : current.tenders,
      }))
    }

    window.addEventListener(tenderUpdatedEventName, handleTenderUpdated)

    return () => {
      window.removeEventListener(tenderUpdatedEventName, handleTenderUpdated)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      setAccessState("loading")
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        if (mounted) {
          setData(emptyData)
          setAccessState("error")
          setError(userError.message)
          setLoading(false)
        }
        return
      }

      if (!user) {
        if (mounted) {
          setData(emptyData)
          setAccessState("signed_out")
          setLoading(false)
        }
        return
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("organisation_members")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)

      const currentMember = memberships?.[0] ?? null

      if (membershipError) {
        if (mounted) {
          setData(emptyData)
          setAccessState("error")
          setError(membershipError.message)
          setLoading(false)
        }
        return
      }

      if (!currentMember) {
        if (mounted) {
          setData(emptyData)
          setAccessState("no_membership")
          setError(null)
          setLoading(false)
        }
        return
      }

      const organisationId = currentMember.organisation_id

      const [
        organisationResult,
        profilesResult,
        membersResult,
        invitationsResult,
        accessRequestsResult,
        notificationSettingsResult,
        notificationPreferencesResult,
        telegramLinkResult,
        tendersResult,
        deadlinesResult,
        activitiesResult,
        contractsResult,
      ] = await Promise.all([
        supabase
          .from("organisations")
          .select("*")
          .eq("id", organisationId)
          .single(),
        supabase.from("profiles").select("*"),
        supabase
          .from("organisation_members")
          .select("*")
          .eq("organisation_id", organisationId),
        supabase
          .from("organisation_invitations")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("settings_access_requests")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("organisation_notification_settings")
          .select("*")
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("member_notification_preferences")
          .select("*")
          .eq("organisation_id", organisationId),
        supabase
          .from("telegram_links")
          .select("*")
          .eq("user_id", currentMember.user_id)
          .is("revoked_at", null)
          .maybeSingle(),
        supabase
          .from("tenders")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("submission_deadline", { ascending: true, nullsFirst: false }),
        supabase
          .from("tender_deadlines")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("due_at", { ascending: true }),
        supabase
          .from("tender_activity")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("contracts")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("end_date", { ascending: true, nullsFirst: false }),
      ])

      const firstError =
        organisationResult.error ??
        profilesResult.error ??
        membersResult.error ??
        invitationsResult.error ??
        accessRequestsResult.error ??
        notificationSettingsResult.error ??
        notificationPreferencesResult.error ??
        telegramLinkResult.error ??
        tendersResult.error ??
        deadlinesResult.error ??
        activitiesResult.error ??
        contractsResult.error

      if (mounted) {
        if (firstError) {
          setAccessState("error")
          setError(firstError.message)
        } else {
          setData({
            organisation: organisationResult.data,
            currentMember,
            profiles: profilesResult.data ?? [],
            members: membersResult.data ?? [],
            invitations: invitationsResult.data ?? [],
            accessRequests: accessRequestsResult.data ?? [],
            notificationSettings: notificationSettingsResult.data,
            notificationPreferences: notificationPreferencesResult.data ?? [],
            telegramLink: telegramLinkResult.data,
            tenders: tendersResult.data ?? [],
            deadlines: deadlinesResult.data ?? [],
            activities: activitiesResult.data ?? [],
            contracts: contractsResult.data ?? [],
          })
          setAccessState("ready")
          setError(null)
        }

        setLoading(false)
      }
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [reloadKey, supabase])

  return useMemo(
    () => ({ ...data, accessState, loading, error, reload }),
    [accessState, data, error, loading, reload]
  )
}

export async function createTender(input: TenderInsert) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("tenders")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await syncTenderDeadlineRowsForTender(data)
  dispatchTenderUpdated(data)

  return data
}

export async function updateTender(tenderId: string, input: TenderUpdate) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("tenders")
    .update(input)
    .eq("id", tenderId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await syncTenderDeadlineRowsForTender(data)
  dispatchTenderUpdated(data)

  return data
}

export async function deleteTender(
  tender: Pick<Tender, "id" | "organisation_id">
) {
  const supabase = createBrowserSupabaseClient()

  const { error: contractsError } = await supabase
    .from("contracts")
    .update({ tender_id: null })
    .eq("tender_id", tender.id)
    .eq("organisation_id", tender.organisation_id)

  if (contractsError) throw new Error(contractsError.message)

  const { error } = await supabase
    .from("tenders")
    .delete()
    .eq("id", tender.id)
    .eq("organisation_id", tender.organisation_id)

  if (error) throw new Error(error.message)
}

export async function deleteTenders(
  tenders: Array<Pick<Tender, "id" | "organisation_id">>
) {
  if (tenders.length === 0) return

  const organisationIds = new Set(
    tenders.map((tender) => tender.organisation_id)
  )

  if (organisationIds.size !== 1) {
    throw new Error("Selected tenders must belong to the same organisation.")
  }

  const supabase = createBrowserSupabaseClient()
  const organisationId = tenders[0].organisation_id
  const tenderIds = tenders.map((tender) => tender.id)

  const { error: contractsError } = await supabase
    .from("contracts")
    .update({ tender_id: null })
    .in("tender_id", tenderIds)
    .eq("organisation_id", organisationId)

  if (contractsError) throw new Error(contractsError.message)

  const { error } = await supabase
    .from("tenders")
    .delete()
    .in("id", tenderIds)
    .eq("organisation_id", organisationId)

  if (error) throw new Error(error.message)
}

async function upsertOpenTenderDeadlineForTender(
  tender: Tender,
  deadlineType: TenderDeadline["deadline_type"],
  dueAt: string | null | undefined,
  titleSuffix: string
) {
  const supabase = createBrowserSupabaseClient()
  const { data: existing, error: existingError } = await supabase
    .from("tender_deadlines")
    .select("*")
    .eq("tender_id", tender.id)
    .eq("organisation_id", tender.organisation_id)
    .eq("deadline_type", deadlineType)
    .is("completed_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  if (!dueAt) {
    if (!existing) return null

    const { data, error } = await supabase
      .from("tender_deadlines")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return data
  }

  const title = `${tender.title} ${titleSuffix}`

  if (existing) {
    const { data, error } = await supabase
      .from("tender_deadlines")
      .update({ title, due_at: dueAt, completed_at: null })
      .eq("id", existing.id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return data
  }

  const input: TenderDeadlineInsert = {
    tender_id: tender.id,
    organisation_id: tender.organisation_id,
    title,
    deadline_type: deadlineType,
    due_at: dueAt,
    created_by: tender.created_by,
  }
  const { data, error } = await supabase
    .from("tender_deadlines")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function upsertSubmissionDeadlineForTender(tender: Tender) {
  return upsertOpenTenderDeadlineForTender(
    tender,
    "submission",
    tender.submission_deadline,
    "submission"
  )
}

export async function upsertPsqDeadlineForTender(tender: Tender) {
  return upsertOpenTenderDeadlineForTender(
    tender,
    "internal_review",
    tender.psq_due_at,
    "PSQ due"
  )
}

export async function syncTenderDeadlineRowsForTender(tender: Tender) {
  await upsertPsqDeadlineForTender(tender)
  await upsertSubmissionDeadlineForTender(tender)
  await upsertOpenTenderDeadlineForTender(
    tender,
    "clarification",
    tender.final_clarification_deadline,
    "final clarification"
  )
}

export async function updateOrganisation(
  organisationId: string,
  input: OrganisationUpdate
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisations")
    .update(input)
    .eq("id", organisationId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateOrganisationSettings(
  organisationId: string,
  input: OrganisationUpdate
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisations")
    .update(input)
    .eq("id", organisationId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateProfileName(profileId: string, fullName: string) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profileId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function createOrganisation(input: {
  name: string
  slug: string
}) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc("create_organisation", {
    organisation_name: input.name,
    organisation_slug: input.slug,
  })

  if (error) throw new Error(error.message)
  if (!data) throw new Error("No organisation returned.")

  return data
}

export async function createInvitation(input: OrganisationInvitationInsert) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisation_invitations")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

async function invokeTenderFlowFunction<T>(
  functionName: string,
  body: Record<string, unknown>
) {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase.functions.invoke<
    EdgeFunctionResponse<T>
  >(functionName, { body })

  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error.message)
  if (!data?.data) throw new Error("No response returned.")

  return data.data
}

export async function inviteMember(input: {
  organisationId: string
  email: string
  role: OrganisationMember["role"]
  message?: string | null
}) {
  return invokeTenderFlowFunction<OrganisationInvitation>(
    "invite-member",
    input
  )
}

export async function acceptInvitation(tokenOrInvitationId: string) {
  return invokeTenderFlowFunction<{
    organisationId: string
    membershipId: string
  }>("accept-invite", { tokenOrInvitationId })
}

export async function updateInvitationStatus(
  invitationId: string,
  input: OrganisationInvitationUpdate
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisation_invitations")
    .update(input)
    .eq("id", invitationId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateMemberRole(
  memberId: string,
  input: OrganisationMemberUpdate
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisation_members")
    .update(input)
    .eq("id", memberId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function removeOrganisationMember(memberId: string) {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase
    .from("organisation_members")
    .delete()
    .eq("id", memberId)

  if (error) throw new Error(error.message)
}

export async function createSettingsAccessRequest(
  input: SettingsAccessRequestInsert
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("settings_access_requests")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function resolveSettingsAccessRequest(
  requestId: string,
  input: SettingsAccessRequestUpdate
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("settings_access_requests")
    .update(input)
    .eq("id", requestId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateOrganisationNotificationSettings(
  input: OrganisationNotificationSettingsInsert
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("organisation_notification_settings")
    .upsert(input, { onConflict: "organisation_id" })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateMemberNotificationPreference(
  input: MemberNotificationPreferenceInsert
) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("member_notification_preferences")
    .upsert(input, { onConflict: "organisation_id,user_id" })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function createTelegramLink() {
  return invokeTenderFlowFunction<{ url: string; expiresAt: string }>(
    "create-telegram-link",
    {}
  )
}

export async function unlinkTelegramAccount(userId: string) {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase
    .from("telegram_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null)

  if (error) throw new Error(error.message)
}

export async function logTenderActivity(input: TenderActivityInsert) {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from("tender_activity")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "GBP"
) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function formatShortCurrency(value: number | null | undefined) {
  const numericValue = Number(value ?? 0)

  if (numericValue >= 1000000) {
    return `£${(numericValue / 1000000).toFixed(1)}M`
  }

  if (numericValue >= 1000) {
    return `£${Math.round(numericValue / 1000)}k`
  }

  return formatCurrency(numericValue)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Awaiting"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Awaiting"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function labelFromValue(value: string) {
  const acronymLabels: Record<string, string> = {
    itt: "ITT",
    psq: "PSQ",
  }

  if (acronymLabels[value]) return acronymLabels[value]

  return value
    .split("_")
    .map(
      (part) =>
        acronymLabels[part] ?? part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ")
}

export function profileName(profiles: Profile[], profileId: string | null) {
  const profile = profiles.find((item) => item.id === profileId)

  return profile?.full_name ?? profile?.email ?? "Unassigned"
}

export function activeTenders(tenders: Tender[]) {
  return tenders.filter(
    (tender) =>
      !isTerminalStage(tender.stage) && tender.status !== "closed"
  )
}

export function primaryDeadline(tender: Tender, deadlines: TenderDeadline[]) {
  return (
    deadlines
      .filter(
        (deadline) => deadline.tender_id === tender.id && !deadline.completed_at
      )
      .sort(
        (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      )[0]?.due_at ?? tender.submission_deadline
  )
}

export function activityDetail(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return ""

  const detail = metadata.detail ?? metadata.title

  return typeof detail === "string" ? detail : ""
}
