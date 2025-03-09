import type { DataPoint } from "../../../types/chart-types"
import { calculateSMA } from "./sma"

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(data: DataPoint[], period = 14): (number | null)[] {
  const ema: (number | null)[] = []
  const k = 2 / (period + 1)

  // Start by using SMA for the first EMA value
  const sma = calculateSMA(data, period)

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null)
    } else if (i === period - 1) {
      ema.push(sma[i])
    } else {
      ema.push(data[i].close * k + ema[i - 1]! * (1 - k))
    }
  }

  return ema
}

