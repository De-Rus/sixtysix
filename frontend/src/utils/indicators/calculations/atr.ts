import type { DataPoint } from "../../../types/chart-types"
import { calculateTR } from "./true-range"

/**
 * Calculates Average True Range
 */
export function calculateATR(data: DataPoint[], period = 14): number[] {
  const tr: number[] = []
  const atr: number[] = []

  // Calculate True Range
  for (let i = 0; i < data.length; i++) {
    const prevClose = i > 0 ? data[i - 1].close : null
    tr.push(calculateTR(data[i].high, data[i].low, prevClose))
  }

  // Calculate ATR
  const sum = tr.slice(0, period).reduce((a, b) => a + b, 0)
  atr.push(sum / period)

  for (let i = period; i < data.length; i++) {
    atr.push((atr[i - period] * (period - 1) + tr[i]) / period)
  }

  return atr
}

