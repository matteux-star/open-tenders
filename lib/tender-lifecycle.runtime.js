export const tenderHealthStatuses = Object.freeze([
  "on_track",
  "at_risk",
  "blocked",
  "urgent",
])

export const activeTenderStages = Object.freeze([
  "identified",
  "psq",
  "itt",
  "presentation",
])

export const submittedTenderStages = Object.freeze(["submitted"])
export const awaitingResultTenderStages = Object.freeze(["award", "standstill"])
export const terminalTenderStages = Object.freeze([
  "won",
  "lost",
  "withdrawn",
  "no_bid",
])

export const submissionReachedTenderStages = Object.freeze([
  "submitted",
  "presentation",
  "award",
  "standstill",
  "won",
  "lost",
])

const healthStatusSet = new Set(tenderHealthStatuses)
const activeStageSet = new Set(activeTenderStages)
const submittedStageSet = new Set(submittedTenderStages)
const awaitingResultStageSet = new Set(awaitingResultTenderStages)
const terminalStageSet = new Set(terminalTenderStages)
const submissionReachedStageSet = new Set(submissionReachedTenderStages)

export function isHealthTenderStatus(status) {
  return healthStatusSet.has(status)
}

export function isActiveStage(stage) {
  return activeStageSet.has(stage)
}

export function isTerminalStage(stage) {
  return terminalStageSet.has(stage)
}

export function canUseHealthStatusForStage(stage) {
  return isActiveStage(stage)
}

export function deriveTenderStatusForStage(stage, currentStatus = "on_track") {
  if (submittedStageSet.has(stage)) return "submitted"
  if (awaitingResultStageSet.has(stage)) return "awaiting_result"
  if (terminalStageSet.has(stage)) return "closed"

  return isHealthTenderStatus(currentStatus) ? currentStatus : "on_track"
}

export function buildTenderStageUpdate(tender, stage) {
  return {
    stage,
    status: deriveTenderStatusForStage(stage, tender?.status),
  }
}

export function hasReachedSubmission(tender) {
  const stage = typeof tender === "string" ? tender : tender?.stage
  const status = typeof tender === "string" ? undefined : tender?.status

  return (
    submissionReachedStageSet.has(stage) ||
    status === "submitted" ||
    status === "awaiting_result"
  )
}

export function tenderLifecycleIssue(tender) {
  if (!tender) return null

  if (isActiveStage(tender.stage) && !isHealthTenderStatus(tender.status)) {
    return "active_stage_has_derived_status"
  }

  if (submittedStageSet.has(tender.stage) && tender.status !== "submitted") {
    return "submitted_stage_not_submitted_status"
  }

  if (
    awaitingResultStageSet.has(tender.stage) &&
    tender.status !== "awaiting_result"
  ) {
    return "result_stage_not_awaiting_result"
  }

  if (terminalStageSet.has(tender.stage) && tender.status !== "closed") {
    return "terminal_stage_not_closed"
  }

  return null
}

export function inconsistentTenderLifecycleRows(tenders) {
  return tenders
    .map((tender) => ({
      tender,
      issue: tenderLifecycleIssue(tender),
    }))
    .filter((item) => item.issue)
}
