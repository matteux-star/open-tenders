import Image from "next/image"

import { MarketingButton } from "@/components/marketing/marketing-button"
import { MarketingCta } from "@/components/marketing/marketing-cta"
import { testimonials } from "@/components/marketing/marketing-data"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageIllustration } from "@/components/marketing/page-illustration"
import { SectionHeading } from "@/components/marketing/section-heading"

export const metadata = {
  title: "Customers | TenderFlow",
  description:
    "Draft TenderFlow customer proof for teams replacing spreadsheet-led tender tracking.",
}

export default function CustomersPage() {
  return (
    <MarketingShell>
      <section className="relative">
        <PageIllustration />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl pt-32 pb-12 text-center md:pt-40 md:pb-20">
            <h1 className="mb-6 border-y py-4 text-4xl leading-tight font-bold text-balance [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] sm:text-5xl md:text-6xl">
              Less tracker admin. Cleaner bid handovers.
            </h1>
            <p className="mb-8 text-lg text-gray-700">
              Draft stories for bid teams who want every tender update,
              deadline, and owner change in one place instead of split across
              spreadsheet versions.
            </p>
            <MarketingButton href="/signup">Start free trial</MarketingButton>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            title="The problems spreadsheet-led bid teams know too well."
            className="pb-12"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Which file is current?",
                description:
                  "TenderFlow gives the team a shared live register instead of another copied tracker.",
              },
              {
                title: "Who owns the next action?",
                description:
                  "Owners, stages, blockers, and deadlines sit directly on the tender record.",
              },
              {
                title: "What changed since Friday?",
                description:
                  "Activity history keeps bid context visible through handovers and review meetings.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white/70 p-6 shadow-lg ring-1 shadow-black/[0.03] ring-gray-200"
              >
                <h2 className="font-semibold text-gray-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            dark
            title="Draft customer proof"
            description="First-pass testimonial copy for the initial marketing draft."
            className="pb-12"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-gray-800 bg-white/[0.04] p-6"
              >
                <blockquote className="text-gray-300">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Image
                    className="rounded-full"
                    src={item.image}
                    width={44}
                    height={44}
                    alt=""
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta heading="Give every bid meeting one source of truth." />
    </MarketingShell>
  )
}
