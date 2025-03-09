/**
 * Calculates the True Range
 */
export function calculateTR(high: number, low: number, prevClose: number | null): number {
  if (prevClose === null) return high - low

  const hl = high - low
  const hc = Math.abs(high - prevClose)
  const lc = Math.abs(low - prevClose)

  return Math.max(hl, hc, lc)
}

