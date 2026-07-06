export const PRICE_RANGE_MIN = 0
export const PRICE_RANGE_STEP = 25000
export const DEFAULT_PRICE_RANGE_MAX = 500000

export type PriceRange = [number, number]

function finiteNumber(value: number | null | undefined) {
  const numericValue = Number(value ?? 0)

  return Number.isFinite(numericValue) ? numericValue : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function contractValueSliderMax(
  values: Array<number | null | undefined>
) {
  const highestValue = values.reduce<number>(
    (highest, value) => Math.max(highest, finiteNumber(value)),
    0
  )
  const roundedValue =
    Math.ceil(highestValue / PRICE_RANGE_STEP) * PRICE_RANGE_STEP

  return Math.max(DEFAULT_PRICE_RANGE_MAX, roundedValue)
}

export function normalizePriceRange(
  values: readonly number[],
  max = DEFAULT_PRICE_RANGE_MAX
): PriceRange {
  const firstValue = finiteNumber(values[0])
  const secondValue = finiteNumber(values[1] ?? max)
  const lowValue = Math.min(firstValue, secondValue)
  const highValue = Math.max(firstValue, secondValue)

  return [
    clamp(lowValue, PRICE_RANGE_MIN, max),
    clamp(highValue, PRICE_RANGE_MIN, max),
  ]
}

export function tenderValueInPriceRange(
  value: number | null | undefined,
  range: PriceRange
) {
  const tenderValue = finiteNumber(value)

  return tenderValue >= range[0] && tenderValue <= range[1]
}

export function isDefaultPriceRange(range: PriceRange, max: number) {
  const [from, to] = normalizePriceRange(range, max)

  return from === PRICE_RANGE_MIN && to === max
}

function formatCompactGbp(value: number) {
  if (value >= 1000000) {
    const millions = value / 1000000
    const formattedMillions = Number.isInteger(millions)
      ? millions.toFixed(0)
      : millions.toFixed(1)

    return `GBP${formattedMillions}M`
  }

  if (value >= 1000) {
    return `GBP${Math.round(value / 1000)}k`
  }

  return `GBP${Math.round(value)}`
}

export function formatPriceRangeLabel(range: PriceRange, max: number) {
  const normalizedRange = normalizePriceRange(range, max)

  if (isDefaultPriceRange(normalizedRange, max)) {
    return "Contract value"
  }

  return `${formatCompactGbp(normalizedRange[0])} - ${formatCompactGbp(
    normalizedRange[1]
  )}`
}
