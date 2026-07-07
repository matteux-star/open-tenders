import { fail, handleOptions, ok } from "../_shared/http.ts"
import { createAdminClient } from "../_shared/supabase.ts"

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!token) return { sent: false, error: "TELEGRAM_BOT_TOKEN is not configured." }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "OpenTenders/1.0",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok || body?.ok === false) {
    return {
      sent: false,
      error: body?.description ?? `Telegram returned ${response.status}.`,
    }
  }

  return { sent: true }
}

function startToken(text: unknown) {
  if (typeof text !== "string") return null

  return text.match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{10,64})$/)?.[1] ?? null
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")
  if (!webhookSecret) return fail("TELEGRAM_WEBHOOK_SECRET is not configured.", 500)

  if (req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret) {
    return fail("Unauthorized.", 401)
  }

  try {
    const update = await req.json()
    const message = update?.message
    const token = startToken(message?.text)
    const chatId = message?.chat?.id == null ? null : String(message.chat.id)
    const telegramUserId = message?.from?.id == null ? null : String(message.from.id)

    if (!token || !chatId || !telegramUserId) return ok({ ignored: true })

    const supabase = createAdminClient()
    const tokenHash = await sha256Hex(token)
    const { data: linkToken, error: tokenError } = await supabase
      .from("telegram_link_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (tokenError) throw new Error(tokenError.message)

    if (!linkToken) {
      await sendTelegramMessage(
        chatId,
        "This OpenTenders link has expired. Open Settings and generate a new Telegram link."
      )
      return ok({ linked: false })
    }

    const { error: linkError } = await supabase.from("telegram_links").upsert(
      {
        user_id: linkToken.user_id,
        telegram_user_id: telegramUserId,
        telegram_chat_id: chatId,
        telegram_username: message.from?.username ?? null,
        first_name: message.from?.first_name ?? null,
        last_name: message.from?.last_name ?? null,
        linked_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "user_id" }
    )
    if (linkError) throw new Error(linkError.message)

    const { error: consumeError } = await supabase
      .from("telegram_link_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", linkToken.id)
    if (consumeError) throw new Error(consumeError.message)

    await sendTelegramMessage(
      chatId,
      "Telegram reminders are linked for OpenTenders deadline notifications."
    )

    return ok({ linked: true })
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Could not process Telegram webhook.",
      500
    )
  }
})
