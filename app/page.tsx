import Image from "next/image"

import { MarketingButton } from "@/components/marketing/marketing-button"
import { MarketingCta } from "@/components/marketing/marketing-cta"
import {
  featureBlocks,
  testimonials,
  workflowSteps,
} from "@/components/marketing/marketing-data"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageIllustration } from "@/components/marketing/page-illustration"
import { ProductPreview } from "@/components/marketing/product-preview"
import { SectionHeading } from "@/components/marketing/section-heading"

export default function MarketingHomePage() {
  return (
    <MarketingShell>
      <section className="relative">
        <PageIllustration />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pt-32 pb-12 md:pt-40 md:pb-20">
            <div className="pb-12 text-center md:pb-16">
              <div className="mb-6 border-y py-2 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]">
                <div className="-mx-0.5 flex justify-center -space-x-3">
                  {[
                    "/images/avatar-01.jpg",
                    "/images/avatar-02.jpg",
                    "/images/avatar-03.jpg",
                    "/images/avatar-04.jpg",
                    "/images/avatar-05.jpg",
                    "/images/avatar-06.jpg",
                  ].map((src, index) => (
                    <Image
                      key={src}
                      className="box-content rounded-full border-2 border-gray-50"
                      src={src}
                      width={32}
                      height={32}
                      alt={`Bid team avatar ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <h1 className="mb-6 border-y py-4 text-4xl leading-tight font-bold text-balance [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1] sm:text-5xl md:text-6xl">
                Move tender tracking out of spreadsheets.
              </h1>
              <div className="mx-auto max-w-3xl">
                <p className="mb-8 text-lg text-gray-700">
                  TenderFlow gives bid teams one shared workspace for
                  opportunities, owners, stages, deadlines, risks, and renewal
                  watch, so every submission stays visible without another
                  spreadsheet version chase.
                </p>
                <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]">
                  <div className="relative mx-auto flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                    <MarketingButton href="/signup">
                      Start free trial
                    </MarketingButton>
                    <MarketingButton href="/apps" variant="secondary">
                      See how it works
                    </MarketingButton>
                  </div>
                </div>
              </div>
            </div>
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            title="One operating rhythm for every bid."
            description="TenderFlow keeps the familiar bid workflow, but moves it from a brittle workbook into a live workspace your team can trust."
            className="pb-12 md:pb-16"
          />
          <div className="grid overflow-hidden border-y [border-image:linear-gradient(to_right,transparent,var(--color-slate-200),transparent)1] md:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="relative p-6 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent md:px-7 md:py-10"
              >
                <span className="text-xs font-medium text-blue-600">
                  Step {index + 1}
                </span>
                <h3 className="mt-2 font-semibold text-gray-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gray-900 py-12 before:absolute before:inset-0 before:-z-10 before:bg-gray-900 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            dark
            title="Deadline control is better when the spreadsheet is gone."
            description="Bring the things that usually drift across tabs, emails, and meetings into one tender command centre."
            className="pb-12 md:pb-16"
          />
          <div className="relative mx-auto mb-12 flex max-w-[min(420px,100%)] justify-center">
            <div className="absolute bottom-0 -z-0 h-64 w-64 rounded-full bg-blue-500/60 blur-[120px] sm:h-80 sm:w-80 sm:blur-[160px]" />
            <Image
              className="relative h-auto max-w-[78vw] rounded-full bg-gray-900 sm:max-w-none"
              src="/images/planet.png"
              width={320}
              height={320}
              alt="TenderFlow workspace illustration"
            />
            <Image
              className="absolute top-10 -left-20 animate-[float_4s_ease-in-out_infinite_both] opacity-90 max-sm:hidden"
              src="/images/planet-tag-01.png"
              width={253}
              height={56}
              alt="Tender status tag"
            />
            <Image
              className="absolute -right-20 bottom-16 animate-[float_4s_ease-in-out_1s_infinite_both] opacity-80 max-sm:hidden"
              src="/images/planet-tag-04.png"
              width={251}
              height={56}
              alt="Deadline tag"
            />
          </div>
          <div className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {featureBlocks.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="relative p-6 before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-gray-800 after:absolute after:top-0 after:left-0 after:h-px after:w-full after:bg-gray-800 md:p-10"
                >
                  <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-100">
                    <Icon className="size-4 text-blue-400" aria-hidden="true" />
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-6 text-gray-400">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            title="Built for bid teams tired of manual tracker upkeep."
            description="Draft proof points for the first pass. Swap these for real customer stories once the product screenshots and evidence are ready."
            className="pb-12 md:pb-16"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="relative rounded-2xl bg-white/70 p-6 shadow-lg ring-1 shadow-black/[0.03] ring-gray-200"
              >
                <blockquote className="text-gray-700">
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
                    <p className="text-sm font-medium text-gray-950">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  )
}
