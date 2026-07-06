import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

function path(pathname) {
  return new URL(`../${pathname}`, import.meta.url)
}

function read(pathname) {
  return readFileSync(path(pathname), "utf8")
}

test("auth page uses the Cruip split image layout with TenderFlow branding", () => {
  const authGate = read("components/auth-gate.tsx")

  assert.equal(existsSync(path("public/images/auth-image.jpg")), true)
  assert.match(authGate, /auth-image\.jpg/)
  assert.match(authGate, /md:w-1\/2/)
  assert.match(authGate, /variant="mark"/)
  assert.match(authGate, /tone="light"/)
  assert.match(authGate, /Welcome back!/)
  assert.doesNotMatch(authGate, /pandemic/i)
  assert.doesNotMatch(authGate, /super pro/i)
})
