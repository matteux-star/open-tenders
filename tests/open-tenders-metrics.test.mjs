import assert from "node:assert/strict"
import test from "node:test"

import {
  calendarDeadlineEvents,
  calendarEventsForDay,
  calendarMonthDays,
  dashboardCommandCentre,
  insightSummary,
  insightTrend,
  isOperationallyOverdue,
  isStaleLiveTender,
  nextMilestone,
  ownerWorkload,
  outcomeBreakdown,
  pipelineByStage,
  priorityActionGroups,
  relativeDateLabel,
  tendersCreatedInPeriod,
  upcomingMilestones,
  valueAtRisk,
} from "../lib/open-tenders-metrics.js"

function tender({
  id,
  createdAt = "2026-05-01T09:00:00.000Z",
  updatedAt = "2026-05-20T09:00:00.000Z",
  title,
  buyerName,
  ownerId = "owner-1",
  estimatedValue = null,
  stage = "itt",
  status = "on_track",
  submissionDeadline = null,
  psqDueAt = null,
  ittDueAt = null,
  finalClarificationDeadline = null,
}) {
  return {
    id,
    title: title ?? id,
    buyer_name: buyerName ?? `${id} buyer`,
    created_at: createdAt,
    updated_at: updatedAt,
    estimated_value: estimatedValue,
    currency: "GBP",
    owner_id: ownerId,
    stage,
    status,
    submission_deadline: submissionDeadline,
    psq_due_at: psqDueAt,
    itt_due_at: ittDueAt,
    final_clarification_deadline: finalClarificationDeadline,
  }
}

function deadline({
  id,
  tenderId,
  type = "submission",
  dueAt,
  completedAt = null,
}) {
  return {
    id,
    tender_id: tenderId,
    title: `${type} deadline`,
    deadline_type: type,
    due_at: dueAt,
    completed_at: completedAt,
  }
}

test("insight summary defaults to all supplied tenders and uses contract value for won tenders", () => {
  const tenders = [
    tender({
      id: "won-1",
      createdAt: "2024-01-02T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "won",
      status: "closed",
    }),
    tender({
      id: "lost-1",
      createdAt: "2024-02-02T09:00:00.000Z",
      estimatedValue: 50000,
      stage: "lost",
      status: "closed",
    }),
    tender({
      id: "open-1",
      createdAt: "2025-01-02T09:00:00.000Z",
      estimatedValue: 25000,
      stage: "itt",
    }),
  ]
  const contracts = [{ tender_id: "won-1", value: 125000 }]

  const summary = insightSummary(tenders, contracts)

  assert.equal(summary.createdCount, 3)
  assert.equal(summary.createdValue, 175000)
  assert.equal(summary.wonCount, 1)
  assert.equal(summary.wonValue, 125000)
  assert.equal(summary.winRate, 50)
})

test("submitted value includes tenders that reached submission or outcome stages", () => {
  const tenders = [
    tender({
      id: "submitted",
      createdAt: "2025-01-02T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "submitted",
      status: "submitted",
    }),
    tender({
      id: "presentation",
      createdAt: "2025-01-03T09:00:00.000Z",
      estimatedValue: 150000,
      stage: "presentation",
      status: "at_risk",
    }),
    tender({
      id: "award",
      createdAt: "2025-01-04T09:00:00.000Z",
      estimatedValue: 200000,
      stage: "award",
      status: "awaiting_result",
    }),
    tender({
      id: "won",
      createdAt: "2025-01-05T09:00:00.000Z",
      estimatedValue: 250000,
      stage: "won",
      status: "closed",
    }),
    tender({
      id: "no-bid",
      createdAt: "2025-01-06T09:00:00.000Z",
      estimatedValue: 300000,
      stage: "no_bid",
      status: "closed",
    }),
  ]

  const summary = insightSummary(tenders)

  assert.equal(summary.submittedCount, 4)
  assert.equal(summary.submittedValue, 700000)
})

test("all-time period returns every tender while month period keeps current cohort", () => {
  const tenders = [
    tender({
      id: "old",
      createdAt: "2024-01-02T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "won",
      status: "closed",
    }),
    tender({
      id: "current",
      createdAt: "2026-05-03T09:00:00.000Z",
      estimatedValue: 200000,
      stage: "itt",
    }),
  ]
  const now = new Date("2026-05-25T12:00:00.000Z")

  assert.deepEqual(
    tendersCreatedInPeriod(tenders, "all", now).map((item) => item.id),
    ["old", "current"]
  )
  assert.deepEqual(
    tendersCreatedInPeriod(tenders, "month", now).map((item) => item.id),
    ["current"]
  )
})

test("all-time trend creates yearly buckets with counts and contract-aware won values", () => {
  const tenders = [
    tender({
      id: "won-2024",
      createdAt: "2024-01-02T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "won",
      status: "closed",
    }),
    tender({
      id: "award-2025",
      createdAt: "2025-03-02T09:00:00.000Z",
      estimatedValue: 200000,
      stage: "award",
      status: "awaiting_result",
    }),
  ]
  const contracts = [{ tender_id: "won-2024", value: 150000 }]

  const trend = insightTrend(tenders, "all", new Date("2026-05-25"), contracts)

  assert.deepEqual(trend, [
    {
      label: "2024",
      createdCount: 1,
      createdValue: 100000,
      submittedCount: 1,
      submittedValue: 100000,
      wonCount: 1,
      wonValue: 150000,
    },
    {
      label: "2025",
      createdCount: 1,
      createdValue: 200000,
      submittedCount: 1,
      submittedValue: 200000,
      wonCount: 0,
      wonValue: 0,
    },
  ])
})

test("outcome breakdown uses contract-aware won value and estimated lost value", () => {
  const outcomes = outcomeBreakdown(
    [
      tender({
        id: "won-1",
        createdAt: "2025-01-02T09:00:00.000Z",
        estimatedValue: 100000,
        stage: "won",
        status: "closed",
      }),
      tender({
        id: "lost-1",
        createdAt: "2025-01-03T09:00:00.000Z",
        estimatedValue: 100000,
        stage: "lost",
        status: "closed",
      }),
      tender({
        id: "withdrawn-1",
        createdAt: "2025-01-04T09:00:00.000Z",
        estimatedValue: 50000,
        stage: "withdrawn",
        status: "closed",
      }),
      tender({
        id: "no-bid-1",
        createdAt: "2025-01-05T09:00:00.000Z",
        estimatedValue: 75000,
        stage: "no_bid",
        status: "closed",
      }),
    ],
    [{ tender_id: "won-1", value: 300000 }]
  )

  assert.deepEqual(outcomes, [
    { outcome: "won", label: "Won", count: 1, value: 300000, progress: 75 },
    { outcome: "lost", label: "Lost", count: 1, value: 100000, progress: 25 },
  ])
})

test("outcome breakdown always returns zero-state won and lost rows", () => {
  const outcomes = outcomeBreakdown([
    tender({
      id: "itt",
      createdAt: "2025-01-02T09:00:00.000Z",
      estimatedValue: 300000,
      stage: "itt",
    }),
    tender({
      id: "psq",
      createdAt: "2025-01-03T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "psq",
    }),
  ])

  assert.deepEqual(outcomes, [
    { outcome: "won", label: "Won", count: 0, value: 0, progress: 0 },
    { outcome: "lost", label: "Lost", count: 0, value: 0, progress: 0 },
  ])
})

test("dashboard next milestone and relative labels use open deadlines before submission fallback", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const liveTender = tender({
    id: "deadline-source",
    submissionDeadline: "2026-06-30T12:00:00.000Z",
  })
  const milestone = nextMilestone(liveTender, [
    deadline({
      id: "later",
      tenderId: "deadline-source",
      type: "submission",
      dueAt: "2026-06-30T12:00:00.000Z",
    }),
    deadline({
      id: "first",
      tenderId: "deadline-source",
      type: "clarification",
      dueAt: "2026-05-31T12:00:00.000Z",
    }),
  ], now)

  assert.equal(milestone.label, "Clarification deadline")
  assert.equal(milestone.relativeLabel, "due in 6 days")
  assert.equal(relativeDateLabel("2026-05-25T12:00:00.000Z", now), "due today")
  assert.equal(relativeDateLabel("2026-05-26T12:00:00.000Z", now), "due tomorrow")
  assert.equal(relativeDateLabel("2026-05-23T12:00:00.000Z", now), "missed by 2 days")
  assert.equal(
    relativeDateLabel("2026-05-20T12:00:00.000Z", now, { mode: "updated" }),
    "last updated 5 days ago"
  )
})

test("dashboard overdue and stale rules split recent action from old cleanup", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const recentOverdue = tender({ id: "recent-overdue" })
  const staleOverdue = tender({ id: "stale-overdue" })
  const updatedOld = tender({
    id: "updated-old",
    submissionDeadline: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-04-10T12:00:00.000Z",
  })
  const deadlines = [
    deadline({
      id: "recent-deadline",
      tenderId: "recent-overdue",
      dueAt: "2026-05-20T12:00:00.000Z",
    }),
    deadline({
      id: "stale-deadline",
      tenderId: "stale-overdue",
      dueAt: "2026-04-01T12:00:00.000Z",
    }),
  ]

  assert.equal(isOperationallyOverdue(recentOverdue, deadlines, now), true)
  assert.equal(isStaleLiveTender(recentOverdue, deadlines, now), false)
  assert.equal(isOperationallyOverdue(staleOverdue, deadlines, now), false)
  assert.equal(isStaleLiveTender(staleOverdue, deadlines, now), true)
  assert.equal(isStaleLiveTender(updatedOld, [], now), true)
})

test("priority action groups separate critical, update, at-risk, and stale work", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const tenders = [
    tender({ id: "critical-blocked", status: "blocked" }),
    tender({ id: "needs-update" }),
    tender({ id: "risk-no-owner", ownerId: null }),
    tender({ id: "old-stale", status: "blocked" }),
    tender({ id: "healthy", submissionDeadline: "2026-07-01T12:00:00.000Z" }),
  ]
  const deadlines = [
    deadline({
      id: "critical-deadline",
      tenderId: "critical-blocked",
      dueAt: "2026-05-24T12:00:00.000Z",
    }),
    deadline({
      id: "update-deadline",
      tenderId: "needs-update",
      dueAt: "2026-05-18T12:00:00.000Z",
    }),
    deadline({
      id: "risk-deadline",
      tenderId: "risk-no-owner",
      dueAt: "2026-06-10T12:00:00.000Z",
    }),
    deadline({
      id: "old-deadline",
      tenderId: "old-stale",
      dueAt: "2026-03-01T12:00:00.000Z",
    }),
  ]
  const groups = priorityActionGroups(tenders, deadlines, [], now)

  assert.deepEqual(groups.critical.map((item) => item.tender.id), ["critical-blocked"])
  assert.deepEqual(groups.needsUpdate.map((item) => item.tender.id), ["needs-update"])
  assert.deepEqual(groups.atRisk.map((item) => item.tender.id), ["risk-no-owner"])
  assert.deepEqual(groups.stale.map((item) => item.tender.id), ["old-stale"])
  assert.match(groups.stale[0].reason, /long past/)
})

test("owner workload groups and sorts pressure across live tenders", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const tenders = [
    tender({ id: "matt-blocked", ownerId: "owner-matt", status: "blocked" }),
    tender({ id: "matt-due", ownerId: "owner-matt" }),
    tender({ id: "sam-healthy", ownerId: "owner-sam" }),
    tender({ id: "no-owner", ownerId: null }),
  ]
  const deadlines = [
    deadline({
      id: "blocked-due",
      tenderId: "matt-blocked",
      dueAt: "2026-05-24T12:00:00.000Z",
    }),
    deadline({
      id: "due-soon",
      tenderId: "matt-due",
      dueAt: "2026-05-28T12:00:00.000Z",
    }),
  ]
  const profiles = [
    { id: "owner-matt", full_name: "Matt", email: "matt@example.com" },
    { id: "owner-sam", full_name: "Sam", email: "sam@example.com" },
  ]

  const workload = ownerWorkload(tenders, deadlines, profiles, now)

  assert.equal(workload[0].ownerName, "Matt")
  assert.equal(workload[0].liveCount, 2)
  assert.equal(workload[0].blockedCount, 1)
  assert.equal(workload[0].overdueCount, 1)
  assert.equal(workload[0].dueNext7DaysCount, 1)
  assert.equal(workload.some((item) => item.ownerName === "Unassigned"), true)
})

test("pipeline and value-at-risk summaries use live tenders once with real values only", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const tenders = [
    tender({ id: "big-blocked", stage: "itt", status: "blocked", estimatedValue: 500000 }),
    tender({ id: "small-risk", stage: "itt", status: "at_risk", estimatedValue: 75000 }),
    tender({ id: "no-value-risk", stage: "psq", status: "blocked", estimatedValue: null }),
    tender({ id: "won-closed", stage: "won", status: "closed", estimatedValue: 900000 }),
  ]

  const pipeline = pipelineByStage(tenders, [], now)
  const riskValue = valueAtRisk(tenders, [], now)

  assert.equal(pipeline.reduce((total, row) => total + row.count, 0), 3)
  assert.deepEqual(riskValue.map((item) => item.tender.id), [
    "big-blocked",
    "small-risk",
  ])
  assert.equal(riskValue[0].value, 500000)
})

test("upcoming milestones return selected windows and next fallback", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")
  const tenders = [
    tender({ id: "six-days" }),
    tender({ id: "twenty-days" }),
    tender({ id: "forty-days" }),
  ]
  const deadlines = [
    deadline({
      id: "six",
      tenderId: "six-days",
      dueAt: "2026-05-31T12:00:00.000Z",
    }),
    deadline({
      id: "twenty",
      tenderId: "twenty-days",
      dueAt: "2026-06-14T12:00:00.000Z",
    }),
    deadline({
      id: "forty",
      tenderId: "forty-days",
      dueAt: "2026-07-04T12:00:00.000Z",
    }),
  ]

  assert.deepEqual(
    upcomingMilestones(tenders, deadlines, now, 7).items.map((item) => item.tender.id),
    ["six-days"]
  )
  assert.deepEqual(
    upcomingMilestones(tenders, deadlines, now, 14).items.map((item) => item.tender.id),
    ["six-days"]
  )
  assert.deepEqual(
    upcomingMilestones(tenders, deadlines, now, 30).items.map((item) => item.tender.id),
    ["six-days", "twenty-days"]
  )
  assert.equal(
    upcomingMilestones(tenders.slice(2), deadlines, now, 7).nextUpcoming.tender.id,
    "forty-days"
  )
})

test("dashboard command centre aggregates empty and populated workspace state", () => {
  const now = new Date("2026-05-25T12:00:00.000Z")

  assert.equal(dashboardCommandCentre([], [], [], [], now).isEmpty, true)

  const tenders = [
    tender({ id: "blocked", status: "blocked", estimatedValue: 400000 }),
    tender({ id: "unassigned", ownerId: null, submissionDeadline: "2026-05-30T12:00:00.000Z" }),
    tender({ id: "closed", stage: "lost", status: "closed", estimatedValue: 1000000 }),
  ]
  const summary = dashboardCommandCentre(tenders, [], [], [], now)

  assert.equal(summary.isEmpty, false)
  assert.equal(summary.kpis.liveTenders.count, 2)
  assert.equal(summary.kpis.unassigned.count, 1)
  assert.equal(summary.hasValueData, true)
  assert.equal(summary.valueAtRisk[0].tender.id, "blocked")
})

test("calendar deadline events default to an empty operational calendar", () => {
  assert.deepEqual(calendarDeadlineEvents([]), [])
  assert.equal(
    calendarMonthDays([], new Date("2027-01-15T12:00:00.000Z")).length,
    35
  )
})

test("calendar deadline events include live explicit tender dates only", () => {
  const tenders = [
    tender({
      id: "psq-live",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: 100000,
      stage: "identified",
      title: "PSQ Workspace",
      psqDueAt: "2027-01-27T12:00:00.000Z",
    }),
    tender({
      id: "itt-live",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: 200000,
      stage: "presentation",
      title: "ITT Workspace",
      ittDueAt: "2027-01-28T12:00:00.000Z",
      finalClarificationDeadline: "2027-01-26T12:00:00.000Z",
    }),
    tender({
      id: "won-closed",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: 300000,
      stage: "won",
      status: "closed",
      title: "Won Workspace",
      ittDueAt: "2027-01-23T12:00:00.000Z",
    }),
  ]

  const events = calendarDeadlineEvents(tenders)

  assert.deepEqual(
    events.map((event) => event.id),
    ["final-clarification-itt-live", "psq-due-psq-live", "itt-due-itt-live"]
  )
  assert.deepEqual(
    events.map((event) => event.label),
    [
      "Final Clarification - ITT Workspace",
      "PSQ Due - PSQ Workspace",
      "ITT Due - ITT Workspace",
    ]
  )
})

test("calendar deadline events do not fall back to legacy submission deadline rows", () => {
  const tenders = [
    tender({
      id: "fallback",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      submissionDeadline: "2027-01-28T12:00:00.000Z",
      title: "Fallback ITT",
    }),
  ]

  assert.deepEqual(calendarDeadlineEvents(tenders), [])
})

test("calendar deadline labels reflect explicit PSQ, ITT, and final clarification dates", () => {
  const tenders = [
    tender({
      id: "psq",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "identified",
      title: "PSQ Tender",
      psqDueAt: "2027-01-27T09:00:00.000Z",
    }),
    tender({
      id: "itt",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "psq",
      title: "ITT Tender",
      ittDueAt: "2027-01-27T10:00:00.000Z",
      finalClarificationDeadline: "2027-01-27T12:00:00.000Z",
    }),
  ]

  const events = calendarDeadlineEvents(tenders)

  assert.deepEqual(
    events.map((event) => [event.eventType, event.label, event.tone]),
    [
      ["psq", "PSQ Due - PSQ Tender", "sky"],
      ["itt", "ITT Due - ITT Tender", "primary"],
      ["clarification", "Final Clarification - ITT Tender", "amber"],
    ]
  )
})

test("calendar event meaning is stable when tender stage changes", () => {
  const baseTender = tender({
    id: "stable",
    createdAt: "2027-01-01T09:00:00.000Z",
    estimatedValue: null,
    stage: "psq",
    title: "Stable Tender",
    psqDueAt: "2027-01-20T09:00:00.000Z",
    ittDueAt: "2027-01-27T09:00:00.000Z",
  })

  const beforeStageMove = calendarDeadlineEvents([baseTender])
  const afterStageMove = calendarDeadlineEvents([
    { ...baseTender, stage: "itt", status: "urgent" },
  ])

  assert.deepEqual(
    afterStageMove.map((event) => [event.id, event.label, event.dayKey]),
    beforeStageMove.map((event) => [event.id, event.label, event.dayKey])
  )
})

test("calendar month days use a Monday-first grid and group events by local day", () => {
  const events = calendarDeadlineEvents([
    tender({
      id: "may",
      createdAt: "2027-05-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      title: "May Tender",
      ittDueAt: "2027-05-01T12:00:00.000Z",
    }),
    tender({
      id: "june",
      createdAt: "2027-05-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      title: "June Tender",
      ittDueAt: "2027-06-01T12:00:00.000Z",
    }),
  ])

  const days = calendarMonthDays(events, new Date("2027-05-15T12:00:00.000Z"))

  assert.equal(days[0].dayKey, "2027-04-26")
  assert.equal(days.at(-1).dayKey, "2027-06-06")
  assert.equal(days.length, 42)
  assert.equal(
    days.find((day) => day.dayKey === "2027-05-01").events[0].label,
    "ITT Due - May Tender"
  )
  assert.equal(
    days.find((day) => day.dayKey === "2027-06-01").inCurrentMonth,
    false
  )
})

test("calendar selected-day events are sorted by time then label", () => {
  const tenders = [
    tender({
      id: "b",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      title: "Beta",
      ittDueAt: "2027-01-27T09:00:00.000Z",
    }),
    tender({
      id: "a",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      title: "Alpha",
      ittDueAt: "2027-01-27T09:00:00.000Z",
    }),
    tender({
      id: "c",
      createdAt: "2027-01-01T09:00:00.000Z",
      estimatedValue: null,
      stage: "itt",
      title: "Gamma",
      ittDueAt: "2027-01-27T13:00:00.000Z",
    }),
  ]

  const events = calendarEventsForDay(
    calendarDeadlineEvents(tenders),
    new Date("2027-01-27T12:00:00.000Z")
  )

  assert.deepEqual(
    events.map((event) => event.id),
    ["itt-due-a", "itt-due-b", "itt-due-c"]
  )
})
