import type { DataPoint } from "../../../types/chart-types"

/**
 * Calculates the Ichimoku Cloud components
 */
export function calculateIchimoku(
  data: DataPoint[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouPeriod = 52,
  chikouOffset = 26,
) {
  const ichimoku = {
    tenkan: [] as (number | null)[],
    kijun: [] as (number | null)[],
    senkouA: [] as (number | null)[],
    senkouB: [] as (number | null)[],
    chikou: [] as (number | null)[],
    futureSenkouA: [] as (number | null)[],
    futureSenkouB: [] as (number | null)[],
  }

  // Helper function to calculate the average of highest high and lowest low
  const calculateAverage = (slice: DataPoint[]) => {
    const highMax = Math.max(...slice.map((d) => d.high))
    const lowMin = Math.min(...slice.map((d) => d.low))
    return (highMax + lowMin) / 2
  }

  for (let i = 0; i < data.length; i++) {
    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    ichimoku.tenkan.push(i >= tenkanPeriod - 1 ? calculateAverage(data.slice(i - tenkanPeriod + 1, i + 1)) : null)

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    ichimoku.kijun.push(i >= kijunPeriod - 1 ? calculateAverage(data.slice(i - kijunPeriod + 1, i + 1)) : null)

    // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2 (26 periods ahead)
    ichimoku.senkouA.push(
      i >= kijunPeriod - 1 && ichimoku.tenkan[i] !== null && ichimoku.kijun[i] !== null
        ? (ichimoku.tenkan[i]! + ichimoku.kijun[i]!) / 2
        : null,
    )

    // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2 (26 periods ahead)
    ichimoku.senkouB.push(i >= senkouPeriod - 1 ? calculateAverage(data.slice(i - senkouPeriod + 1, i + 1)) : null)

    // Chikou Span (Lagging Span): Current closing price (26 periods behind)
    ichimoku.chikou.push(i >= chikouOffset ? data[i - chikouOffset].close : null)
  }

  // Extend Senkou values into the future for the cloud
  for (let i = 0; i < chikouOffset; i++) {
    ichimoku.futureSenkouA.push(ichimoku.senkouA[data.length - chikouOffset + i] || null)
    ichimoku.futureSenkouB.push(ichimoku.senkouB[data.length - chikouOffset + i] || null)
  }

  return ichimoku
}

