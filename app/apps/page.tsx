import Image from "next/image"

import { MarketingButton } from "@/components/marketing/marketing-button"
import { MarketingCta } from "@/components/marketing/marketing-cta"
import {
  moduleCards,
  workflowSteps,
} from "@/components/marketing/marketing-data"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageIllustration } from "@/components/marketing/page-illustration"
import { ProductPreview } from "@/components/marketing/product-preview"
import { SectionHeading } from "@/components/marketing/section-heading"

export const metadata = {
  title: "Workflow | TenderFlow",
  description:
    "TenderFlow modules for bid teams replacing spreadsheet-based tender tracking.",
}

export default function AppsPage() {
  return (
    <MarketingShell>
      <section className="relative">
        <PageIllustration />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl pt-32 pb-10 text-center md:pt-40">
            <h1 className="mb-6 border-y py-4 text-4xl leading-tight font-bold text-balance [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] sm:text-5xl md:text-6xl">
              A live workflow for tender teams.
            </h1>
            <p className="text-lg text-gray-700">
              TenderFlow keeps the structure of a bid tracker, then adds the
              live context spreadsheets cannot: owners, deadlines, blockers,
              activity, renewals, and team visibility.
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            title="Modules built around real bid work."
            className="pb-12"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {moduleCards.map((module) => {
              const Icon = module.icon

              return (
                <article
                  key={module.title}
                  className="relative rounded-2xl bg-white/70 p-6 shadow-lg ring-1 shadow-black/[0.03] ring-gray-200"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-semibold text-gray-950">
                    {module.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {module.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-gray-900 py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            dark
            title="From spreadsheet row to submitted bid."
            className="pb-12"
          />
          <div className="relative mx-auto mb-12 max-w-[500px]">
            <div className="min-h-72 -rotate-1 rounded-2xl bg-white/[0.06] px-4 py-3 shadow-xl transition hover:rotate-0 sm:aspect-video sm:px-5">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[13px] font-medium text-white">
                  TenderFlow workflow
                </span>
              </div>
              <div className="grid gap-2 text-sm text-gray-400">
                {workflowSteps.map((step) => (
                  <div
                    key={step.title}
                    className="grid gap-1 rounded-lg bg-white/[0.05] px-3 py-2 text-left sm:flex sm:items-center sm:justify-between sm:gap-4"
                  >
                    <span className="text-gray-200">{step.title}</span>
                    <span className="text-xs sm:truncate sm:text-sm">
                      {step.description.slice(0, 36)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Image
              className="absolute top-12 left-1/2 w-[90%] -translate-x-1/2 opacity-80"
              src="/images/features-02-overlay-01.png"
              width={500}
              height={72}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="text-center">
            <MarketingButton href="/signup">Start free trial</MarketingButton>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  )
}
