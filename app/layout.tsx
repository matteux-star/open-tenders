import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://tenderflow.com"),
  title: {
    default: "TenderFlow",
    template: "%s | TenderFlow",
  },
  description:
    "TenderFlow helps bid teams replace spreadsheet tender trackers with one workspace for bids, deadlines, owners, and risk.",
  applicationName: "TenderFlow",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "TenderFlow",
    description:
      "Replace spreadsheet-led tender tracking with one workspace for bids, deadlines, owners, and risk.",
    url: "/",
    siteName: "TenderFlow",
    images: [
      {
        url: "/og/og-image-light.png",
        width: 1200,
        height: 630,
        alt: "TenderFlow bid management",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TenderFlow",
    description:
      "Replace spreadsheet-led tender tracking with one workspace for bids, deadlines, owners, and risk.",
    images: ["/og/og-image-light.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        jetbrainsMonoHeading.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
