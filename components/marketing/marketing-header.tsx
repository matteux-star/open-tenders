"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { marketingNavItems } from "@/components/marketing/marketing-data"
import { MarketingButton } from "@/components/marketing/marketing-button"
import { cn } from "@/lib/utils"

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node

      if (
        !open ||
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return
      }

      setOpen(false)
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("click", handleClick)
    document.addEventListener("keydown", handleKey)

    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="relative flex h-14 min-w-0 items-center justify-between gap-2 rounded-2xl bg-white/90 px-2 shadow-lg shadow-black/[0.03] backdrop-blur before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[mask-composite:exclude_!important] before:[background:linear-gradient(var(--color-gray-100),var(--color-gray-200))_border-box] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] sm:gap-3 sm:px-3">
          <Link href="/" aria-label="TenderFlow home" className="relative z-10">
            <BrandLogo
              variant="compact"
              priority
              className="h-9 w-[148px] sm:w-[202px]"
            />
          </Link>

          <nav className="relative z-10 hidden md:flex" aria-label="Public">
            <ul className="flex items-center justify-center gap-4 text-sm lg:gap-8">
              {marketingNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-700 transition hover:text-gray-950"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-10 flex min-w-0 items-center justify-end gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-lg bg-white px-3 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 sm:inline-flex"
            >
              Log in
            </Link>
            <MarketingButton
              href="/signup"
              variant="dark"
              className="h-9 px-3 max-[380px]:hidden"
            >
              Sign up
            </MarketingButton>
            <button
              ref={buttonRef}
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg bg-white text-gray-800 shadow-sm ring-1 ring-gray-200 md:hidden"
              aria-controls="mobile-nav"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="sr-only">Menu</span>
              {open ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Menu className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div
            ref={menuRef}
            id="mobile-nav"
            className={cn(
              "absolute top-full left-0 z-20 mt-2 w-full rounded-xl bg-white p-2 shadow-lg ring-1 shadow-black/[0.06] ring-gray-200 transition md:hidden",
              open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            )}
          >
            <nav aria-label="Mobile public">
              <ul className="text-sm">
                {marketingNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className="flex rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Link>
                </li>
                <li className="mt-1 border-t pt-2">
                  <Link
                    href="/signup"
                    className="flex rounded-lg bg-gray-900 px-3 py-2 font-medium text-white hover:bg-gray-800"
                    onClick={() => setOpen(false)}
                  >
                    Start free trial
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
