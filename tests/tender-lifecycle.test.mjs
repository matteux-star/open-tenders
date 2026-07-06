import assert from "node:assert/strict"
import test from "node:test"

import {
  buildTenderStageUpdate,
  deriveTenderStatusForStage,
  hasReachedSubmission,
  tenderLifecycleIssue,
} from "../lib/tender-lifecycle.js"

test("derived lifecycle stages set submitted awaiting result and closed statuses", () => {
  assert.equal(deriveTenderStatusForStage("submitted", "blocked"), "submitted")
  assert.equal(
    deriveTenderStatusForStage("award", "on_track"),
    "awaiting_result"
  )
  assert.equal(
    deriveTenderStatusForStage("standstill", "urgent"),
    "awaiting_result"
  )

  for (const stage of ["won", "lost", "withdrawn", "no_bid"]) {
    assert.equal(deriveTenderStatusForStage(stage, "at_risk"), "closed")
  }
})

test("active lifecycle stages preserve health status and reset derived status to on track", () => {
  assert.equal(deriveTenderStatusForStage("psq", "blocked"), "blocked")
  assert.equal(deriveTenderStatusForStage("itt", "awaiting_result"), "on_track")
})

test("stage update helper applies the centralized lifecycle status rule", () => {
  const tender = { id: "tender-1", stage: "itt", status: "blocked" }

  assert.deepEqual(buildTenderStageUpdate(tender, "submitted"), {
    stage: "submitted",
    status: "submitted",
  })
  assert.deepEqual(buildTenderStageUpdate(tender, "presentation"), {
    stage: "presentation",
    status: "blocked",
  })
})

test("submission reach includes submitted and result stages but excludes no bid and withdrawn", () => {
  for (const stage of [
    "submitted",
    "presentation",
    "award",
    "standstill",
    "won",
    "lost",
  ]) {
    assert.equal(hasReachedSubmission({ stage, status: "on_track" }), true)
  }

  assert.equal(hasReachedSubmission({ stage: "no_bid", status: "closed" }), false)
  assert.equal(
    hasReachedSubmission({ stage: "withdrawn", status: "closed" }),
    false
  )
})

test("lifecycle audit reports inconsistent stage status combinations", () => {
  assert.equal(
    tenderLifecycleIssue({ stage: "psq", status: "awaiting_result" }),
    "active_stage_has_derived_status"
  )
  assert.equal(
    tenderLifecycleIssue({ stage: "submitted", status: "blocked" }),
    "submitted_stage_not_submitted_status"
  )
  assert.equal(
    tenderLifecycleIssue({ stage: "won", status: "urgent" }),
    "terminal_stage_not_closed"
  )
  assert.equal(tenderLifecycleIssue({ stage: "itt", status: "urgent" }), null)
})
