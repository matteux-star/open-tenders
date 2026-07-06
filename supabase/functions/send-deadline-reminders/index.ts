import { fail, handleOptions, ok } from "../_shared/http.ts"
import { createAdminClient } from "../_shared/supabase.ts"
import {
  deadlineReminderEventKey,
  deadlineTypeLabel,
  leadLabel,
  localDateKey,
  reminderWindowForLeadDays,
  reminderText,
  shouldProcessOrganisationReminder,
  shouldSendDeadlineReminder,
  uniqueReminderRecipients,
} from "./logic.js"

type DeliveryChannel = "email" | "telegram"
type ChannelCounts = Record<DeliveryChannel, {
  sent: number
  skipped: number
  failed: number
}>

type SendResult = {
  sent: boolean
  id?: string
  error?: string
}

async function sendEmail(input: {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey: string
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  const from = Deno.env.get("RESEND_FROM") ?? "Tender Flow <noreply@example.com>"

  if (!apiKey) return { sent: false, error: "RESEND_API_KEY is not configured." }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "OpenTenders/1.0",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: [
        { name: "event_type", value: "deadline_reminder" },
        { name: "app", value: "tender_flow" },
      ],
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

async function sendTelegram(input: {
  chatId: string
  text: string
}) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!token) return { sent: false, error: "TELEGRAM_BOT_TOKEN is not configured." }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "OpenTenders/1.0",
    },
    body: JSON.stringify({
      chat_id: input.chatId,
      text: input.text,
      disable_web_page_preview: true,
    }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok || body?.ok === false) {
    return {
      sent: false,
      error: body?.description ?? `Telegram returned ${response.status}.`,
    }
  }

  return {
    sent: true,
    id: body?.result?.message_id == null
      ? undefined
      : String(body.result.message_id),
  }
}

function appUrl() {
  return Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function emptyCounts(): ChannelCounts {
  return {
    email: { sent: 0, skipped: 0, failed: 0 },
    telegram: { sent: 0, skipped: 0, failed: 0 },
  }
}

function reminderHtml(input: {
  deadlineTitle: string
  tenderTitle: string
  organisationName: string
  deadlineType: string
  due: string
  lead: string
  tenderUrl: string
}) {
  return `
    <p><strong>${escapeHtml(input.deadlineTitle)}</strong> is due ${input.lead}.</p>
    <p>Organisation: ${escapeHtml(input.organisationName)}</p>
    <p>Tender: ${escapeHtml(input.tenderTitle)}</p>
    <p>Type: ${escapeHtml(deadlineTypeLabel(input.deadlineType))}</p>
    <p>Due: ${input.due}</p>
    <p><a href="${input.tenderUrl}">OpenTenders</a></p>
  `
}

async function recordAndSend(input: {
  supabase: ReturnType<typeof createAdminClient>
  channel: DeliveryChannel
  organisationId: string
  recipient: {
    userId: string
    email?: string | null
    telegramChatId?: string | null
  }
  deadline: {
    id: string
    title: string
    deadline_type: string
    due_at: string
  }
  tender: {
    title: string
  }
  organisationName: string
  days: number
  localDueDate: string
}) {
  const eventKey = deadlineReminderEventKey({
    deadlineId: input.deadline.id,
    channel: input.channel,
    localDueDate: input.localDueDate,
    days: input.days,
    recipientUserId: input.recipient.userId,
  })
  const recipientAddress =
    input.channel === "telegram"
      ? input.recipient.telegramChatId
      : input.recipient.email

  if (!recipientAddress) return { sent: false, skipped: true }

  const { data: delivery, error: deliveryError } = await input.supabase
    .from("notification_deliveries")
    .insert({
      organisation_id: input.organisationId,
      channel: input.channel,
      recipient_user_id: input.recipient.userId,
      recipient_address: recipientAddress,
      event_type: "deadline_reminder",
      event_key: eventKey,
      provider: input.channel === "telegram" ? "telegram" : "resend",
      metadata: {
        deadline_id: input.deadline.id,
        deadline_type: input.deadline.deadline_type,
        local_due_date: input.localDueDate,
        reminder_days: input.days,
        organisation_name: input.organisationName,
        tender_title: input.tender.title,
      },
    })
    .select("id")
    .single()

  if (deliveryError) return { sent: false, skipped: true }

  const lead = leadLabel(input.days)
  const due = new Date(input.deadline.due_at).toUTCString()
  const tenderUrl = `${appUrl().replace(/\/$/, "")}/app/tenders`
  const text = reminderText({
    deadlineTitle: input.deadline.title,
    tenderTitle: input.tender.title,
    organisationName: input.organisationName,
    deadlineType: input.deadline.deadline_type,
    due,
    lead,
    tenderUrl,
  })

  let result: SendResult
  if (input.channel === "telegram") {
    result = await sendTelegram({
      chatId: recipientAddress,
      text,
    })
  } else {
    result = await sendEmail({
      to: recipientAddress,
      subject: `Tender deadline ${lead}: ${input.deadline.title}`,
      text,
      idempotencyKey: eventKey,
      html: reminderHtml({
        deadlineTitle: input.deadline.title,
        tenderTitle: input.tender.title,
        organisationName: input.organisationName,
        deadlineType: input.deadline.deadline_type,
        due,
        lead,
        tenderUrl,
      }),
    })
  }

  await input.supabase
    .from("notification_deliveries")
    .update({
      status: result.sent ? "sent" : "failed",
      provider_message_id: result.sent ? result.id : null,
      error_message: result.sent ? null : result.error,
      sent_at: result.sent ? new Date().toISOString() : null,
    })
    .eq("id", delivery.id)

  return { sent: result.sent, skipped: false }
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  const cronSecret = Deno.env.get("CRON_SECRET")
  if (cronSecret) {
    const provided =
      req.headers.get("x-cron-secret") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    if (provided !== cronSecret) return fail("Unauthorized.", 401)
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const { data: settings, error: settingsError } = await supabase
      .from("organisation_notification_settings")
      .select("organisation_id, enabled_types, reminder_days")
    if (settingsError) throw new Error(settingsError.message)

    const counts = emptyCounts()

    for (const setting of settings ?? []) {
      const { data: organisation, error: organisationError } = await supabase
        .from("organisations")
        .select("name, timezone")
        .eq("id", setting.organisation_id)
        .maybeSingle()
      if (organisationError) throw new Error(organisationError.message)

      const timezone = organisation?.timezone ?? "Europe/London"
      if (!shouldProcessOrganisationReminder({ timezone, reminderHour: 9, now })) {
        continue
      }

      const [{ data: members, error: membersError }, { data: preferences, error: preferencesError }] =
        await Promise.all([
          supabase
            .from("organisation_members")
            .select("user_id, role, profiles(email, full_name)")
            .eq("organisation_id", setting.organisation_id),
          supabase
            .from("member_notification_preferences")
            .select("user_id, email_enabled, telegram_enabled")
            .eq("organisation_id", setting.organisation_id),
        ])
      if (membersError ?? preferencesError) {
        throw new Error((membersError ?? preferencesError)?.message)
      }

      const memberUserIds = (members ?? []).map((member) => member.user_id)
      const telegramLinksResult = memberUserIds.length
        ? await supabase
          .from("telegram_links")
          .select("user_id, telegram_chat_id, revoked_at")
          .in("user_id", memberUserIds)
          .is("revoked_at", null)
        : { data: [], error: null }
      if (telegramLinksResult.error) {
        throw new Error(telegramLinksResult.error.message)
      }

      const enabledTypes = new Set(setting.enabled_types ?? [])
      const reminderDays = setting.reminder_days ?? []

      for (const days of reminderDays) {
        const { localDate, start, end } = reminderWindowForLeadDays({
          daysFromNow: days,
          timezone,
          now,
        })
        const { data: deadlines, error: deadlineError } = await supabase
          .from("tender_deadlines")
          .select("id, title, deadline_type, due_at, completed_at, organisation_id, tenders!inner(id, title, owner_id, status, stage)")
          .eq("organisation_id", setting.organisation_id)
          .is("completed_at", null)
          .gte("due_at", start)
          .lt("due_at", end)
        if (deadlineError) throw new Error(deadlineError.message)

        for (const deadline of deadlines ?? []) {
          const tender = Array.isArray(deadline.tenders)
            ? deadline.tenders[0]
            : deadline.tenders
          const reminderCheck = shouldSendDeadlineReminder({
            deadline,
            tender,
            enabledTypes,
          })

          if (!reminderCheck.send) {
            counts.email.skipped += 1
            counts.telegram.skipped += 1
            continue
          }

          for (const channel of ["email", "telegram"] as DeliveryChannel[]) {
            const recipients = uniqueReminderRecipients({
              channel,
              tender,
              members: members ?? [],
              preferences: preferences ?? [],
              telegramLinks: telegramLinksResult.data ?? [],
            })

            if (!recipients.length) {
              counts[channel].skipped += 1
              continue
            }

            for (const recipient of recipients) {
              const result = await recordAndSend({
                supabase,
                channel,
                organisationId: setting.organisation_id,
                recipient,
                deadline,
                tender,
                organisationName: organisation?.name ?? "OpenTenders",
                days,
                localDueDate: localDateKey(deadline.due_at, timezone) ?? localDate,
              })

              if (result.skipped) counts[channel].skipped += 1
              else if (result.sent) counts[channel].sent += 1
              else counts[channel].failed += 1
            }
          }
        }
      }
    }

    return ok(counts)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not send reminders.", 500)
  }
})
