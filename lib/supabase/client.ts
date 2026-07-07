import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === "undefined") {
      return null as unknown as ReturnType<typeof createClient<Database>>
    }
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

  return browserClient
}
