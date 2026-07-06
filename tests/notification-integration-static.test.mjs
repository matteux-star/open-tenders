import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

function path(pathname) {
  return new URL(`../${pathname}`, import.meta.url)
}

function read(pathname) {
  return readFileSync(path(pathname), "utf8")
}

test("Telegram notification schema, env, and functions are wired", () => {
  const env = read(".env.example")
  const config = read("supabase/config.toml")
  const types = read("lib/supabase/database.types.ts")
  const data = read("lib/tender-flow-data.ts")

  assert.match(env, /TELEGRAM_BOT_TOKEN=/)
  assert.match(env, /TELEGRAM_BOT_USERNAME=/)
  assert.match(env, /TELEGRAM_WEBHOOK_SECRET=/)

  assert.match(config, /\[functions\.create-telegram-link\]/)
  assert.match(config, /\[functions\.telegram-webhook\]\s+verify_jwt = false/s)

  assert.match(types, /notification_deliveries:/)
  assert.match(types, /telegram_links:/)
  assert.match(types, /telegram_enabled: boolean/)
  assert.match(types, /notification_delivery_channel: "email" \| "telegram"/)

  assert.match(data, /type TelegramLink/)
  assert.match(data, /telegramLink: TelegramLink \| null/)
  assert.match(data, /createTelegramLink/)
  assert.match(data, /unlinkTelegramAccount/)

  assert.equal(
    existsSync(path("supabase/functions/create-telegram-link/index.ts")),
    true
  )
  assert.equal(
    existsSync(path("supabase/functions/telegram-webhook/index.ts")),
    true
  )
})
