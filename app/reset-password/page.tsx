import { AuthPage } from "@/components/auth-gate"

export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  return <AuthPage initialMode="reset" />
}
