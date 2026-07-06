/* eslint-disable @next/next/no-img-element -- Static public SVG logos need CSS theme swapping. */
import { cn } from "@/lib/utils"

type BrandLogoVariant =
  | "compact"
  | "horizontal"
  | "horizontal-transparent"
  | "stacked"
  | "mark"

type BrandLogoProps = {
  variant?: BrandLogoVariant
  className?: string
  priority?: boolean
  tone?: "auto" | "light" | "dark"
}

const logoConfig: Record<
  BrandLogoVariant,
  {
    src: string
    width: number
    height: number
    alt: string
  }
> = {
  compact: {
    src: "logo-compact.svg",
    width: 360,
    height: 72,
    alt: "TenderFlow",
  },
  horizontal: {
    src: "logo-horizontal.svg",
    width: 560,
    height: 100,
    alt: "TenderFlow bid management",
  },
  "horizontal-transparent": {
    src: "logo-horizontal-transparent.svg",
    width: 560,
    height: 100,
    alt: "TenderFlow bid management",
  },
  stacked: {
    src: "logo-stacked.svg",
    width: 300,
    height: 200,
    alt: "TenderFlow bid management",
  },
  mark: {
    src: "logomark-64.svg",
    width: 64,
    height: 64,
    alt: "TenderFlow",
  },
}

export function BrandLogo({
  variant = "compact",
  className,
  priority = false,
  tone = "auto",
}: BrandLogoProps) {
  const config = logoConfig[variant]
  const loading = priority ? "eager" : "lazy"
  const fetchPriority = priority ? "high" : "auto"

  if (tone !== "auto") {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden", className)}
        style={{ aspectRatio: `${config.width} / ${config.height}` }}
      >
        <img
          src={`/brand/tenderflow/svg/${tone}/${config.src}`}
          width={config.width}
          height={config.height}
          alt={config.alt}
          loading={loading}
          fetchPriority={fetchPriority}
          className="block size-full object-contain"
        />
      </span>
    )
  }

  return (
    <span
      className={cn("relative block shrink-0 overflow-hidden", className)}
      style={{ aspectRatio: `${config.width} / ${config.height}` }}
    >
      <img
        src={`/brand/tenderflow/svg/light/${config.src}`}
        width={config.width}
        height={config.height}
        alt={config.alt}
        loading={loading}
        fetchPriority={fetchPriority}
        className="block size-full object-contain dark:hidden"
      />
      <img
        src={`/brand/tenderflow/svg/dark/${config.src}`}
        width={config.width}
        height={config.height}
        alt=""
        aria-hidden="true"
        loading={loading}
        fetchPriority={fetchPriority}
        className="hidden size-full object-contain dark:block"
      />
    </span>
  )
}
