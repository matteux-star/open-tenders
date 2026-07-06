import assert from "node:assert/strict"
import test from "node:test"

import {
  deadlineReminderEventKey,
  deadlineNotificationKey,
  deadlineTypeLabel,
  leadLabel,
  localDayWindow,
  reminderWindowForLeadDays,
  reminderText,
  shouldSendDeadlineReminder,
  shouldProcessOrganisationReminder,
  uniqueReminderRecipients,
} from "../supabase/functions/send-deadline-reminders/logic.js"

const enabledTypes = new Set([
  "submission_deadline",
  "clarification_deadline",
  "internal_review_deadline",
])

test("deadlineNotificationKey maps supported tender deadline types", () => {
  assert.equal(deadlineNotificationKey("submission"), "submission_deadline")
  assert.equal(deadlineNotificationKey("clarification"), "clarification_deadline")
  assert.equal(deadlineNotificationKey("internal_review"), "internal_review_deadline")
  assert.equal(deadlineNotificationKey("site_visit"), null)
})

test("shouldSendDeadlineReminder skips inactive tenders, completed deadlines, and disabled types", () => {
  const deadline = {
    completed_at: null,
    deadline_type: "submission",
  }
  const tender = {
    status: "on_track",
    stage: "itt",
  }

  assert.deepEqual(
    shouldSendDeadlineReminder({ deadline, tender, enabledTypes }),
    { send: true, notificationKey: "submission_deadline" }
  )
  assert.equal(
    shouldSendDeadlineReminder({
      deadline,
      tender: { ...tender, stage: "won" },
      enabledTypes,
    }).reason,
    "inactive_tender"
  )
  assert.equal(
    shouldSendDeadlineReminder({
      deadline: { ...deadline, completed_at: "2026-05-13T10:00:00Z" },
      tender,
      enabledTypes,
    }).reason,
    "completed_deadline"
  )
  assert.equal(
    shouldSendDeadlineReminder({
      deadline: { ...deadline, deadline_type: "site_visit" },
      tender,
      enabledTypes,
    }).reason,
    "disabled_type"
  )
})

test("uniqueReminderRecipients selects owner plus admins and deduplicates overlap", () => {
  const recipients = uniqueReminderRecipients({
    tender: { owner_id: "admin-owner" },
    members: [
      member("admin-owner", "admin", "owner@example.com"),
      member("admin", "admin", "admin@example.com"),
      member("editor", "editor", "editor@example.com"),
      member("ownerless-email", "viewer", null),
    ],
    preferences: [],
  })

  assert.deepEqual(
    recipients.map((recipient) => recipient.email),
    ["owner@example.com", "admin@example.com"]
  )
})

test("uniqueReminderRecipients sends unowned tender reminders to opted-in admins only", () => {
  const recipients = uniqueReminderRecipients({
    tender: { owner_id: null },
    members: [
      member("admin", "admin", "admin@example.com"),
      member("disabled-admin", "admin", "disabled@example.com"),
      member("editor", "editor", "editor@example.com"),
    ],
    preferences: [{ user_id: "disabled-admin", email_enabled: false }],
  })

  assert.deepEqual(recipients, [
    { userId: "admin", email: "admin@example.com", name: "admin" },
  ])
})

test("uniqueReminderRecipients selects linked Telegram users who opted in", () => {
  const recipients = uniqueReminderRecipients({
    channel: "telegram",
    tender: { owner_id: "owner" },
    members: [
      member("owner", "editor", "owner@example.com"),
      member("admin", "admin", "admin@example.com"),
      member("disabled-admin", "admin", "disabled@example.com"),
      member("unlinked-admin", "admin", "unlinked@example.com"),
      member("viewer", "viewer", "viewer@example.com"),
    ],
    preferences: [
      { user_id: "owner", telegram_enabled: true },
      { user_id: "admin", telegram_enabled: true },
      { user_id: "disabled-admin", telegram_enabled: false },
      { user_id: "unlinked-admin", telegram_enabled: true },
    ],
    telegramLinks: [
      { user_id: "owner", telegram_chat_id: "111", revoked_at: null },
      { user_id: "admin", telegram_chat_id: "222", revoked_at: null },
      { user_id: "disabled-admin", telegram_chat_id: "333", revoked_at: null },
      { user_id: "viewer", telegram_chat_id: "444", revoked_at: null },
    ],
  })

  assert.deepEqual(recipients, [
    {
      userId: "owner",
      email: "owner@example.com",
      name: "owner",
      telegramChatId: "111",
    },
    {
      userId: "admin",
      email: "admin@example.com",
      name: "admin",
      telegramChatId: "222",
    },
  ])
})

test("leadLabel formats zero, singular, and plural reminders", () => {
  assert.equal(leadLabel(0), "today")
  assert.equal(leadLabel(1), "in 1 day")
  assert.equal(leadLabel(14), "in 14 days")
})

test("deadlineTypeLabel formats snake case deadline types", () => {
  assert.equal(deadlineTypeLabel("internal_review"), "Internal Review")
  assert.equal(deadlineTypeLabel("clarification"), "Clarification")
})

test("reminderText includes organisation name and readable spacing", () => {
  assert.equal(
    reminderText({
      organisationName: "Acme Council",
      tenderTitle: "Test 1",
      deadlineTitle: "Final Clarification",
      deadlineType: "clarification",
      due: "Tue, 30 Jun 2026 16:20:00 GMT",
      lead: "in 14 days",
      tenderUrl: "https://tender-flow.co.uk/app/tenders",
    }),
    [
      "OpenTenders deadline reminder",
      "",
      "Organisation: Acme Council",
      "Tender: Test 1",
      "Deadline: Final Clarification",
      "Type: Clarification",
      "Due: Tue, 30 Jun 2026 16:20:00 GMT",
      "Reminder: in 14 days",
      "",
      "OpenTenders:",
      "https://tender-flow.co.uk/app/tenders",
    ].join("\n")
  )
})

test("localDayWindow handles Europe/London daylight saving transitions", () => {
  assert.deepEqual(localDayWindow("2026-03-29", "Europe/London"), {
    start: "2026-03-29T00:00:00.000Z",
    end: "2026-03-29T23:00:00.000Z",
  })

  assert.deepEqual(localDayWindow("2026-10-25", "Europe/London"), {
    start: "2026-10-24T23:00:00.000Z",
    end: "2026-10-26T00:00:00.000Z",
  })
})

test("reminderWindowForLeadDays matches deadlines by organisation local day", () => {
  assert.deepEqual(
    reminderWindowForLeadDays({
      daysFromNow: 7,
      timezone: "Europe/London",
      now: new Date("2026-03-29T08:00:00.000Z"),
    }),
    {
      localDate: "2026-04-05",
      start: "2026-04-04T23:00:00.000Z",
      end: "2026-04-05T23:00:00.000Z",
    }
  )
})

test("shouldProcessOrganisationReminder waits until the local reminder hour", () => {
  assert.equal(
    shouldProcessOrganisationReminder({
      timezone: "Europe/London",
      reminderHour: 9,
      now: new Date("2026-03-29T07:59:00.000Z"),
    }),
    false
  )
  assert.equal(
    shouldProcessOrganisationReminder({
      timezone: "Europe/London",
      reminderHour: 9,
      now: new Date("2026-03-29T08:00:00.000Z"),
    }),
    true
  )
})

test("deadlineReminderEventKey includes channel and local due date", () => {
  const base = {
    deadlineId: "deadline-1",
    localDueDate: "2026-03-30",
    days: 7,
    recipientUserId: "user-1",
  }

  assert.equal(
    deadlineReminderEventKey({ ...base, channel: "email" }),
    "deadline:email:deadline-1:2026-03-30:7:user-1"
  )
  assert.notEqual(
    deadlineReminderEventKey({ ...base, channel: "email" }),
    deadlineReminderEventKey({
      ...base,
      channel: "telegram",
    })
  )
  assert.notEqual(
    deadlineReminderEventKey({ ...base, channel: "email" }),
    deadlineReminderEventKey({
      ...base,
      channel: "email",
      localDueDate: "2026-03-31",
    })
  )
})

function member(userId, role, email) {
  return {
    user_id: userId,
    role,
    profiles: {
      email,
      full_name: userId,
    },
  }
}
