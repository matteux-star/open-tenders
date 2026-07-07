import { AuthPage } from "@/components/auth-gate"

export const dynamic = "force-dynamic"

export default function SignupPage() {
  return <AuthPage initialMode="sign-up" />
}
