import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function MarketingButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "secondary" | "dark"
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 text-sm font-medium shadow-sm transition",
        variant === "primary" &&
          "bg-linear-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white hover:bg-[length:100%_150%]",
        variant === "secondary" &&
          "bg-white text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50",
        variant === "dark" &&
          "bg-gray-900 text-gray-100 hover:bg-gray-800",
        className
      )}
    >
      {children}
      {variant !== "secondary" ? (
        <ArrowRight
          className="size-4 text-blue-200 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  )
}
