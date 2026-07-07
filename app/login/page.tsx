import { AuthPage } from "@/components/auth-gate"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return <AuthPage initialMode="sign-in" />
}
