import type { DataPoint } from "../../../types/chart-types"

/**
 * Calculates Simple Moving Average
 */
export function calculateSMA(data: DataPoint[], period = 14): (number | null)[] {
  const sma: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].close
      }
      sma.push(sum / period)
    }
  }

  return sma
}

