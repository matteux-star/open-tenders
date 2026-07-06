import Link from "next/link"

import { BrandLogo } from "@/components/brand-logo"
import { marketingNavItems } from "@/components/marketing/marketing-data"

export function MarketingFooter() {
  return (
    <footer className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 border-t py-10 [border-image:linear-gradient(to_right,transparent,var(--color-slate-200),transparent)1] sm:grid-cols-12">
          <div className="space-y-3 sm:col-span-12 lg:col-span-5">
            <BrandLogo
              variant="horizontal"
              className="h-10 w-[min(224px,100%)]"
            />
            <p className="max-w-sm text-sm text-gray-600">
              TenderFlow helps bid teams replace fragile spreadsheet trackers
              with one live workspace for tenders, deadlines, owners, and risk.
            </p>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TenderFlow. All rights reserved.
            </p>
          </div>
          <div className="space-y-3 sm:col-span-4 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-950">Product</h3>
            <ul className="space-y-2 text-sm">
              {marketingNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-600 transition hover:text-gray-950"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 sm:col-span-4 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-950">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/signup"
                  className="text-gray-600 transition hover:text-gray-950"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-600 transition hover:text-gray-950"
                >
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3 sm:col-span-4 lg:col-span-3">
            <h3 className="text-sm font-medium text-gray-950">Best for</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Bid managers</li>
              <li>Procurement teams</li>
              <li>Commercial leaders</li>
            </ul>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none relative -mt-8 h-32 overflow-hidden text-center text-[clamp(4rem,28vw,11rem)] leading-none font-bold text-gray-200/50 md:-mt-12 md:h-44 md:text-[260px]"
        aria-hidden="true"
      >
        TenderFlow
      </div>
    </footer>
  )
}
