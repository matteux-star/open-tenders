import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { MarketingHeader } from "@/components/marketing/marketing-header"

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh overflow-x-clip bg-white text-gray-950">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
