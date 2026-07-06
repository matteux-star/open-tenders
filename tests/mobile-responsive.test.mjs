import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}

test("root layout declares an explicit mobile viewport scale", () => {
  const layout = read("app/layout.tsx")

  assert.match(layout, /width:\s*"device-width"/)
  assert.match(layout, /initialScale:\s*1/)
})

test("marketing surfaces include mobile-safe preview and navigation patterns", () => {
  const header = read("components/marketing/marketing-header.tsx")
  const preview = read("components/marketing/product-preview.tsx")

  assert.match(header, /max-\[380px\]:hidden/)
  assert.match(header, /Start free trial/)
  assert.match(preview, /hidden[^"]*lg:block/)
  assert.match(preview, /lg:hidden/)
})

test("authenticated dense views expose mobile card or list alternatives", () => {
  const tenders = read("app/app/tenders/page.tsx")
  const kanban = read("app/app/kanban/page.tsx")
  const settings = read("app/app/settings/page.tsx")

  assert.match(tenders, /MobileTenderCard/)
  assert.match(tenders, /hidden[^"]*lg:block/)
  assert.match(kanban, /MobileKanbanBoard/)
  assert.match(kanban, /hidden[^"]*lg:grid/)
  assert.match(settings, /MobileMemberCard/)
  assert.match(settings, /lg:hidden/)
})

test("authenticated mobile shell constrains page-level overflow", () => {
  const shell = read("components/app-shell.tsx")
  const dashboard = read("app/app/page.tsx")
  const settings = read("app/app/settings/page.tsx")

  assert.match(shell, /min-h-svh overflow-x-clip/)
  assert.match(shell, /tf-app-main flex w-full max-w-full min-w-0/)
  assert.match(shell, /w-\[86vw\] max-w-\[360px\]/)
  assert.match(dashboard, /grid min-w-0 flex-1 grid-cols-2/)
  assert.match(dashboard, /aria-label="Needs attention filters"/)
  assert.match(dashboard, /overflow-x-auto/)
  assert.match(
    settings,
    /<SelectTrigger id="settings-section" className="w-full">/
  )
})
