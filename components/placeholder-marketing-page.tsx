import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { buttonVariants } from "@/components/ui/button"

export function PlaceholderMarketingPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Link href="/" aria-label="TenderFlow home">
            <BrandLogo
              variant="horizontal"
              priority
              className="h-10 w-[224px] rounded-md"
            />
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Log in
          </Link>
        </div>
      </header>
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-center px-4 py-16 lg:px-6">
        <p className="text-sm font-medium text-primary">
          Public page placeholder
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-normal">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">{description}</p>
        <div className="mt-8">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to landing
          </Link>
        </div>
      </section>
    </main>
  )
}
