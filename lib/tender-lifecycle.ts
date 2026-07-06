import {
  activeTenderStages as jsActiveTenderStages,
  awaitingResultTenderStages as jsAwaitingResultTenderStages,
  buildTenderStageUpdate as jsBuildTenderStageUpdate,
  canUseHealthStatusForStage as jsCanUseHealthStatusForStage,
  deriveTenderStatusForStage as jsDeriveTenderStatusForStage,
  hasReachedSubmission as jsHasReachedSubmission,
  inconsistentTenderLifecycleRows as jsInconsistentTenderLifecycleRows,
  isActiveStage as jsIsActiveStage,
  isHealthTenderStatus as jsIsHealthTenderStatus,
  isTerminalStage as jsIsTerminalStage,
  submissionReachedTenderStages as jsSubmissionReachedTenderStages,
  submittedTenderStages as jsSubmittedTenderStages,
  tenderHealthStatuses as jsTenderHealthStatuses,
  tenderLifecycleIssue as jsTenderLifecycleIssue,
  terminalTenderStages as jsTerminalTenderStages,
} from "./tender-lifecycle.runtime.js"

import type { Tender, TenderUpdate } from "@/lib/tender-flow-data"

type TenderStage = Tender["stage"]
type TenderStatus = Tender["status"]
type TenderLifecycleInput = Pick<Tender, "stage" | "status">

export const tenderHealthStatuses =
  jsTenderHealthStatuses as readonly TenderStatus[]
export const activeTenderStages = jsActiveTenderStages as readonly TenderStage[]
export const submittedTenderStages =
  jsSubmittedTenderStages as readonly TenderStage[]
export const awaitingResultTenderStages =
  jsAwaitingResultTenderStages as readonly TenderStage[]
export const terminalTenderStages =
  jsTerminalTenderStages as readonly TenderStage[]
export const submissionReachedTenderStages =
  jsSubmissionReachedTenderStages as readonly TenderStage[]

export function isHealthTenderStatus(
  status: string | null | undefined
): status is TenderStatus {
  return jsIsHealthTenderStatus(status)
}

export function isActiveStage(stage: TenderStage) {
  return jsIsActiveStage(stage)
}

export function isTerminalStage(stage: TenderStage) {
  return jsIsTerminalStage(stage)
}

export function canUseHealthStatusForStage(stage: TenderStage) {
  return jsCanUseHealthStatusForStage(stage)
}

export function deriveTenderStatusForStage(
  stage: TenderStage,
  currentStatus?: TenderStatus
): TenderStatus {
  return jsDeriveTenderStatusForStage(stage, currentStatus) as TenderStatus
}

export function buildTenderStageUpdate(
  tender: Pick<Tender, "status">,
  stage: TenderStage
): Pick<TenderUpdate, "stage" | "status"> {
  return jsBuildTenderStageUpdate(tender, stage) as Pick<
    TenderUpdate,
    "stage" | "status"
  >
}

export function hasReachedSubmission(tender: TenderLifecycleInput) {
  return jsHasReachedSubmission(tender)
}

export function tenderLifecycleIssue(tender: TenderLifecycleInput): string | null {
  return jsTenderLifecycleIssue(tender) as string | null
}

export function inconsistentTenderLifecycleRows<T extends TenderLifecycleInput>(
  tenders: T[]
): Array<{ tender: T; issue: string }> {
  return jsInconsistentTenderLifecycleRows(tenders) as Array<{
    tender: T
    issue: string
  }>
}
