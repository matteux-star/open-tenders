import { fail, handleOptions, ok } from "../_shared/http.ts"
import { createAdminClient, requireUser } from "../_shared/supabase.ts"

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function telegramBotUsername() {
  return Deno.env.get("TELEGRAM_BOT_USERNAME")?.replace(/^@/, "").trim()
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const botUsername = telegramBotUsername()
    if (!botUsername) return fail("TELEGRAM_BOT_USERNAME is not configured.", 500)

    const supabase = createAdminClient()
    const user = await requireUser(req, supabase)
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)

    const token = base64Url(tokenBytes)
    const tokenHash = await sha256Hex(token)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await supabase
      .from("telegram_link_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("consumed_at", null)

    const { error } = await supabase.from("telegram_link_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

    if (error) throw new Error(error.message)

    return ok({
      url: `https://t.me/${botUsername}?start=${token}`,
      expiresAt,
    })
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Could not create Telegram link.",
      500
    )
  }
})
