import {
  hasReachedSubmission,
  isTerminalStage,
} from "./tender-lifecycle.js"

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + days)
  return nextDate
}

export function calendarDayKey(value) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function openDeadlines(deadlines) {
  return deadlines.filter((deadline) => !deadline.completed_at)
}

export function isRiskTender(tender) {
  return ["blocked", "urgent", "at_risk"].includes(tender.status)
}

export function isTerminalTender(tender) {
  return isTerminalStage(tender.stage) || tender.status === "closed"
}

export function dueBefore(value, date) {
  if (!value) return false
  return new Date(value).getTime() < date.getTime()
}

export function dueWithin(value, start, end) {
  if (!value) return false

  const time = new Date(value).getTime()

  return time >= start.getTime() && time <= end.getTime()
}

export function dashboardWindow(now = new Date()) {
  const today = startOfDay(now)
  const weekEnd = addDays(today, 7)

  return { today, weekEnd }
}

function activeTenders(tenders) {
  return tenders.filter(
    (tender) => !isTerminalStage(tender.stage) && tender.status !== "closed"
  )
}

function primaryDeadline(tender, deadlines) {
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

export function tenderDeadlineTime(tender, deadlines) {
  const value = primaryDeadline(tender, deadlines)

  if (!value) return Number.POSITIVE_INFINITY

  const time = new Date(value).getTime()

  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

export function tenderAttentionRank(tender, deadlines, now = new Date()) {
  const deadline = primaryDeadline(tender, deadlines)

  if (tender.status === "blocked") return 0
  if (tender.status === "urgent") return 1
  if (tender.status === "at_risk") return 2
  if (dueBefore(deadline, now)) return 3
  if (!tender.owner_id) return 4

  return 5
}

export function attentionTenders(tenders, deadlines, now = new Date()) {
  return activeTenders(tenders)
    .filter((tender) => {
      const deadline = primaryDeadline(tender, deadlines)

      return (
        isRiskTender(tender) || dueBefore(deadline, now) || !tender.owner_id
      )
    })
    .sort((a, b) => {
      const rankDifference =
        tenderAttentionRank(a, deadlines, now) -
        tenderAttentionRank(b, deadlines, now)

      if (rankDifference !== 0) return rankDifference

      return tenderDeadlineTime(a, deadlines) - tenderDeadlineTime(b, deadlines)
    })
}

const calendarDateDefinitions = Object.freeze([
  {
    dateField: "psq_due_at",
    eventType: "psq",
    prefix: "PSQ Due",
    tone: "sky",
    idPrefix: "psq-due",
  },
  {
    dateField: "itt_due_at",
    eventType: "itt",
    prefix: "ITT Due",
    tone: "primary",
    idPrefix: "itt-due",
  },
  {
    dateField: "final_clarification_deadline",
    eventType: "clarification",
    prefix: "Final Clarification",
    tone: "amber",
    idPrefix: "final-clarification",
  },
])

function calendarEventFromTenderDate(tender, definition) {
  const value = tender[definition.dateField]
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return {
    id: `${definition.idPrefix}-${tender.id}`,
    source: "tender",
    deadlineId: null,
    deadlineType: definition.eventType,
    dateField: definition.dateField,
    tenderId: tender.id,
    tender,
    title: tender.title,
    buyerName: tender.buyer_name,
    ownerId: tender.owner_id,
    stage: tender.stage,
    status: tender.status,
    date,
    dayKey: calendarDayKey(date),
    label: `${definition.prefix} - ${tender.title}`,
    eventType: definition.eventType,
    tone: definition.tone,
  }
}

function sortCalendarEvents(events) {
  return [...events].sort((a, b) => {
    const dateDifference = a.date.getTime() - b.date.getTime()

    if (dateDifference !== 0) return dateDifference

    const labelDifference = a.label.localeCompare(b.label)

    if (labelDifference !== 0) return labelDifference

    return a.id.localeCompare(b.id)
  })
}

export function calendarDeadlineEvents(tenders) {
  const liveTenders = activeTenders(tenders)
  const explicitDateEvents = liveTenders.flatMap((tender) =>
    calendarDateDefinitions
      .map((definition) => calendarEventFromTenderDate(tender, definition))
      .filter(Boolean)
  )

  return sortCalendarEvents(explicitDateEvents)
}

export function calendarEventsForDay(events, date) {
  const dayKey = calendarDayKey(date)

  return sortCalendarEvents(events.filter((event) => event.dayKey === dayKey))
}

export function calendarMonthDays(
  events,
  monthDate = new Date(),
  now = new Date()
) {
  const monthStart = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1
  )
  const monthEnd = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  )
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7))
  const gridEnd = addDays(monthEnd, 6 - ((monthEnd.getDay() + 6) % 7))
  const todayKey = calendarDayKey(now)
  const days = []

  for (
    let date = new Date(gridStart);
    date.getTime() <= gridEnd.getTime();
    date = addDays(date, 1)
  ) {
    const dayDate = new Date(date)
    const dayKey = calendarDayKey(dayDate)

    days.push({
      date: dayDate,
      dayKey,
      inCurrentMonth: dayDate.getMonth() === monthStart.getMonth(),
      isToday: dayKey === todayKey,
      events: calendarEventsForDay(events, dayDate),
    })
  }

  return days
}

const dayMs = 1000 * 60 * 60 * 24
const staleThresholdDays = 30
const needsUpdateDays = 14
const dueSoonDays = 7
const urgentDays = 2

const stageOrder = [
  "identified",
  "psq",
  "itt",
  "submitted",
  "presentation",
  "award",
  "standstill",
]

function labelFromValue(value) {
  if (!value) return "Uncategorised"

  const acronymLabels = {
    itt: "ITT",
    psq: "PSQ",
  }

  if (acronymLabels[value]) return acronymLabels[value]

  return String(value)
    .split("_")
    .map(
      (part) =>
        acronymLabels[part] ?? part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ")
}

function deadlineLabel(deadlineType) {
  return `${labelFromValue(deadlineType ?? "submission")} deadline`
}

function calendarDayDelta(value, now = new Date()) {
  if (!value) return null

  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) return null

  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / dayMs)
}

function pluralDay(days) {
  return `${days} ${days === 1 ? "day" : "days"}`
}

function profileName(profiles, profileId) {
  if (!profileId) return "Unassigned"

  const profile = profiles.find((item) => item.id === profileId)

  return profile?.full_name ?? profile?.email ?? "Unassigned"
}

function hasPositiveValue(tender) {
  return Number(tender?.estimated_value ?? 0) > 0
}

function valueForTender(tender) {
  return Number(tender?.estimated_value ?? 0)
}

function hasRiskSignal(tender, deadlines, now) {
  return (
    tender.status === "blocked" ||
    tender.status === "urgent" ||
    tender.status === "at_risk" ||
    isOperationallyOverdue(tender, deadlines, now) ||
    isStaleLiveTender(tender, deadlines, now) ||
    isDueWithinDays(tender, deadlines, now, dueSoonDays) ||
    !tender.owner_id
  )
}

function isDueWithinDays(tender, deadlines, now, days) {
  const milestone = nextMilestone(tender, deadlines, now)

  return (
    Boolean(milestone) &&
    milestone.daysUntil !== null &&
    milestone.daysUntil >= 0 &&
    milestone.daysUntil <= days
  )
}

function updateAgeDays(tender, now) {
  if (!tender?.updated_at) return null

  const delta = calendarDayDelta(tender.updated_at, now)

  return delta === null ? null : Math.max(0, Math.abs(delta))
}

function actionSort(a, b) {
  const aMilestone = a.milestone
  const bMilestone = b.milestone
  const aTime = aMilestone ? new Date(aMilestone.date).getTime() : Infinity
  const bTime = bMilestone ? new Date(bMilestone.date).getTime() : Infinity

  if (aTime !== bTime) return aTime - bTime

  return valueForTender(b.tender) - valueForTender(a.tender)
}

export function relativeDateLabel(value, now = new Date(), options = {}) {
  const days = calendarDayDelta(value, now)

  if (days === null) return "Awaiting"

  if (options.mode === "updated") {
    const age = Math.max(0, Math.abs(days))

    if (age === 0) return "last updated today"

    return `last updated ${pluralDay(age)} ago`
  }

  if (days === 0) return "due today"
  if (days === 1) return "due tomorrow"
  if (days > 1) return `due in ${pluralDay(days)}`

  return `missed by ${pluralDay(Math.abs(days))}`
}

export function nextMilestone(tender, deadlines = [], now = new Date()) {
  const deadline = deadlines
    .filter(
      (item) => item.tender_id === tender.id && !item.completed_at && item.due_at
    )
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())[0]
  const date = deadline?.due_at ?? tender.submission_deadline

  if (!date) return null

  const days = calendarDayDelta(date, now)

  return {
    id: deadline?.id ?? null,
    tenderId: tender.id,
    label: deadlineLabel(deadline?.deadline_type ?? "submission"),
    title: deadline?.title ?? `${tender.title} submission`,
    type: deadline?.deadline_type ?? "submission",
    date,
    dueAt: date,
    isPast: days !== null && days < 0,
    daysUntil: days !== null && days >= 0 ? days : null,
    daysPast: days !== null && days < 0 ? Math.abs(days) : null,
    relativeLabel: relativeDateLabel(date, now),
  }
}

export function isOperationallyOverdue(tender, deadlines = [], now = new Date()) {
  if (isTerminalTender(tender)) return false

  const milestone = nextMilestone(tender, deadlines, now)

  return (
    Boolean(milestone) &&
    milestone.daysPast !== null &&
    milestone.daysPast > 0 &&
    milestone.daysPast <= staleThresholdDays
  )
}

export function isStaleLiveTender(tender, deadlines = [], now = new Date()) {
  if (isTerminalTender(tender)) return false

  const milestone = nextMilestone(tender, deadlines, now)
  const age = updateAgeDays(tender, now)

  return (
    (Boolean(milestone) &&
      milestone.daysPast !== null &&
      milestone.daysPast > staleThresholdDays) ||
    (age !== null && age > staleThresholdDays)
  )
}

function isUrgentTender(tender, deadlines, now) {
  if (isTerminalTender(tender)) return false

  const milestone = nextMilestone(tender, deadlines, now)

  if (!milestone || milestone.daysUntil === null) return false
  if (milestone.daysUntil <= urgentDays) return true
  if (tender.status === "blocked" && milestone.daysUntil <= dueSoonDays) return true

  return !tender.owner_id && milestone.daysUntil <= dueSoonDays
}

function isAtRiskForDashboard(tender, deadlines, now) {
  return (
    !isTerminalTender(tender) &&
    (tender.status === "at_risk" ||
      tender.status === "urgent" ||
      tender.status === "blocked" ||
      isOperationallyOverdue(tender, deadlines, now) ||
      isStaleLiveTender(tender, deadlines, now) ||
      isDueWithinDays(tender, deadlines, now, dueSoonDays) ||
      !tender.owner_id)
  )
}

function actionReason(tender, deadlines, now, category) {
  const milestone = nextMilestone(tender, deadlines, now)
  const age = updateAgeDays(tender, now)

  if (category === "stale") {
    if (milestone?.daysPast && milestone.daysPast > staleThresholdDays) {
      return "Deadline is long past while tender is still live. Update outcome, archive, or revise the deadline."
    }

    return age === null
      ? "Live tender may need a status check."
      : `Live tender has not been updated in ${pluralDay(age)}.`
  }

  if (category === "critical") {
    if (tender.status === "blocked" && milestone?.daysPast) {
      return `Blocked and deadline missed by ${pluralDay(milestone.daysPast)}.`
    }

    if (!tender.owner_id && milestone?.daysUntil !== null) {
      return "No owner and due within 7 days."
    }

    return milestone?.relativeLabel
      ? `${milestone.relativeLabel.charAt(0).toUpperCase()}${milestone.relativeLabel.slice(1)}.`
      : "Immediate tender action needed."
  }

  if (category === "needsUpdate") {
    if (milestone?.daysPast) {
      return `Deadline passed ${pluralDay(milestone.daysPast)} ago; outcome may need updating.`
    }

    return age === null
      ? "Live tender needs an update."
      : `Live tender has not been updated in ${pluralDay(age)}.`
  }

  if (tender.status === "blocked") return "Blocked tender needs review."
  if (tender.status === "at_risk") return "Marked at risk."
  if (tender.status === "urgent") return "Marked urgent."
  if (!tender.owner_id) return "No owner assigned."
  if (milestone?.daysUntil !== null && milestone.daysUntil <= dueSoonDays) {
    return `${milestone.relativeLabel.charAt(0).toUpperCase()}${milestone.relativeLabel.slice(1)}.`
  }

  return "Live tender needs review."
}

function actionBadges(tender, deadlines, now) {
  const badges = new Set()

  if (tender.status === "blocked") badges.add("Blocked")
  if (isOperationallyOverdue(tender, deadlines, now)) badges.add("Overdue")
  if (isUrgentTender(tender, deadlines, now)) badges.add("Urgent")
  if (isAtRiskForDashboard(tender, deadlines, now)) badges.add("At risk")
  if (isStaleLiveTender(tender, deadlines, now)) badges.add("Stale")
  if (!tender.owner_id) badges.add("Unassigned")

  return Array.from(badges)
}

function priorityItem(tender, deadlines, profiles, now, category) {
  return {
    tender,
    ownerName: profileName(profiles, tender.owner_id),
    milestone: nextMilestone(tender, deadlines, now),
    value: valueForTender(tender),
    badges: actionBadges(tender, deadlines, now),
    reason: actionReason(tender, deadlines, now, category),
    category,
  }
}

export function priorityActionGroups(
  tenders,
  deadlines = [],
  profiles = [],
  now = new Date()
) {
  const groups = {
    critical: [],
    needsUpdate: [],
    atRisk: [],
    stale: [],
  }

  activeTenders(tenders).forEach((tender) => {
    const stale = isStaleLiveTender(tender, deadlines, now)
    const overdue = isOperationallyOverdue(tender, deadlines, now)
    const urgent = isUrgentTender(tender, deadlines, now)
    const age = updateAgeDays(tender, now)
    const needsUpdate = overdue || (age !== null && age >= needsUpdateDays)
    const atRisk = isAtRiskForDashboard(tender, deadlines, now)

    if (stale) {
      groups.stale.push(priorityItem(tender, deadlines, profiles, now, "stale"))
      return
    }

    if (urgent || (tender.status === "blocked" && overdue)) {
      groups.critical.push(
        priorityItem(tender, deadlines, profiles, now, "critical")
      )
      return
    }

    if (needsUpdate) {
      groups.needsUpdate.push(
        priorityItem(tender, deadlines, profiles, now, "needsUpdate")
      )
      return
    }

    if (atRisk) {
      groups.atRisk.push(priorityItem(tender, deadlines, profiles, now, "atRisk"))
    }
  })

  return {
    critical: groups.critical.sort(actionSort),
    needsUpdate: groups.needsUpdate.sort(actionSort),
    atRisk: groups.atRisk.sort(actionSort),
    stale: groups.stale.sort(actionSort),
  }
}

export function ownerWorkload(
  tenders,
  deadlines = [],
  profiles = [],
  now = new Date()
) {
  const rows = new Map()

  activeTenders(tenders).forEach((tender) => {
    const ownerId = tender.owner_id ?? "unassigned"
    const existing =
      rows.get(ownerId) ??
      {
        ownerId,
        ownerName: profileName(profiles, tender.owner_id),
        liveCount: 0,
        overdueCount: 0,
        blockedCount: 0,
        atRiskCount: 0,
        dueNext7DaysCount: 0,
        pressureScore: 0,
      }

    existing.liveCount += 1
    if (isOperationallyOverdue(tender, deadlines, now)) existing.overdueCount += 1
    if (tender.status === "blocked") existing.blockedCount += 1
    if (isAtRiskForDashboard(tender, deadlines, now)) existing.atRiskCount += 1
    if (isDueWithinDays(tender, deadlines, now, dueSoonDays)) {
      existing.dueNext7DaysCount += 1
    }
    existing.pressureScore =
      existing.overdueCount * 4 +
      existing.blockedCount * 3 +
      existing.atRiskCount * 2 +
      existing.dueNext7DaysCount

    rows.set(ownerId, existing)
  })

  return Array.from(rows.values()).sort((a, b) => {
    if (b.pressureScore !== a.pressureScore) {
      return b.pressureScore - a.pressureScore
    }

    if (b.liveCount !== a.liveCount) return b.liveCount - a.liveCount

    return a.ownerName.localeCompare(b.ownerName)
  })
}

export function pipelineByStage(tenders, deadlines = [], now = new Date()) {
  const rows = new Map()

  activeTenders(tenders).forEach((tender) => {
    const stage = tender.stage ?? "uncategorised"
    const existing =
      rows.get(stage) ??
      {
        stage,
        stageLabel: labelFromValue(stage),
        count: 0,
        overdueCount: 0,
        blockedCount: 0,
        atRiskCount: 0,
        totalValue: 0,
      }

    existing.count += 1
    existing.totalValue += valueForTender(tender)
    if (isOperationallyOverdue(tender, deadlines, now)) existing.overdueCount += 1
    if (tender.status === "blocked") existing.blockedCount += 1
    if (isAtRiskForDashboard(tender, deadlines, now)) existing.atRiskCount += 1

    rows.set(stage, existing)
  })

  return Array.from(rows.values()).sort((a, b) => {
    const aIndex = stageOrder.indexOf(a.stage)
    const bIndex = stageOrder.indexOf(b.stage)

    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
    }

    return a.stageLabel.localeCompare(b.stageLabel)
  })
}

export function valueAtRisk(tenders, deadlines = [], now = new Date()) {
  return activeTenders(tenders)
    .filter(
      (tender) =>
        hasPositiveValue(tender) && hasRiskSignal(tender, deadlines, now)
    )
    .map((tender) => {
      let reason = "At risk"

      if (tender.status === "blocked") reason = "Blocked"
      else if (isOperationallyOverdue(tender, deadlines, now)) reason = "Overdue"
      else if (isStaleLiveTender(tender, deadlines, now)) reason = "Stale"
      else if (tender.status === "urgent") reason = "Urgent"
      else if (!tender.owner_id) reason = "Unassigned"

      return {
        tender,
        value: valueForTender(tender),
        reason,
        milestone: nextMilestone(tender, deadlines, now),
      }
    })
    .sort((a, b) => b.value - a.value)
}

export function upcomingMilestones(
  tenders,
  deadlines = [],
  now = new Date(),
  days = dueSoonDays
) {
  const futureRows = activeTenders(tenders)
    .map((tender) => ({
      tender,
      milestone: nextMilestone(tender, deadlines, now),
    }))
    .filter(
      (item) =>
        item.milestone &&
        item.milestone.daysUntil !== null &&
        item.milestone.daysUntil >= 0
    )
    .sort(
      (a, b) =>
        new Date(a.milestone.date).getTime() -
        new Date(b.milestone.date).getTime()
    )

  return {
    items: futureRows.filter((item) => item.milestone.daysUntil <= days),
    nextUpcoming: futureRows[0] ?? null,
  }
}

export function dashboardCommandCentre(
  tenders,
  deadlines = [],
  profiles = [],
  contracts = [],
  now = new Date()
) {
  const live = activeTenders(tenders)
  const groups = priorityActionGroups(tenders, deadlines, profiles, now)
  const overdue = live.filter((tender) =>
    isOperationallyOverdue(tender, deadlines, now)
  )
  const stale = live.filter((tender) => isStaleLiveTender(tender, deadlines, now))
  const risk = live.filter((tender) =>
    isAtRiskForDashboard(tender, deadlines, now)
  )
  const unassigned = live.filter((tender) => !tender.owner_id)
  const dueSeven = upcomingMilestones(tenders, deadlines, now, dueSoonDays)
  const riskValue = valueAtRisk(tenders, deadlines, now)

  return {
    isEmpty: live.length === 0,
    liveTenders: live,
    hasValueData:
      live.some((tender) => hasPositiveValue(tender)) ||
      contracts.some((contract) => Number(contract?.value ?? 0) > 0),
    kpis: {
      liveTenders: {
        count: live.length,
      },
      overdue: {
        count: overdue.length,
        staleCount: stale.length,
      },
      dueNext7Days: {
        count: dueSeven.items.length,
        nextUpcoming: dueSeven.nextUpcoming,
      },
      blockedAtRisk: {
        count: risk.length,
        value: riskValue.reduce((total, item) => total + item.value, 0),
      },
      unassigned: {
        count: unassigned.length,
      },
    },
    priorityGroups: groups,
    upcoming: {
      7: dueSeven,
      14: upcomingMilestones(tenders, deadlines, now, 14),
      30: upcomingMilestones(tenders, deadlines, now, staleThresholdDays),
    },
    ownerWorkload: ownerWorkload(tenders, deadlines, profiles, now),
    pipelineByStage: pipelineByStage(tenders, deadlines, now),
    valueAtRisk: riskValue,
    staleTenders: stale,
  }
}

export function currentPeriodRange(period, now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()

  if (period === "all") {
    return {
      start: null,
      end: null,
      label: "All time",
    }
  }

  if (period === "month") {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1),
      label: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
      }).format(now),
    }
  }

  if (period === "quarter") {
    const quarterStartMonth = Math.floor(month / 3) * 3
    const quarter = Math.floor(month / 3) + 1

    return {
      start: new Date(year, quarterStartMonth, 1),
      end: new Date(year, quarterStartMonth + 3, 1),
      label: `Q${quarter} ${year}`,
    }
  }

  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
    label: String(year),
  }
}

export function inDateRange(value, start, end) {
  const time = new Date(value).getTime()

  return time >= start.getTime() && time < end.getTime()
}

export function tendersCreatedInPeriod(tenders, period, now = new Date()) {
  if (period === "all") return [...tenders]

  const range = currentPeriodRange(period, now)

  return tenders.filter((tender) =>
    inDateRange(tender.created_at, range.start, range.end)
  )
}

export function tenderValue(tenders) {
  return tenders.reduce(
    (total, tender) => total + Number(tender.estimated_value ?? 0),
    0
  )
}

function contractValueForTender(tender, contracts = []) {
  const contract = contracts.find((item) => item.tender_id === tender.id)

  return Number(contract?.value ?? tender.estimated_value ?? 0)
}

function wonTenderValue(tenders, contracts = []) {
  return tenders.reduce(
    (total, tender) => total + contractValueForTender(tender, contracts),
    0
  )
}

export function insightSummary(tenders, contracts = []) {
  const submitted = tenders.filter((tender) => hasReachedSubmission(tender))
  const won = tenders.filter((tender) => tender.stage === "won")
  const closed = tenders.filter((tender) =>
    ["won", "lost"].includes(tender.stage)
  )
  const createdValue = tenderValue(tenders)

  return {
    createdCount: tenders.length,
    createdValue,
    averageValue: tenders.length ? createdValue / tenders.length : 0,
    submittedCount: submitted.length,
    submittedValue: tenderValue(submitted),
    wonCount: won.length,
    wonValue: wonTenderValue(won, contracts),
    winRate: closed.length ? Math.round((won.length / closed.length) * 100) : 0,
  }
}

export function outcomeBreakdown(tenders, contracts = []) {
  const won = tenders.filter((tender) => tender.stage === "won")
  const lost = tenders.filter((tender) => tender.stage === "lost")
  const rows = [
    {
      outcome: "won",
      label: "Won",
      count: won.length,
      value: wonTenderValue(won, contracts),
    },
    {
      outcome: "lost",
      label: "Lost",
      count: lost.length,
      value: tenderValue(lost),
    },
  ]
  const outcomeValue = rows.reduce((total, row) => total + row.value, 0)

  return rows.map((row) => ({
    ...row,
    progress: outcomeValue ? Math.round((row.value / outcomeValue) * 100) : 0,
  }))
}

function periodRangeAt(period, offset, now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()

  if (period === "month") {
    const start = new Date(year, month + offset, 1)
    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      label: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(start),
    }
  }

  if (period === "quarter") {
    const currentQuarterStart = Math.floor(month / 3) * 3
    const start = new Date(year, currentQuarterStart + offset * 3, 1)
    const quarter = Math.floor(start.getMonth() / 3) + 1

    return {
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 3, 1),
      label: `Q${quarter} ${String(start.getFullYear()).slice(2)}`,
    }
  }

  const start = new Date(year + offset, 0, 1)

  return {
    start,
    end: new Date(start.getFullYear() + 1, 0, 1),
    label: String(start.getFullYear()),
  }
}

function allTimeYearRanges(tenders) {
  const years = Array.from(
    new Set(
      tenders
        .map((tender) => new Date(tender.created_at).getFullYear())
        .filter((year) => Number.isFinite(year))
    )
  ).sort((a, b) => a - b)

  return years.map((year) => ({
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
    label: String(year),
  }))
}

function trendBucket(label, cohort, contracts) {
  const summary = insightSummary(cohort, contracts)

  return {
    label,
    createdCount: summary.createdCount,
    createdValue: summary.createdValue,
    submittedCount: summary.submittedCount,
    submittedValue: summary.submittedValue,
    wonCount: summary.wonCount,
    wonValue: summary.wonValue,
  }
}

export function insightTrend(
  tenders,
  period,
  now = new Date(),
  contracts = []
) {
  const bucketCount = period === "year" ? 5 : period === "quarter" ? 4 : 6
  const ranges =
    period === "all"
      ? allTimeYearRanges(tenders)
      : Array.from({ length: bucketCount }, (_, index) =>
          periodRangeAt(period, index - (bucketCount - 1), now)
        )

  return ranges.map((range) => {
    const cohort = tenders.filter((tender) =>
      inDateRange(tender.created_at, range.start, range.end)
    )

    return trendBucket(range.label, cohort, contracts)
  })
}
