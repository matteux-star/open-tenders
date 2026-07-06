import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

function read(pathname) {
  return readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8")
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0
}

function assertEveryBlockContains(source, openTag, closeTag, requiredTag) {
  const blocks = source.split(openTag).slice(1)

  for (const block of blocks) {
    const content = block.split(closeTag)[0]
    assert.match(content, requiredTag)
  }
}

test("insights exposes all-time mode and chart value tooltips", () => {
  const insights = read("app/app/insights/page.tsx")

  assert.match(insights, /all:\s*"All time"/)
  assert.match(insights, /TooltipContent/)
  assert.match(insights, /data-insight-tooltip/)
})

test("insights replaces stage breakdown with stable won and lost outcomes", () => {
  const insights = read("app/app/insights/page.tsx")

  assert.match(insights, /<CardTitle>Won & Lost<\/CardTitle>/)
  assert.match(insights, /outcomeBreakdown\(cohort,\s*contracts\)/)
  assert.match(insights, /min-h-\[25rem\]/)
  assert.match(
    insights,
    /grid (?:gap-4 items-start|items-start gap-4) xl:grid-cols-\[1\.35fr_0\.65fr\]/
  )
  assert.doesNotMatch(insights, /Stage breakdown/)
  assert.doesNotMatch(insights, /stageBreakdown/)
  assert.doesNotMatch(insights, /stages\.length/)
})

test("tenders filters separate lifecycle stage from health status", () => {
  const tenders = read("app/app/tenders/page.tsx")

  assert.match(tenders, /label="Health"/)
  assert.match(tenders, /tenderHealthStatuses/)
  assert.doesNotMatch(tenders, /"awaiting_result",\s*"closed"/)
})

test("tenders page uses compact register header and toolbar", () => {
  const tenders = read("app/app/tenders/page.tsx")
  const shell = read("components/app-shell.tsx")

  assert.match(tenders, /showHeader=\{false\}/)
  assert.match(shell, /showHeader \? \(/)
  assert.match(shell, /<h1 className="sr-only">\{title\}<\/h1>/)
  assert.match(tenders, />\s*Add tender\s*</)
  assert.match(tenders, /aria-label="Tender quick views"/)
  assert.match(tenders, /overflow-x-auto/)
  assert.match(tenders, /lg:flex-wrap/)
  assert.match(tenders, /quickViewMetrics/)
  assert.match(
    tenders,
    /const \[quickView, setQuickView\] = useState<TenderQuickView>\("all"\)/
  )
  assert.match(tenders, /label:\s*"All"/)
  assert.match(tenders, /label:\s*"Active"/)
  assert.match(tenders, /label:\s*"Due soon"/)
  assert.match(tenders, /label:\s*"At risk"/)
  assert.match(tenders, /label:\s*"Blocked"/)
  assert.match(tenders, /label:\s*"Renewal watch"/)
  assert.match(tenders, /value:\s*"renewalWatch"/)
  assert.match(tenders, /aria-label="Tender table toolbar"/)
  assert.match(tenders, /setFiltersOpen\(true\)/)
  assert.match(tenders, /<SheetTitle>Filters<\/SheetTitle>/)
  assert.match(tenders, /<PriceRangePopover/)
  assert.match(tenders, /aria-label="Contract value filter"/)
  assert.match(tenders, /<PopoverTitle>Contract value<\/PopoverTitle>/)
  assert.match(tenders, /<TenderSelect[\s\S]*label="Owner"/)
  assert.match(tenders, /placeholder="Search tenders"/)
  assert.match(tenders, /<span className="sr-only">Search tenders<\/span>/)

  assert.doesNotMatch(tenders, /eyebrow="Procurement \/ Tenders"/)
  assert.doesNotMatch(
    tenders,
    /description="Track live opportunities, deadlines, owners, bid status, and outcomes\."/
  )
  assert.doesNotMatch(tenders, /<CardTitle>Tender register<\/CardTitle>/)
  assert.doesNotMatch(
    tenders,
    /Live tracking for stages, owners, deadlines, and renewal\s+dates\./
  )
  assert.doesNotMatch(
    tenders,
    /description="Manage active procurement opportunities across your organisation\."/
  )
  assert.doesNotMatch(tenders, /Add Tender/)
  assert.doesNotMatch(tenders, /label:\s*"Total"/)
  assert.doesNotMatch(tenders, /Search ID, name, authority/)
  assert.doesNotMatch(tenders, /Renewal only/)
  assert.doesNotMatch(tenders, /MoreFiltersPopover/)
  assert.doesNotMatch(tenders, /More filters/)
})

test("tenders page scopes bulk deletion to selected visible register rows", () => {
  const tenders = read("app/app/tenders/page.tsx")
  const data = read("lib/tender-flow-data.ts")
  const dialog = read("components/tender-bulk-delete-dialog.tsx")

  assert.match(tenders, /TenderBulkDeleteDialog/)
  assert.match(tenders, /selectedTenderIds/)
  assert.match(tenders, /validSelectedTenderIds/)
  assert.match(tenders, /currentTenderIds/)
  assert.match(tenders, /clearSelectionForScopeChange/)
  assert.match(tenders, /handleSearchChange/)
  assert.match(tenders, /handleQuickViewChange/)
  assert.match(tenders, /showNotice/)
  assert.match(tenders, /1 tender deleted\./)
  assert.match(tenders, /tenders deleted\./)
  assert.match(tenders, /Could not delete selected tenders\. Please try again\./)
  assert.match(tenders, /Select all visible tenders/)
  assert.match(tenders, /setVisibleTendersSelected/)
  assert.match(tenders, /new Set\(visibleTenderIds\)/)
  assert.match(tenders, /selectionMode/)
  assert.match(tenders, />\s*Select\s*</)
  assert.match(tenders, /Delete selected/)
  assert.match(tenders, /currentMember\?\.role === "admin"/)
  assert.match(tenders, /canDelete && selectedTenderCount > 0/)
  assert.match(tenders, /canSelect=\{canDelete\}/)
  assert.match(tenders, /setBulkDeleteOpen\(true\)/)
  assert.match(tenders, /await deleteTenders\(tendersToDelete\)/)
  assert.match(tenders, /clearSelection\(\)[\s\S]*setBulkDeleteOpen\(false\)[\s\S]*reload\(\)/)
  assert.doesNotMatch(tenders, /select all matching/i)
  assert.doesNotMatch(tenders, /archive/i)

  assert.match(data, /export async function deleteTenders/)
  assert.match(data, /Selected tenders must belong to the same organisation\./)
  assert.match(data, /\.from\("contracts"\)[\s\S]*\.update\(\{ tender_id: null \}\)[\s\S]*\.in\("tender_id", tenderIds\)/)
  assert.match(data, /\.from\("tenders"\)[\s\S]*\.delete\(\)[\s\S]*\.in\("id", tenderIds\)/)
  assert.match(data, /\.eq\("organisation_id", organisationId\)/)

  assert.match(dialog, /Delete \{count\}/)
  assert.match(dialog, /related milestones,\s*reminders, and workflow records/)
  assert.match(dialog, /currently\s+live/)
  assert.match(dialog, /Selected tenders/)
  assert.match(dialog, /Type DELETE to confirm/)
  assert.match(dialog, /typedConfirmation === "DELETE"/)
  assert.match(dialog, /Delete tender/)
  assert.match(dialog, /variant="destructive"/)
})

test("bulk tender deletion stays isolated to the tenders register", () => {
  const bulkPatterns =
    /TenderBulkDeleteDialog|Delete selected|Select all visible tenders|selectedTenderIds|bulkDelete/i
  const nonTenderPages = [
    "app/app/page.tsx",
    "app/app/calendar/page.tsx",
    "app/app/kanban/page.tsx",
    "app/app/insights/page.tsx",
    "app/app/settings/page.tsx",
  ]

  for (const pathname of nonTenderPages) {
    assert.doesNotMatch(read(pathname), bulkPatterns, pathname)
  }
})

test("bulk tender deletion preserves existing related-record semantics", () => {
  const schema = read("supabase/migrations/0001_initial_schema.sql")
  const data = read("lib/tender-flow-data.ts")

  assert.match(
    schema,
    /create table public\.tender_stage_history[\s\S]*references public\.tenders \(id, organisation_id\)[\s\S]*on delete cascade/
  )
  assert.match(
    schema,
    /create table public\.tender_deadlines[\s\S]*references public\.tenders \(id, organisation_id\)[\s\S]*on delete cascade/
  )
  assert.match(
    schema,
    /create table public\.tender_activity[\s\S]*references public\.tenders \(id, organisation_id\)[\s\S]*on delete cascade/
  )
  assert.match(
    schema,
    /create policy "Admins can delete tenders"[\s\S]*on public\.tenders for delete[\s\S]*array\['admin'\]/
  )
  assert.match(
    data,
    /export async function deleteTender[\s\S]*\.from\("contracts"\)[\s\S]*\.update\(\{ tender_id: null \}\)[\s\S]*\.from\("tenders"\)[\s\S]*\.delete\(\)/
  )
  assert.match(
    data,
    /export async function deleteTenders[\s\S]*\.from\("contracts"\)[\s\S]*\.update\(\{ tender_id: null \}\)[\s\S]*\.from\("tenders"\)[\s\S]*\.delete\(\)/
  )
})

test("tenders page filters contract value with a range slider", () => {
  const tenders = read("app/app/tenders/page.tsx")

  assert.match(tenders, /import \{ Slider \} from "@\/components\/ui\/slider"/)
  assert.match(tenders, /PriceRangeFilter/)
  assert.match(tenders, /contractValueSliderMax/)
  assert.match(tenders, /normalizePriceRange/)
  assert.match(tenders, /tenderValueInPriceRange/)
  assert.match(tenders, /aria-label="Contract value range"/)
  assert.doesNotMatch(tenders, /Under GBP250k/)
  assert.doesNotMatch(tenders, /GBP250k-GBP500k/)
  assert.doesNotMatch(tenders, /GBP500k\+/)
})

test("tenders page uses grouped shadcn dropdown components", () => {
  const tenders = read("app/app/tenders/page.tsx")

  assert.match(tenders, /DropdownMenuGroup/)
  assert.match(tenders, /SelectGroup/)
  assert.match(
    tenders,
    /<SelectContent[^>]*>\s*<SelectGroup>[\s\S]*<\/SelectGroup>\s*<\/SelectContent>/
  )
  assert.match(
    tenders,
    /<DropdownMenuContent[^>]*>[\s\S]*<DropdownMenuGroup>[\s\S]*<DropdownMenuItem[\s\S]*<\/DropdownMenuGroup>[\s\S]*<\/DropdownMenuContent>/
  )
})

test("app shadcn menus keep items inside group components", () => {
  const selectFiles = [
    "app/app/kanban/page.tsx",
    "app/app/settings/page.tsx",
    "app/app/tenders/page.tsx",
    "components/tender-form-dialog.tsx",
  ]
  const dropdownFiles = ["app/app/page.tsx", "app/app/tenders/page.tsx"]

  for (const pathname of selectFiles) {
    assertEveryBlockContains(
      read(pathname),
      "<SelectContent",
      "</SelectContent>",
      /<SelectGroup>/
    )
  }

  for (const pathname of dropdownFiles) {
    assertEveryBlockContains(
      read(pathname),
      "<DropdownMenuContent",
      "</DropdownMenuContent>",
      /<DropdownMenuGroup>/
    )
  }
})

test("dashboard stays focused on tender work", () => {
  const dashboard = read("app/app/page.tsx")

  const plural = "tas" + "ks"

  assert.match(dashboard, /<CardTitle>Needs attention<\/CardTitle>/)
  assert.match(dashboard, /The live tenders most likely to need action\./)
  assert.match(dashboard, /<CardTitle>Operational summary<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Priority actions<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Upcoming milestones<\/CardTitle>/)
  assert.doesNotMatch(
    dashboard,
    /<CardTitle>Live pipeline by stage<\/CardTitle>/
  )
  assert.doesNotMatch(dashboard, /<CardTitle>Owner workload<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Value at risk<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Urgent Deadlines<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Team Workload<\/CardTitle>/)
  assert.doesNotMatch(dashboard, new RegExp("open" + "Tas" + "ks"))
  assert.doesNotMatch(dashboard, new RegExp("sort" + "Tas" + "ksByAttention"))
  assert.doesNotMatch(dashboard, new RegExp("tas" + "ks"))
  assert.doesNotMatch(dashboard, new RegExp("Open " + plural))
  assert.doesNotMatch(dashboard, new RegExp("Owners / " + plural))
})

test("dashboard uses compact at-a-glance cards", () => {
  const dashboard = read("app/app/page.tsx")

  assert.match(dashboard, /xl:grid-cols-5/)
  assert.match(dashboard, /tf-stat-tile gap-1\.5 py-2\.5/)
  assert.match(dashboard, /className="size-3\.5 sm:size-4"/)
  assert.match(dashboard, /text-xl leading-none sm:text-3xl/)
  assert.match(dashboard, /hidden shrink-0 xl:inline-flex/)
  assert.match(dashboard, />\s*Add tender\s*</)
  assert.match(dashboard, /aria-label="Needs attention filters"/)
  assert.match(dashboard, /filteredAttentionItems\.slice\(0,\s*8\)/)
  assert.match(dashboard, /No live tenders need attention\./)

  assert.doesNotMatch(dashboard, /<CardTitle>Urgent due dates<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /<CardTitle>Tenders per person<\/CardTitle>/)
  assert.doesNotMatch(dashboard, /h-\[17rem\]/)
  assert.doesNotMatch(dashboard, /Incomplete deadlines due by/)
  assert.doesNotMatch(dashboard, /attentionTenders/)
  assert.doesNotMatch(dashboard, /Priority Actions/)
  assert.doesNotMatch(dashboard, /Upcoming Milestones/)
  assert.doesNotMatch(dashboard, /Live Pipeline by stage/)
  assert.doesNotMatch(dashboard, /Owner Workload/)
  assert.doesNotMatch(dashboard, /Value at Risk/)
  assert.doesNotMatch(dashboard, /Start tracking a live opportunity/)
  assert.doesNotMatch(dashboard, /min-h-24 w-full/)
  assert.doesNotMatch(dashboard, /<ScrollArea className="h-full/)
})

test("dashboard exposes the command centre surface", () => {
  const dashboard = read("app/app/page.tsx")

  assert.match(dashboard, /dashboardCommandCentre/)
  assert.match(dashboard, /attentionItems/)
  assert.match(dashboard, /addAttentionSignal/)
  assert.match(dashboard, /dashboard\.priorityGroups/)
  assert.match(dashboard, /dashboard\.upcoming\[7\]\.items/)
  assert.match(dashboard, /dashboard\.valueAtRisk/)
  assert.match(dashboard, /attentionFilterOptions/)
  assert.match(dashboard, /showAllAttention/)
  assert.match(dashboard, /dashboard\.kpis\.unassigned\.count/)

  assert.doesNotMatch(dashboard, /scopeControls/)
  assert.doesNotMatch(dashboard, /upcomingWindows/)
  assert.doesNotMatch(dashboard, /Incomplete deadlines due by/)
})

test("dashboard passes workspace identity into the app shell", () => {
  const dashboard = read("app/app/page.tsx")

  assert.match(dashboard, /workspaceName=\{organisation\?\.name/)
  assert.match(
    dashboard,
    /workspaceUserName=\{profileName\(\s*profiles,\s*currentMember\?\.user_id/
  )
  assert.match(dashboard, /workspaceRole=\{currentMember\?\.role/)
})

test("all authenticated pages pass workspace identity into the app shell", () => {
  const pages = [
    "app/app/page.tsx",
    "app/app/tenders/page.tsx",
    "app/app/calendar/page.tsx",
    "app/app/insights/page.tsx",
    "app/app/kanban/page.tsx",
    "app/app/settings/page.tsx",
  ]

  for (const page of pages) {
    const source = read(page)
    const shellCount = countMatches(source, /<AppShell/g)

    assert.ok(shellCount > 0, `${page} should render AppShell`)
    assert.equal(
      countMatches(source, /workspaceName=\{organisation\?\.name/g),
      shellCount,
      `${page} should pass organisation name to every AppShell`
    )
    assert.equal(
      countMatches(
        source,
        /workspaceUserName=\{profileName\(\s*profiles,\s*currentMember\?\.user_id/g
      ),
      shellCount,
      `${page} should pass signed-in user name to every AppShell`
    )
    assert.equal(
      countMatches(source, /workspaceRole=\{currentMember\?\.role/g),
      shellCount,
      `${page} should pass signed-in role to every AppShell`
    )
  }
})

test("kanban uses tender language for the create action", () => {
  const kanban = read("app/app/kanban/page.tsx")

  assert.match(kanban, /aria-label="Add tender"/)
  assert.match(kanban, />\s*Add tender\s*</)
  assert.doesNotMatch(kanban, /Add bid/i)
})

test("calendar page exposes the tender deadline calendar surface", () => {
  const calendar = read("app/app/calendar/page.tsx")

  assert.match(calendar, /activePage="Calendar"/)
  assert.match(calendar, /title="Calendar"/)
  assert.match(calendar, /showHeader=\{false\}/)
  assert.match(calendar, /calendarMonthDays/)
  assert.match(calendar, /calendarDeadlineEvents/)
  assert.match(calendar, /TenderDetailSheet/)
  assert.match(calendar, />\s*Add tender\s*</)
  assert.match(calendar, /No live tender deadlines this month\./)
  assert.match(calendar, /No live tender deadlines on this day\./)
  assert.doesNotMatch(calendar, /Tender calendar/)
  assert.doesNotMatch(calendar, /PSQ, clarification, and ITT deadlines/)
})

test("calendar is reachable from the app shell navigation", () => {
  const shell = read("components/app-shell.tsx")

  assert.match(shell, /label:\s*"Calendar"/)
  assert.match(shell, /href:\s*"\/app\/calendar"/)
})

test("calendar page uses responsive event cells instead of a dense table layout", () => {
  const calendar = read("app/app/calendar/page.tsx")

  assert.match(calendar, /grid-cols-7/)
  assert.match(calendar, /overflow-x-clip/)
  assert.match(calendar, /\+N more/)
  assert.doesNotMatch(calendar, /<Table/)
})

test("settings lets every signed-in user edit their organisation-visible name", () => {
  const settings = read("app/app/settings/page.tsx")

  assert.match(settings, /updateProfileName/)
  assert.match(settings, /function ProfileSettingsCard/)
  assert.match(settings, /<CardTitle>Your profile<\/CardTitle>/)
  assert.match(settings, /id="profile-full-name"/)
  assert.match(settings, /handleSaveProfile/)
  assert.match(settings, /setNotice\("Profile name saved\."\)/)

  const restrictedSection = settings.indexOf("Settings access is restricted")
  const restrictedProfileCard = settings.indexOf(
    "<ProfileSettingsCard",
    settings.indexOf("if (!canViewSettings)")
  )

  assert.ok(restrictedProfileCard > -1)
  assert.ok(restrictedProfileCard < restrictedSection)
})

test("settings keeps profile fields inside a dedicated profile tab", () => {
  const settings = read("app/app/settings/page.tsx")
  const tabStart = settings.indexOf('<TabsContent value="profile"')
  const tabEnd = settings.indexOf('<TabsContent value="team"', tabStart)
  const profileTab = settings.slice(tabStart, tabEnd)
  const tabsStart = settings.indexOf("<Tabs")
  const beforeTabs = settings.slice(0, tabsStart)

  assert.match(settings, /profile:\s*"Profile"/)
  assert.match(settings, /<TabsTrigger value="profile">Profile<\/TabsTrigger>/)
  assert.match(profileTab, /<ProfileSettingsCard/)
  assert.match(profileTab, /onSave=\{handleSaveProfile\}/)
  assert.doesNotMatch(beforeTabs, /className="hidden lg:flex"/)
})

test("settings exposes separate email and Telegram notification controls", () => {
  const settings = read("app/app/settings/page.tsx")

  assert.match(settings, /createTelegramLink/)
  assert.match(settings, /unlinkTelegramAccount/)
  assert.match(settings, /handleToggleMemberTelegramPreference/)
  assert.match(settings, /<CardTitle>Telegram<\/CardTitle>/)
  assert.match(settings, /Link Telegram/)
  assert.match(settings, /Unlink Telegram/)
  assert.match(settings, /Telegram reminders/)
  assert.match(settings, /telegram_enabled/)
  assert.match(settings, /telegramLink/)
})

test("settings mobile section selector uses user-facing labels", () => {
  const settings = read("app/app/settings/page.tsx")
  const triggerStart = settings.indexOf('<SelectTrigger id="settings-section"')
  const triggerEnd = settings.indexOf("</SelectTrigger>", triggerStart)
  const triggerBlock = settings.slice(triggerStart, triggerEnd)

  assert.match(settings, /settingsSectionLabels/)
  assert.match(settings, /team:\s*"Team & seats"/)
  assert.match(
    triggerBlock,
    /<SelectValue>\s*\{settingsSectionLabels\[visibleSettingsSection\]\}\s*<\/SelectValue>/
  )
  assert.doesNotMatch(triggerBlock, /<SelectValue\s*\/>/)
})
