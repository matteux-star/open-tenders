"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
} from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
  },
  {
    label: "Tenders",
    href: "/app/tenders",
    icon: FileText,
  },
  {
    label: "Calendar",
    href: "/app/calendar",
    icon: CalendarDays,
  },
  {
    label: "Insights",
    href: "/app/insights",
    icon: BarChart3,
  },
  {
    label: "Kanban",
    href: "/app/kanban",
    icon: Target,
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
]

type AppShellProps = {
  activePage: string
  eyebrow?: string
  title: string
  description?: string
  showHeader?: boolean
  actionLabel?: string
  actionSlot?: ReactNode
  mobileActionSlot?: ReactNode
  workspaceName?: string | null
  workspaceUserName?: string | null
  workspaceRole?: string | null
  children: ReactNode
}

export function AppShell({
  activePage,
  eyebrow,
  title,
  description,
  showHeader = true,
  actionLabel = "New tender",
  actionSlot,
  mobileActionSlot,
  workspaceName,
  workspaceUserName,
  workspaceRole,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createBrowserSupabaseClient()
  const formattedWorkspaceRole = workspaceRole
    ? workspaceRole
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : null
  const workspaceSubtitle = [workspaceUserName, formattedWorkspaceRole]
    .filter(Boolean)
    .join(" - ")

  return (
    <div className="min-h-svh overflow-x-clip bg-background text-foreground">
      <div className="grid min-h-svh w-full min-w-0 lg:grid-cols-[224px_1fr]">
        <aside className="tf-sidebar-shell hidden min-w-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-svh lg:self-start lg:border-r">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/80 px-4 lg:px-5">
            <Link href="/app" aria-label="TenderFlow dashboard">
              <BrandLogo
                variant="compact"
                priority
                tone="dark"
                className="h-8 w-[160px] rounded-md"
              />
            </Link>
          </div>

          <AppNav activePage={activePage} />

          <div className="hidden border-t border-sidebar-border/80 p-3 lg:block">
            <div className="tf-workspace-card rounded-lg border border-sidebar-border px-3 py-3">
              <p className="text-xs font-medium text-sidebar-accent-foreground">
                {workspaceName ?? "TenderFlow"}
              </p>
              {workspaceSubtitle ? (
                <p className="mt-0.5 text-xs text-sidebar-foreground/65">
                  {workspaceSubtitle}
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="tf-app-main flex w-full max-w-full min-w-0 flex-col">
          <div className="tf-sidebar-shell sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b border-sidebar-border/80 bg-sidebar px-3 text-sidebar-foreground shadow-sm lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-accent-foreground aria-expanded:bg-white/10 aria-expanded:text-sidebar-accent-foreground"
                  />
                }
              >
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Open navigation menu</span>
              </SheetTrigger>
              <SheetContent className="tf-sidebar-shell right-auto left-0 w-[86vw] max-w-[360px] border-r border-l-0 border-sidebar-border bg-sidebar text-sidebar-foreground data-open:slide-in-from-left data-closed:slide-out-to-left [&_[data-slot=sheet-close]]:text-sidebar-foreground [&_[data-slot=sheet-close]]:hover:bg-white/10 [&_[data-slot=sheet-close]]:hover:text-sidebar-accent-foreground">
                <SheetHeader className="border-sidebar-border/80">
                  <SheetTitle className="text-sidebar-accent-foreground">
                    <BrandLogo
                      variant="compact"
                      tone="dark"
                      className="h-8 w-[160px] rounded-md"
                    />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col">
                  <AppNav
                    activePage={activePage}
                    onNavigate={() => setMenuOpen(false)}
                  />
                  <div className="mt-auto border-t border-sidebar-border/80 p-4">
                    <div className="tf-workspace-card rounded-lg border border-sidebar-border bg-white/5 px-3 py-3">
                      <p className="text-sm font-medium text-sidebar-accent-foreground">
                        {workspaceName ?? "TenderFlow"}
                      </p>
                      {workspaceSubtitle ? (
                        <p className="mt-0.5 text-xs text-sidebar-foreground/70">
                          {workspaceSubtitle}
                        </p>
                      ) : null}
                    </div>
                    <SheetClose
                      render={
                        <Button
                          variant="ghost"
                          className="mt-3 w-full justify-start border border-sidebar-border bg-white/5 text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-accent-foreground"
                          onClick={() => void supabase.auth.signOut()}
                        />
                      }
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sign out
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <p className="min-w-0 truncate text-sm font-semibold text-sidebar-accent-foreground">
              {activePage}
            </p>
            <div className="flex min-w-9 justify-end text-sidebar-foreground [&_button]:border-sidebar-border [&_button]:bg-white/5 [&_button]:text-sidebar-foreground [&_button]:hover:bg-white/10 [&_button]:hover:text-sidebar-accent-foreground">
              {mobileActionSlot}
            </div>
          </div>
          {showHeader ? (
            <header className="tf-app-header sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b px-4 py-3 max-lg:flex-col max-lg:items-stretch lg:px-6">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-xs font-semibold text-primary">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="truncate font-heading text-xl font-semibold max-sm:text-lg">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-0.5 max-w-3xl text-sm leading-5 text-muted-foreground max-lg:max-w-none">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 justify-end max-lg:justify-start [&_button]:max-w-full">
                {actionSlot ?? <Button size="sm">{actionLabel}</Button>}
              </div>
            </header>
          ) : (
            <h1 className="sr-only">{title}</h1>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

function AppNav({
  activePage,
  onNavigate,
}: {
  activePage: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.label === activePage

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            data-active={isActive ? "true" : "false"}
            onClick={onNavigate}
            className={cn(
              buttonVariants({
                variant: "ghost",
              }),
              "tf-sidebar-link h-10 justify-start gap-3 px-3 hover:bg-transparent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
