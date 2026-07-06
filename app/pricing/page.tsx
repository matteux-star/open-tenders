import { CheckCircle2 } from "lucide-react"

import { MarketingButton } from "@/components/marketing/marketing-button"
import { MarketingCta } from "@/components/marketing/marketing-cta"
import { pricingPlans } from "@/components/marketing/marketing-data"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageIllustration } from "@/components/marketing/page-illustration"
import { SectionHeading } from "@/components/marketing/section-heading"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Pricing | TenderFlow",
  description:
    "Simple TenderFlow workspace pricing for SME bid teams moving tender tracking out of spreadsheets.",
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="relative">
        <PageIllustration />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pt-32 pb-12 md:pt-40 md:pb-20">
            <SectionHeading
              title="Simple pricing for teams replacing the bid spreadsheet."
              description="Flat workspace plans for SMEs. Start with a 14-day free trial, then scale by active tender volume instead of paying for another heavy CRM seat bundle."
              className="pb-12"
            />
            <div className="mx-auto grid max-w-sm items-start gap-6 md:max-w-2xl md:grid-cols-2 xl:max-w-none xl:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={cn(
                    "relative flex h-full min-w-0 flex-col rounded-2xl p-5 shadow-lg shadow-black/[0.03]",
                    plan.highlighted
                      ? "bg-linear-to-tr from-gray-900 to-gray-700 text-gray-100"
                      : "bg-white/70 ring-1 ring-gray-200 backdrop-blur"
                  )}
                >
                  <div className="mb-4">
                    <h2
                      className={cn(
                        "mb-1 font-medium underline underline-offset-4",
                        plan.highlighted
                          ? "decoration-gray-600"
                          : "decoration-gray-300"
                      )}
                    >
                      {plan.name}
                    </h2>
                    <div
                      className={cn(
                        "mb-4 flex items-baseline border-b border-dashed pb-4",
                        plan.highlighted
                          ? "border-gray-600 text-gray-100"
                          : "border-gray-200 text-gray-950"
                      )}
                    >
                      {plan.price === "Custom" ? (
                        <span className="text-4xl font-bold">Custom</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold">GBP</span>
                          <span className="pl-1 text-4xl font-bold tabular-nums">
                            {plan.price}
                          </span>
                          <span
                            className={cn(
                              "pl-1 text-sm",
                              plan.highlighted
                                ? "text-gray-400"
                                : "text-gray-500"
                            )}
                          >
                            /month
                          </span>
                        </>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-6",
                        plan.highlighted ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      {plan.description}
                    </p>
                    <div
                      className={cn(
                        "mt-5 grid gap-2 rounded-lg p-3 text-sm",
                        plan.highlighted
                          ? "bg-white/5 text-gray-200"
                          : "bg-gray-50 text-gray-800"
                      )}
                    >
                      <p className="font-medium">{plan.limit}</p>
                      <p
                        className={cn(
                          plan.highlighted ? "text-gray-400" : "text-gray-500"
                        )}
                      >
                        {plan.seats}
                      </p>
                    </div>
                  </div>
                  <ul
                    className={cn(
                      "grow space-y-2 text-sm",
                      plan.highlighted ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckCircle2 className="mr-2 size-3.5 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <MarketingButton
                    href="/signup"
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "primary" : "dark"}
                  >
                    Start 14-day trial
                  </MarketingButton>
                  <p
                    className={cn(
                      "mt-4 text-xs leading-5",
                      plan.highlighted ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    Best fit: {plan.bestFit}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid overflow-hidden border-y [border-image:linear-gradient(to_right,transparent,var(--color-slate-200),transparent)1] md:grid-cols-3">
            {[
              [
                "Usage scales by active tenders",
                "Every plan includes the core register, deadline watch, and spreadsheet migration template.",
              ],
              [
                "Collaboration stays affordable",
                "Included team members keep owners, reviewers, and leaders in the same workspace without per-seat anxiety.",
              ],
              [
                "Visibility grows with the team",
                "Move from a basic dashboard to kanban, CSV export, renewal watch, and advanced insights as the bid process matures.",
              ],
            ].map(([heading, copy]) => (
              <div key={heading} className="relative p-6 md:p-10">
                <h3 className="font-semibold text-gray-950">{heading}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta heading="Ready to retire the tracker?" />
    </MarketingShell>
  )
}
