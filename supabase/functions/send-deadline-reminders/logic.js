export const terminalStages = new Set(["won", "lost", "withdrawn", "no_bid"])
export const notificationChannels = new Set(["email", "telegram"])

export const deadlineNotificationKeys = {
  submission: "submission_deadline",
  clarification: "clarification_deadline",
  internal_review: "internal_review_deadline",
  renewal: "renewal_window",
}

export function deadlineNotificationKey(deadlineType) {
  return deadlineNotificationKeys[deadlineType] ?? null
}

export function isTenderOpen(tender) {
  return Boolean(
    tender &&
      tender.status !== "closed" &&
      !terminalStages.has(tender.stage)
  )
}

export function leadLabel(days) {
  if (days === 0) return "today"
  if (days === 1) return "in 1 day"
  return `in ${days} days`
}

export function deadlineTypeLabel(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/**
 * @param {{
 *   deadlineTitle: string,
 *   tenderTitle: string,
 *   organisationName: string,
 *   deadlineType: string,
 *   due: string,
 *   lead: string,
 *   tenderUrl: string
 * }} input
 */
export function reminderText(input) {
  return [
    "OpenTenders deadline reminder",
    "",
    `Organisation: ${input.organisationName}`,
    `Tender: ${input.tenderTitle}`,
    `Deadline: ${input.deadlineTitle}`,
    `Type: ${deadlineTypeLabel(input.deadlineType)}`,
    `Due: ${input.due}`,
    `Reminder: ${input.lead}`,
    "",
    "OpenTenders:",
    input.tenderUrl,
  ].join("\n")
}

function dateTimeParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  )

  return {
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour,
    minute: value.minute,
    second: value.second,
  }
}

export function localDateKey(value, timezone = "Europe/London") {
  const date = value instanceof Date ? value : new Date(value)
  const parts = dateTimeParts(date, timezone)
  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-")
}

function localDateToUtc(localDate, timezone) {
  const [year, month, day] = localDate.split("-").map(Number)
  const targetUtc = Date.UTC(year, month - 1, day, 0, 0, 0)
  let guess = new Date(targetUtc)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = dateTimeParts(guess, timezone)
    const actualUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
    const diff = actualUtc - targetUtc
    if (diff === 0) break
    guess = new Date(guess.getTime() - diff)
  }

  return guess
}

function addLocalDays(localDate, days) {
  const [year, month, day] = localDate.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0))
  return date.toISOString().slice(0, 10)
}

export function localDayWindow(localDate, timezone = "Europe/London") {
  const start = localDateToUtc(localDate, timezone)
  const end = localDateToUtc(addLocalDays(localDate, 1), timezone)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export function reminderWindowForLeadDays({
  daysFromNow,
  timezone = "Europe/London",
  now = new Date(),
}) {
  const localDate = addLocalDays(localDateKey(now, timezone), daysFromNow)
  const window = localDayWindow(localDate, timezone)

  return {
    localDate,
    ...window,
  }
}

export function shouldProcessOrganisationReminder({
  timezone = "Europe/London",
  reminderHour = 9,
  now = new Date(),
}) {
  return dateTimeParts(now, timezone).hour >= reminderHour
}

export function sameDayWindow(daysFromNow, now = new Date()) {
  const window = reminderWindowForLeadDays({
    daysFromNow,
    timezone: "UTC",
    now,
  })

  return { start: window.start, end: window.end }
}

/**
 * @param {{
 *   channel?: "email" | "telegram",
 *   tender: Record<string, unknown>,
 *   members: Array<Record<string, unknown>>,
 *   preferences: Array<Record<string, unknown>>,
 *   telegramLinks?: Array<Record<string, unknown>>
 * }} input
 */
export function uniqueReminderRecipients({
  channel = "email",
  tender,
  members,
  preferences,
  telegramLinks = [],
}) {
  const preferenceByUser = new Map(
    preferences.map((preference) => [preference.user_id, preference])
  )
  const telegramLinkByUser = new Map(
    telegramLinks
      .filter((link) => link.telegram_chat_id && !link.revoked_at)
      .map((link) => [link.user_id, link])
  )
  const selected = new Map()

  for (const member of members) {
    const preference = preferenceByUser.get(member.user_id)
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles
    const email = profile?.email
    const isAdmin = member.role === "admin"
    const isOwner = Boolean(tender.owner_id && member.user_id === tender.owner_id)

    if (!isAdmin && !isOwner) {
      continue
    }

    if (channel === "telegram") {
      const telegramLink = telegramLinkByUser.get(member.user_id)
      if (!preference?.telegram_enabled || !telegramLink) {
        continue
      }

      selected.set(member.user_id, {
        userId: member.user_id,
        email: email ?? null,
        name: profile?.full_name ?? null,
        telegramChatId: telegramLink.telegram_chat_id,
      })
      continue
    }

    if (!email || preference?.email_enabled === false) {
      continue
    }

    selected.set(member.user_id, {
      userId: member.user_id,
      email,
      name: profile?.full_name ?? null,
    })
  }

  return [...selected.values()]
}

export function deadlineReminderEventKey({
  deadlineId,
  channel,
  localDueDate,
  days,
  recipientUserId,
}) {
  return `deadline:${channel}:${deadlineId}:${localDueDate}:${days}:${recipientUserId}`
}

export function shouldSendDeadlineReminder({ deadline, tender, enabledTypes }) {
  if (!isTenderOpen(tender)) {
    return { send: false, reason: "inactive_tender" }
  }

  if (deadline.completed_at) {
    return { send: false, reason: "completed_deadline" }
  }

  const notificationKey = deadlineNotificationKey(deadline.deadline_type)
  if (!notificationKey || !enabledTypes.has(notificationKey)) {
    return { send: false, reason: "disabled_type" }
  }

  return { send: true, notificationKey }
}
