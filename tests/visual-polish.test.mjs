import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"

function path(pathname) {
  return new URL(`../${pathname}`, import.meta.url)
}

function read(pathname) {
  return readFileSync(path(pathname), "utf8")
}

test("authenticated UI removes the spotlight polish primitive", () => {
  const componentPath = path("components/ui/spotlight-card.tsx")
  const dashboard = read("app/app/page.tsx")
  const tenders = read("app/app/tenders/page.tsx")
  const insights = read("app/app/insights/page.tsx")

  assert.equal(existsSync(componentPath), false)
  assert.doesNotMatch(dashboard, /SpotlightCard/)
  assert.doesNotMatch(tenders, /SpotlightCard/)
  assert.doesNotMatch(insights, /SpotlightCard/)
})

test("sidebar is narrower, solid, and logo-safe", () => {
  const globals = read("app/globals.css")
  const shell = read("components/app-shell.tsx")
  const sheet = read("components/ui/sheet.tsx")

  assert.match(globals, /--tf-sidebar:/)
  assert.doesNotMatch(globals, /--tf-spotlight/)
  assert.doesNotMatch(globals, /\.tf-spotlight-card/)
  assert.match(
    globals,
    /\.tf-sidebar-shell\s*{\s*background:\s*var\(--tf-sidebar\);/s
  )
  assert.match(shell, /lg:grid-cols-\[224px_1fr\]/)
  assert.match(shell, /lg:sticky/)
  assert.match(shell, /lg:top-0/)
  assert.match(shell, /lg:h-svh/)
  assert.match(shell, /<Menu className="size-5"/)
  assert.match(shell, /Sign out/)
  assert.match(shell, /tone="dark"/)
  assert.match(shell, /bg-sidebar px-3 text-sidebar-foreground/)
  assert.match(shell, /\[\&_button\]:bg-white\/5/)
  assert.match(shell, /\[\&_button\]:text-sidebar-foreground/)
  assert.match(shell, /w-\[86vw\] max-w-\[360px\]/)
  assert.match(
    shell,
    /border-sidebar-border bg-sidebar text-sidebar-foreground/
  )
  assert.match(shell, /text-sidebar-foreground\/70/)
  assert.match(sheet, /bg-black\/50/)
  assert.match(globals, /prefers-reduced-motion:\s*reduce/)
})

test("auth page uses the split Cruip layout with the TenderFlow mark", () => {
  const authGate = read("components/auth-gate.tsx")

  assert.match(authGate, /auth-image\.jpg/)
  assert.match(authGate, /variant="mark"/)
  assert.match(authGate, /tone="light"/)
  assert.match(authGate, /Welcome back!/)
  assert.doesNotMatch(authGate, /pandemic/i)
})

test("logged-in product surfaces keep subtle static polish hooks", () => {
  const shell = read("components/app-shell.tsx")
  const kanban = read("app/app/kanban/page.tsx")
  const settings = read("app/app/settings/page.tsx")

  assert.match(shell, /tf-sidebar-shell/)
  assert.match(kanban, /tf-kanban-card/)
  assert.match(settings, /tf-settings-card/)
})

test("authenticated sidebar uses compact TenderFlow logo and workspace identity", () => {
  const brandLogo = read("components/brand-logo.tsx")
  const shell = read("components/app-shell.tsx")

  assert.match(brandLogo, /compact:\s*{\s*src:\s*"logo-compact\.svg"/s)
  assert.match(shell, /variant="compact"/)
  assert.doesNotMatch(shell, /variant="horizontal-transparent"/)
  assert.match(shell, /workspaceName\?: string \| null/)
  assert.match(shell, /workspaceUserName\?: string \| null/)
  assert.match(shell, /workspaceRole\?: string \| null/)
  assert.match(shell, /formattedWorkspaceRole/)
  assert.match(shell, /workspaceSubtitle/)
  assert.doesNotMatch(shell, /TenderFlow workspace/)
  assert.doesNotMatch(shell, />\s*Workspace\s*</)
})

test("dark compact logo keeps a transparent background with white text", () => {
  const darkCompactLogo = read(
    "public/brand/tenderflow/svg/dark/logo-compact.svg"
  )

  assert.doesNotMatch(darkCompactLogo, /<rect\b/)
  assert.match(darkCompactLogo, /fill="#FFFFFF">TenderFlow/)
  assert.doesNotMatch(darkCompactLogo, /BID MANAGEMENT/)
})

test("dashboard no longer uses the priority rail polish hook", () => {
  const globals = read("app/globals.css")
  const dashboard = read("app/app/page.tsx")

  assert.doesNotMatch(globals, /\.tf-priority-rail/)
  assert.doesNotMatch(dashboard, /tf-priority-rail/)
})
