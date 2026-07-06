import Image from "next/image"

import { MarketingButton } from "@/components/marketing/marketing-button"

export function MarketingCta({
  heading = "Trade the bid spreadsheet for a live command centre.",
  description = "Give your bid team one place to see tenders, deadlines, owners, risk, and renewal watch before the next submission window closes.",
}: {
  heading?: string
  description?: string
}) {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-center shadow-xl">
          <div className="absolute bottom-0 left-1/2 -z-0 h-44 w-[min(28rem,120vw)] -translate-x-1/2 translate-y-1/2 rounded-full border-[16px] border-blue-500 blur-3xl sm:h-56 sm:border-[20px]" />
          <Image
            className="pointer-events-none absolute top-0 left-1/2 -z-0 h-auto max-w-none -translate-x-1/2 max-sm:w-[42rem]"
            src="/images/stripes-dark.svg"
            width={768}
            height={432}
            alt=""
            aria-hidden="true"
          />
          <div className="relative px-4 py-12 md:px-12 md:py-20">
            <h2 className="mx-auto mb-5 max-w-3xl border-y py-4 text-2xl leading-tight font-bold text-gray-100 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-700/.7),transparent)1] sm:text-3xl md:text-4xl">
              {heading}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-gray-400">
              {description}
            </p>
            <MarketingButton href="/signup">Start free trial</MarketingButton>
          </div>
        </div>
      </div>
    </section>
  )
}
