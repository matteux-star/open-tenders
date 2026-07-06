import { MarketingButton } from "@/components/marketing/marketing-button"
import { MarketingCta } from "@/components/marketing/marketing-cta"
import { faqs } from "@/components/marketing/marketing-data"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageIllustration } from "@/components/marketing/page-illustration"
import { SectionHeading } from "@/components/marketing/section-heading"

export const metadata = {
  title: "Support | TenderFlow",
  description:
    "Questions for bid teams moving from spreadsheet tender tracking to TenderFlow.",
}

export default function SupportPage() {
  return (
    <MarketingShell>
      <section className="relative">
        <PageIllustration />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl pt-32 pb-12 text-center md:pt-40 md:pb-20">
            <h1 className="mb-6 border-y py-4 text-4xl leading-tight font-bold text-balance [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] sm:text-5xl md:text-6xl">
              Moving off bid spreadsheets?
            </h1>
            <p className="mb-8 text-lg text-gray-700">
              Start with the questions most teams ask when they move tender
              tracking from a shared workbook into a live workspace.
            </p>
            <MarketingButton href="/signup">Start free trial</MarketingButton>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading title="Questions we often get" className="pb-12" />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl bg-white/70 p-5 shadow-lg ring-1 shadow-black/[0.03] ring-gray-200"
              >
                <summary className="cursor-pointer list-none font-medium text-gray-950">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta
        heading="Bring your bid tracker into a shared workspace."
        description="The first draft is ready for teams who want better tender visibility before the next deadline crunch."
      />
    </MarketingShell>
  )
}
