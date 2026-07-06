import assert from "node:assert/strict"
import test from "node:test"

import {
  contractValueSliderMax,
  formatPriceRangeLabel,
  isDefaultPriceRange,
  normalizePriceRange,
  tenderValueInPriceRange,
} from "../lib/tender-price-range.ts"

test("contract value range matching is inclusive and order-safe", () => {
  const range = normalizePriceRange([500000, 250000], 600000)

  assert.deepEqual(range, [250000, 500000])
  assert.equal(tenderValueInPriceRange(250000, range), true)
  assert.equal(tenderValueInPriceRange(500000, range), true)
  assert.equal(tenderValueInPriceRange(249999, range), false)
  assert.equal(tenderValueInPriceRange(500001, range), false)
})

test("contract value slider max rounds up from tender values", () => {
  assert.equal(contractValueSliderMax([]), 500000)
  assert.equal(contractValueSliderMax([45000, 190500, 578500]), 600000)
  assert.equal(contractValueSliderMax([1250000]), 1250000)
})

test("contract value range labels distinguish active and default ranges", () => {
  assert.equal(isDefaultPriceRange([0, 500000], 500000), true)
  assert.equal(isDefaultPriceRange([250000, 500000], 500000), false)
  assert.equal(formatPriceRangeLabel([0, 500000], 500000), "Contract value")
  assert.equal(
    formatPriceRangeLabel([250000, 500000], 500000),
    "GBP250k - GBP500k"
  )
})
