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
    width: number
    height: number
    alt: string
  }
> = {
  compact: {
    width: 360,
    height: 72,
    alt: "OpenTenders",
  },
  horizontal: {
    width: 560,
    height: 100,
    alt: "OpenTenders bid management",
  },
  "horizontal-transparent": {
    width: 560,
    height: 100,
    alt: "OpenTenders bid management",
  },
  stacked: {
    width: 300,
    height: 200,
    alt: "OpenTenders bid management",
  },
  mark: {
    width: 64,
    height: 64,
    alt: "OpenTenders",
  },
}

function LogoInline({ variant, tone }: { variant: BrandLogoVariant; tone: "light" | "dark" }) {
  const fill = tone === "dark" ? "#FFFFFF" : "#0F172A"
  const accent = tone === "dark" ? "#38BDF8" : "#0284C7"

  if (variant === "mark") {
    return (
      <svg viewBox="0 0 64 64" width={64} height={64} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="56" height="56" rx="12" stroke={fill} strokeWidth="3" />
        <path d="M20 24h24M20 32h24M20 40h16" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  if (variant === "compact") {
    return (
      <svg viewBox="0 0 360 72" width={360} height={72} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="56" height="56" rx="12" stroke={fill} strokeWidth="3" />
        <path d="M24 28h24M24 36h24M24 44h16" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <text x="80" y="44" fill={fill} fontSize="28" fontFamily="system-ui, sans-serif" fontWeight="700">OpenTenders</text>
      </svg>
    )
  }

  if (variant === "stacked") {
    return (
      <svg viewBox="0 0 300 200" width={300} height={200} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="110" y="10" width="80" height="80" rx="16" stroke={fill} strokeWidth="3" />
        <path d="M130 36h40M130 48h40M130 60h28" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <text x="150" y="130" textAnchor="middle" fill={fill} fontSize="28" fontFamily="system-ui, sans-serif" fontWeight="700">OpenTenders</text>
      </svg>
    )
  }

  // horizontal / horizontal-transparent
  return (
    <svg viewBox="0 0 560 100" width={560} height={100} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="18" width="64" height="64" rx="14" stroke={fill} strokeWidth="3" />
      <path d="M34 38h28M34 50h28M34 62h18" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <text x="104" y="62" fill={fill} fontSize="36" fontFamily="system-ui, sans-serif" fontWeight="700">OpenTenders</text>
    </svg>
  )
}

export function BrandLogo({
  variant = "compact",
  className,
  priority = false,
  tone = "auto",
}: BrandLogoProps) {
  const config = logoConfig[variant]

  if (tone !== "auto") {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden", className)}
        style={{ aspectRatio: `${config.width} / ${config.height}` }}
      >
        <LogoInline variant={variant} tone={tone} />
      </span>
    )
  }

  return (
    <span
      className={cn("relative block shrink-0 overflow-hidden", className)}
      style={{ aspectRatio: `${config.width} / ${config.height}` }}
    >
      <span className="block dark:hidden">
        <LogoInline variant={variant} tone="light" />
      </span>
      <span className="hidden dark:block">
        <LogoInline variant={variant} tone="dark" />
      </span>
    </span>
  )
}
