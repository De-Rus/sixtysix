import type { DataPoint } from "../../../types/chart-types"
import { calculateATR } from "./atr"

export interface SupertrendResult {
  upperBand: (number | null)[]
  lowerBand: (number | null)[]
  supertrend: (number | null)[]
  direction: (1 | -1 | null)[] // 1 for uptrend, -1 for downtrend
}

/**
 * Calculates Supertrend indicator
 */
export function calculateSupertrend(data: DataPoint[], period = 10, multiplier = 3): SupertrendResult {
  const atr = calculateATR(data, period)
  const upperBand: (number | null)[] = []
  const lowerBand: (number | null)[] = []
  const supertrend: (number | null)[] = []
  const direction: (1 | -1 | null)[] = []

  // Initialize arrays with nulls for the first 'period' elements
  for (let i = 0; i < period - 1; i++) {
    upperBand.push(null)
    lowerBand.push(null)
    supertrend.push(null)
    direction.push(null)
  }

  // Calculate initial bands
  for (let i = period - 1; i < data.length; i++) {
    const basicUpperBand = (data[i].high + data[i].low) / 2 + multiplier * atr[i]
    const basicLowerBand = (data[i].high + data[i].low) / 2 - multiplier * atr[i]

    // Calculate final upper band
    const finalUpperBand =
      i > period - 1
        ? basicUpperBand < upperBand[i - 1]! || data[i - 1].close > upperBand[i - 1]!
          ? basicUpperBand
          : upperBand[i - 1]!
        : basicUpperBand

    // Calculate final lower band
    const finalLowerBand =
      i > period - 1
        ? basicLowerBand > lowerBand[i - 1]! || data[i - 1].close < lowerBand[i - 1]!
          ? basicLowerBand
          : lowerBand[i - 1]!
        : basicLowerBand

    upperBand.push(finalUpperBand)
    lowerBand.push(finalLowerBand)

    // Determine trend direction and Supertrend value
    if (i === period - 1) {
      supertrend.push(data[i].close > (finalUpperBand + finalLowerBand) / 2 ? finalLowerBand : finalUpperBand)
      direction.push(data[i].close > (finalUpperBand + finalLowerBand) / 2 ? 1 : -1)
    } else if (i > period - 1) {
      const prevSupertrend = supertrend[i - 1]!
      const prevDirection = direction[i - 1]!

      if ((prevSupertrend === prevDirection) === 1 && data[i].close < finalLowerBand) {
        direction.push(-1)
        supertrend.push(finalUpperBand)
      } else if (prevDirection === -1 && data[i].close > finalUpperBand) {
        direction.push(1)
        supertrend.push(finalLowerBand)
      } else {
        direction.push(prevDirection)
        supertrend.push(prevDirection === 1 ? finalLowerBand : finalUpperBand)
      }
    }
  }

  return { upperBand, lowerBand, supertrend, direction }
}

