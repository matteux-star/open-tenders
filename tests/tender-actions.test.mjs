import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

function read(pathname) {
  return readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8")
}

function maybeRead(pathname) {
  const url = new URL(`../${pathname}`, import.meta.url)
  return existsSync(url) ? readFileSync(url, "utf8") : ""
}

test("kanban cards can open the shared tender detail sheet", () => {
  const kanban = read("app/app/kanban/page.tsx")

  assert.match(kanban, /TenderDetailSheet/)
  assert.match(kanban, /<Sheet[\s>]/)
  assert.match(kanban, /selectedTender/)
  assert.match(kanban, /onView=\{\(\) => setSelectedTender\(tender\)\}/)
})

test("tender form dialog supports editing existing tender data", () => {
  const form = read("components/tender-form-dialog.tsx")

  assert.match(form, /tender\?: Tender \| null/)
  assert.match(form, /updateTender/)
  assert.match(form, /Save changes/)
  assert.match(form, /onSaved\?: \(tender: Tender\) => void/)
})

test("tender form captures explicit calendar dates and syncs legacy ITT deadline", () => {
  const form = read("components/tender-form-dialog.tsx")
  const data = read("lib/tender-flow-data.ts")

  assert.match(form, /PSQ due date/)
  assert.match(form, /ITT due date/)
  assert.match(form, /Final clarification deadline/)
  assert.match(form, /psq_due_at:\s*form\.psqDueAt/)
  assert.match(form, /itt_due_at:\s*form\.ittDueAt/)
  assert.match(
    form,
    /final_clarification_deadline:\s*form\.finalClarificationDeadline/
  )
  assert.match(form, /submission_deadline:\s*form\.ittDueAt/)
  assert.doesNotMatch(form, /label="Submission deadline"/)

  assert.match(data, /export async function upsertPsqDeadlineForTender/)
  assert.match(data, /"internal_review"[\s\S]*tender\.psq_due_at[\s\S]*"PSQ due"/)
  assert.match(
    data,
    /syncTenderDeadlineRowsForTender[\s\S]*upsertPsqDeadlineForTender\(tender\)[\s\S]*upsertSubmissionDeadlineForTender\(tender\)/
  )
})

test("schema and types expose explicit tender calendar date fields", () => {
  const migration = read(
    "supabase/migrations/20260527120000_add_explicit_tender_calendar_dates.sql"
  )
  const types = read("lib/supabase/database.types.ts")

  for (const field of [
    "psq_due_at",
    "itt_due_at",
    "final_clarification_deadline",
  ]) {
    assert.match(migration, new RegExp(`add column if not exists ${field}`))
    assert.match(types, new RegExp(`${field}: string \\| null`))
    assert.match(types, new RegExp(`${field}\\?: string \\| null`))
  }

  assert.match(migration, /stage = 'psq'/)
  assert.match(migration, /stage = 'itt'/)
  assert.match(migration, /deadline_type = 'clarification'/)
})

test("profile names can be updated through the profiles table", () => {
  const data = read("lib/tender-flow-data.ts")

  assert.match(data, /export async function updateProfileName/)
  assert.match(data, /\.from\("profiles"\)/)
  assert.match(data, /full_name:\s*fullName/)
  assert.match(data, /\.eq\("id", profileId\)/)
  assert.match(data, /return data/)
})

test("tenders page exposes admin delete actions from the sheet and row menu", () => {
  const tenders = read("app/app/tenders/page.tsx")

  assert.match(tenders, /canDelete/)
  assert.match(tenders, /Delete tender/)
  assert.match(tenders, /variant="destructive"/)
  assert.match(tenders, /setDeleteTender\(tender\)/)
})

test("deleteTender preserves linked contracts before removing the tender", () => {
  const data = read("lib/tender-flow-data.ts")
  const helperStart = data.indexOf("export async function deleteTender")
  const unlinkContracts = data.indexOf('.from("contracts")', helperStart)
  const nullTenderId = data.indexOf("tender_id: null", unlinkContracts)
  const deleteTenderRow = data.indexOf('.from("tenders")', nullTenderId)
  const deleteCall = data.indexOf(".delete()", deleteTenderRow)

  assert.notEqual(helperStart, -1)
  assert.ok(unlinkContracts > helperStart)
  assert.ok(nullTenderId > unlinkContracts)
  assert.ok(deleteTenderRow > nullTenderId)
  assert.ok(deleteCall > deleteTenderRow)
})

test("delete confirmation warns that deletion cannot be undone", () => {
  const dialog = maybeRead("components/tender-delete-dialog.tsx")

  assert.match(dialog, /cannot be undone/i)
  assert.match(dialog, /deadlines and activity/i)
  assert.match(dialog, /linked contracts will be preserved/i)
})
