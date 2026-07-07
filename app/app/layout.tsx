import type { ReactNode } from "react"

import { AuthGate } from "@/components/auth-gate"

export const dynamic = "force-dynamic"

export default function ProductLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>
}
