import {
  addDays as jsAddDays,
  attentionTenders as jsAttentionTenders,
  calendarDayKey as jsCalendarDayKey,
  calendarDeadlineEvents as jsCalendarDeadlineEvents,
  calendarEventsForDay as jsCalendarEventsForDay,
  calendarMonthDays as jsCalendarMonthDays,
  currentPeriodRange as jsCurrentPeriodRange,
  dashboardCommandCentre as jsDashboardCommandCentre,
  dashboardWindow as jsDashboardWindow,
  dueBefore as jsDueBefore,
  dueWithin as jsDueWithin,
  inDateRange as jsInDateRange,
  insightSummary as jsInsightSummary,
  insightTrend as jsInsightTrend,
  isOperationallyOverdue as jsIsOperationallyOverdue,
  isRiskTender as jsIsRiskTender,
  isStaleLiveTender as jsIsStaleLiveTender,
  isTerminalTender as jsIsTerminalTender,
  nextMilestone as jsNextMilestone,
  openDeadlines as jsOpenDeadlines,
  ownerWorkload as jsOwnerWorkload,
  outcomeBreakdown as jsOutcomeBreakdown,
  pipelineByStage as jsPipelineByStage,
  priorityActionGroups as jsPriorityActionGroups,
  relativeDateLabel as jsRelativeDateLabel,
  startOfDay as jsStartOfDay,
  upcomingMilestones as jsUpcomingMilestones,
  valueAtRisk as jsValueAtRisk,
  tenderAttentionRank as jsTenderAttentionRank,
  tenderDeadlineTime as jsTenderDeadlineTime,
  tendersCreatedInPeriod as jsTendersCreatedInPeriod,
  tenderValue as jsTenderValue,
} from "./tender-flow-metrics.runtime.js"

import type {
  Contract,
  Profile,
  Tender,
  TenderDeadline,
} from "@/lib/tender-flow-data"

export type InsightPeriod = "all" | "month" | "quarter" | "year"

export type InsightPeriodRange = {
  start: Date | null
  end: Date | null
  label: string
}

export type InsightSummary = {
  createdCount: number
  createdValue: number
  averageValue: number
  submittedCount: number
  submittedValue: number
  wonCount: number
  wonValue: number
  winRate: number
}

export type OutcomeBreakdownItem = {
  outcome: "won" | "lost"
  label: string
  count: number
  value: number
  progress: number
}

export type DashboardMilestone = {
  id: string | null
  tenderId: string
  label: string
  title: string
  type: string
  date: string
  dueAt: string
  isPast: boolean
  daysUntil: number | null
  daysPast: number | null
  relativeLabel: string
}

export type DashboardActionCategory =
  | "critical"
  | "needsUpdate"
  | "atRisk"
  | "stale"

export type DashboardActionItem = {
  tender: Tender
  ownerName: string
  milestone: DashboardMilestone | null
  value: number
  badges: string[]
  reason: string
  category: DashboardActionCategory
}

export type DashboardPriorityGroups = {
  critical: DashboardActionItem[]
  needsUpdate: DashboardActionItem[]
  atRisk: DashboardActionItem[]
  stale: DashboardActionItem[]
}

export type DashboardUpcomingItem = {
  tender: Tender
  milestone: DashboardMilestone
}

export type DashboardUpcomingResult = {
  items: DashboardUpcomingItem[]
  nextUpcoming: DashboardUpcomingItem | null
}

export type DashboardOwnerWorkload = {
  ownerId: string
  ownerName: string
  liveCount: number
  overdueCount: number
  blockedCount: number
  atRiskCount: number
  dueNext7DaysCount: number
  pressureScore: number
}

export type DashboardStageRow = {
  stage: string
  stageLabel: string
  count: number
  overdueCount: number
  blockedCount: number
  atRiskCount: number
  totalValue: number
}

export type DashboardValueAtRiskItem = {
  tender: Tender
  value: number
  reason: string
  milestone: DashboardMilestone | null
}

export type DashboardCommandCentre = {
  isEmpty: boolean
  liveTenders: Tender[]
  hasValueData: boolean
  kpis: {
    liveTenders: { count: number }
    overdue: { count: number; staleCount: number }
    dueNext7Days: {
      count: number
      nextUpcoming: DashboardUpcomingItem | null
    }
    blockedAtRisk: { count: number; value: number }
    unassigned: { count: number }
  }
  priorityGroups: DashboardPriorityGroups
  upcoming: {
    7: DashboardUpcomingResult
    14: DashboardUpcomingResult
    30: DashboardUpcomingResult
  }
  ownerWorkload: DashboardOwnerWorkload[]
  pipelineByStage: DashboardStageRow[]
  valueAtRisk: DashboardValueAtRiskItem[]
  staleTenders: Tender[]
}

export type CalendarEventType = "psq" | "itt" | "clarification"

export type CalendarEventTone = "sky" | "primary" | "amber"

export type CalendarDateField =
  | "psq_due_at"
  | "itt_due_at"
  | "final_clarification_deadline"

export type CalendarDeadlineEvent = {
  id: string
  source: "tender"
  deadlineId: null
  deadlineType: CalendarEventType
  dateField: CalendarDateField
  tenderId: string
  tender: Tender
  title: string
  buyerName: string
  ownerId: string | null
  stage: Tender["stage"]
  status: Tender["status"]
  date: Date
  dayKey: string
  label: string
  eventType: CalendarEventType
  tone: CalendarEventTone
}

export type CalendarMonthDay = {
  date: Date
  dayKey: string
  inCurrentMonth: boolean
  isToday: boolean
  events: CalendarDeadlineEvent[]
}

export type InsightTrendBucket = {
  label: string
  createdCount: number
  createdValue: number
  submittedCount: number
  submittedValue: number
  wonCount: number
  wonValue: number
}

export function startOfDay(date: Date): Date {
  return jsStartOfDay(date) as Date
}

export function addDays(date: Date, days: number): Date {
  return jsAddDays(date, days) as Date
}

export function openDeadlines(deadlines: TenderDeadline[]): TenderDeadline[] {
  return jsOpenDeadlines(deadlines) as TenderDeadline[]
}

export function isRiskTender(tender: Tender): boolean {
  return jsIsRiskTender(tender) as boolean
}

export function isTerminalTender(tender: Tender): boolean {
  return jsIsTerminalTender(tender) as boolean
}

export function dueBefore(
  value: string | null | undefined,
  date: Date
): boolean {
  return jsDueBefore(value, date) as boolean
}

export function dueWithin(
  value: string | null | undefined,
  start: Date,
  end: Date
): boolean {
  return jsDueWithin(value, start, end) as boolean
}

export function dashboardWindow(now = new Date()): {
  today: Date
  weekEnd: Date
} {
  return jsDashboardWindow(now) as { today: Date; weekEnd: Date }
}

export function tenderDeadlineTime(
  tender: Tender,
  deadlines: TenderDeadline[]
): number {
  return jsTenderDeadlineTime(tender, deadlines) as number
}

export function tenderAttentionRank(
  tender: Tender,
  deadlines: TenderDeadline[],
  now = new Date()
): number {
  return jsTenderAttentionRank(tender, deadlines, now) as number
}

export function attentionTenders(
  tenders: Tender[],
  deadlines: TenderDeadline[],
  now = new Date()
): Tender[] {
  return jsAttentionTenders(tenders, deadlines, now) as Tender[]
}

export function calendarDayKey(value: string | Date): string {
  return jsCalendarDayKey(value) as string
}

export function calendarDeadlineEvents(
  tenders: Tender[]
): CalendarDeadlineEvent[] {
  return jsCalendarDeadlineEvents(tenders) as CalendarDeadlineEvent[]
}

export function calendarEventsForDay(
  events: CalendarDeadlineEvent[],
  date: Date
): CalendarDeadlineEvent[] {
  return jsCalendarEventsForDay(events, date) as CalendarDeadlineEvent[]
}

export function calendarMonthDays(
  events: CalendarDeadlineEvent[],
  monthDate = new Date(),
  now = new Date()
): CalendarMonthDay[] {
  return jsCalendarMonthDays(events, monthDate, now) as CalendarMonthDay[]
}

export function relativeDateLabel(
  value: string | null | undefined,
  now = new Date(),
  options: { mode?: "updated" } = {}
): string {
  return jsRelativeDateLabel(value, now, options) as string
}

export function nextMilestone(
  tender: Tender,
  deadlines: TenderDeadline[] = [],
  now = new Date()
): DashboardMilestone | null {
  return jsNextMilestone(tender, deadlines, now) as DashboardMilestone | null
}

export function isOperationallyOverdue(
  tender: Tender,
  deadlines: TenderDeadline[] = [],
  now = new Date()
): boolean {
  return jsIsOperationallyOverdue(tender, deadlines, now) as boolean
}

export function isStaleLiveTender(
  tender: Tender,
  deadlines: TenderDeadline[] = [],
  now = new Date()
): boolean {
  return jsIsStaleLiveTender(tender, deadlines, now) as boolean
}

export function priorityActionGroups(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  profiles: Profile[] = [],
  now = new Date()
): DashboardPriorityGroups {
  return jsPriorityActionGroups(
    tenders,
    deadlines,
    profiles,
    now
  ) as DashboardPriorityGroups
}

export function ownerWorkload(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  profiles: Profile[] = [],
  now = new Date()
): DashboardOwnerWorkload[] {
  return jsOwnerWorkload(
    tenders,
    deadlines,
    profiles,
    now
  ) as DashboardOwnerWorkload[]
}

export function pipelineByStage(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  now = new Date()
): DashboardStageRow[] {
  return jsPipelineByStage(tenders, deadlines, now) as DashboardStageRow[]
}

export function valueAtRisk(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  now = new Date()
): DashboardValueAtRiskItem[] {
  return jsValueAtRisk(tenders, deadlines, now) as DashboardValueAtRiskItem[]
}

export function upcomingMilestones(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  now = new Date(),
  days = 7
): DashboardUpcomingResult {
  return jsUpcomingMilestones(
    tenders,
    deadlines,
    now,
    days
  ) as DashboardUpcomingResult
}

export function dashboardCommandCentre(
  tenders: Tender[],
  deadlines: TenderDeadline[] = [],
  profiles: Profile[] = [],
  contracts: Contract[] = [],
  now = new Date()
): DashboardCommandCentre {
  return jsDashboardCommandCentre(
    tenders,
    deadlines,
    profiles,
    contracts,
    now
  ) as DashboardCommandCentre
}

export function currentPeriodRange(
  period: InsightPeriod,
  now = new Date()
): InsightPeriodRange {
  return jsCurrentPeriodRange(period, now) as InsightPeriodRange
}

export function inDateRange(value: string, start: Date, end: Date): boolean {
  return jsInDateRange(value, start, end) as boolean
}

export function tendersCreatedInPeriod(
  tenders: Tender[],
  period: InsightPeriod,
  now = new Date()
): Tender[] {
  return jsTendersCreatedInPeriod(tenders, period, now) as Tender[]
}

export function tenderValue(tenders: Tender[]): number {
  return jsTenderValue(tenders) as number
}

export function insightSummary(
  tenders: Tender[],
  contracts: Contract[] = []
): InsightSummary {
  return jsInsightSummary(tenders, contracts) as InsightSummary
}

export function outcomeBreakdown(
  tenders: Tender[],
  contracts: Contract[] = []
): OutcomeBreakdownItem[] {
  return jsOutcomeBreakdown(tenders, contracts) as OutcomeBreakdownItem[]
}

export function insightTrend(
  tenders: Tender[],
  period: InsightPeriod,
  now = new Date(),
  contracts: Contract[] = []
): InsightTrendBucket[] {
  return jsInsightTrend(tenders, period, now, contracts) as InsightTrendBucket[]
}
