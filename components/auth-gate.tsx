"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Session } from "@supabase/supabase-js"

import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  useOpenTendersData,
} from "@/lib/open-tenders-data"

type AuthMode = "sign-in" | "sign-up" | "reset"

const modeCopy: Record<
  AuthMode,
  { title: string; action: string; pending: string }
> = {
  "sign-in": {
    title: "Welcome back!",
    action: "Sign in",
    pending: "Signing in...",
  },
  "sign-up": {
    title: "Create your account",
    action: "Create account",
    pending: "Creating account...",
  },
  reset: {
    title: "Reset your password",
    action: "Send reset link",
    pending: "Sending link...",
  },
}

function useSupabaseSession() {
  const supabase = createBrowserSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return

      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { supabase, session, loading }
}

function AuthForm({ initialMode = "sign-in" }: { initialMode?: AuthMode }) {
  const { supabase } = useSupabaseSession()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const copy = modeCopy[mode]

  function resetStatus(nextMode?: AuthMode) {
    setError(null)
    setNotice(null)
    if (nextMode) setMode(nextMode)
  }

  async function submitAuth() {
    if (submitting) return

    setSubmitting(true)
    setError(null)
    setNotice(null)

    const redirectTo =
      typeof window !== "undefined" ? window.location.href : undefined

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }

      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName || undefined },
          },
        })
        if (signUpError) throw signUpError
        setNotice("Check your email to confirm your account.")
      }

      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo,
          }
        )
        if (resetError) throw resetError
        setNotice("Check your email for a password reset link.")
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-svh bg-white text-slate-900">
      <div className="relative min-h-svh md:flex">
        <div className="md:w-1/2">
          <div className="flex min-h-svh flex-col">
            <header>
              <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
                <Link href="/" aria-label="OpenTenders home">
                  <BrandLogo
                    variant="mark"
                    tone="light"
                    priority
                    className="size-8"
                  />
                </Link>
              </div>
            </header>

            <div className="mx-auto w-full max-w-sm px-4 pt-32 pb-8 md:pt-48">
              <h1 className="mb-6 text-3xl leading-tight font-bold text-slate-950">
                {copy.title}
              </h1>

              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitAuth()
                }}
              >
                {mode === "sign-up" ? (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="full-name"
                      className="text-sm font-medium text-slate-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      required
                      className="h-10 border-slate-200 bg-white text-slate-950 shadow-sm focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    required
                    className="h-10 border-slate-200 bg-white text-slate-950 shadow-sm focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                {mode !== "reset" ? (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      required
                      autoComplete={
                        mode === "sign-in" ? "current-password" : "new-password"
                      }
                      className="h-10 border-slate-200 bg-white text-slate-950 shadow-sm focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                ) : null}

                {notice ? (
                  <p className="text-sm leading-5 text-slate-600">{notice}</p>
                ) : null}
                {error ? (
                  <p className="text-sm leading-5 text-destructive">{error}</p>
                ) : null}

                <div className="mt-2 flex items-center justify-between gap-3">
                  {mode === "sign-in" ? (
                    <Link
                      href="/reset-password"
                      className="text-sm text-slate-700 underline underline-offset-2 hover:no-underline"
                      onClick={() => resetStatus("reset")}
                    >
                      Forgot Password?
                    </Link>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="ml-auto h-9 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {submitting ? copy.pending : copy.action}
                  </Button>
                </div>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-700">
                {mode === "sign-in" ? (
                  <p>
                    Don&apos;t you have an account?{" "}
                    <Link
                      href="/signup"
                      className="font-medium text-violet-600 hover:text-violet-700"
                      onClick={() => resetStatus("sign-up")}
                    >
                      Sign Up
                    </Link>
                  </p>
                ) : (
                  <p>
                    Have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-violet-600 hover:text-violet-700"
                      onClick={() => resetStatus("sign-in")}
                    >
                      Sign In
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-y-0 right-0 hidden md:block md:w-1/2"
          aria-hidden="true"
        >
          <Image
            src="/images/auth-image.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </main>
  )
}

function WorkspaceLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="grid justify-items-center gap-3">
        <BrandLogo variant="mark" priority className="size-12 rounded-md" />
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  )
}

function AccessError({
  message,
  onSignOut,
}: {
  message: string
  onSignOut: () => void
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo />
          <CardTitle>Workspace could not load</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthPage({
  initialMode = "sign-in",
}: {
  initialMode?: AuthMode
}) {
  const { session, loading } = useSupabaseSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session) {
      router.replace("/app")
    }
  }, [loading, router, session])

  if (loading || session) {
    return <WorkspaceLoading />
  }

  return <AuthForm initialMode={initialMode} />
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { supabase, session, loading } = useSupabaseSession()
  const openTendersData = useOpenTendersData()
  const router = useRouter()

  useEffect(() => {
    if (
      !loading &&
      session &&
      !openTendersData.loading &&
      openTendersData.accessState === "no_membership"
    ) {
      router.replace("/onboarding")
    }
  }, [
    loading,
    router,
    session,
    openTendersData.accessState,
    openTendersData.loading,
  ])

  if (loading || (session && openTendersData.loading)) {
    return <WorkspaceLoading />
  }

  if (!session) {
    return <AuthForm />
  }

  if (openTendersData.accessState === "no_membership") {
    return <WorkspaceLoading />
  }

  if (openTendersData.accessState === "error") {
    return (
      <AccessError
        message={
          openTendersData.error ?? "OpenTenders could not load this workspace."
        }
        onSignOut={() => void supabase.auth.signOut()}
      />
    )
  }

  return <>{children}</>
}
