import type { DataPoint } from "../types/chart-types"

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

/**
 * Generates random OHLC data for testing with timeframe support
 */
export function generateData(numPoints = 2000, timeframe = "15m", symbol = "AAPL"): DataPoint[] {
  const basePrice = 100
  const volatilityMap = {
    "1m": 0.0005,
    "5m": 0.001,
    "15m": 0.002,
    "30m": 0.003,
    "1h": 0.005,
    "4h": 0.008,
    "1D": 0.015,
    "1W": 0.025,
  }
  const volatility = volatilityMap[timeframe as keyof typeof volatilityMap] || 0.002

  // Generate base prices using random walk
  const prices: number[] = [basePrice]
  for (let i = 1; i < numPoints; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility
    prices.push(prices[i - 1] * (1 + change))
  }

  // Generate start date based on timeframe
  const startDate = new Date()
  startDate.setMilliseconds(0)
  startDate.setSeconds(0)

  switch (timeframe) {
    case "1m":
      startDate.setMinutes(startDate.getMinutes() - numPoints)
      break
    case "5m":
      startDate.setMinutes(startDate.getMinutes() - numPoints * 5)
      break
    case "15m":
      startDate.setMinutes(startDate.getMinutes() - numPoints * 15)
      break
    case "30m":
      startDate.setMinutes(startDate.getMinutes() - numPoints * 30)
      break
    case "1h":
      startDate.setHours(startDate.getHours() - numPoints)
      break
    case "4h":
      startDate.setHours(startDate.getHours() - numPoints * 4)
      break
    case "1D":
      startDate.setDate(startDate.getDate() - numPoints)
      startDate.setHours(9, 30, 0, 0) // Market opening time
      break
    case "1W":
      startDate.setDate(startDate.getDate() - numPoints * 7)
      startDate.setHours(9, 30, 0, 0) // Market opening time
      break
    default:
      startDate.setMinutes(startDate.getMinutes() - numPoints * 15)
  }

  // Generate OHLC data
  const data: DataPoint[] = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < numPoints; i++) {
    const basePrice = prices[i]
    const randomFactor = 1 + (Math.random() - 0.5) * 0.001

    const open = basePrice * randomFactor
    const high = basePrice * (1 + Math.random() * volatility)
    const low = basePrice * (1 - Math.random() * volatility)
    const close = basePrice * (1 + (Math.random() - 0.5) * volatility)

    data.push({
      time: currentDate.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(Math.max(high, open, close).toFixed(2)),
      low: Number(Math.min(low, open, close).toFixed(2)),
      close: Number(close.toFixed(2)),
    })

    // Increment date based on timeframe
    switch (timeframe) {
      case "1m":
        currentDate.setMinutes(currentDate.getMinutes() + 1)
        break
      case "5m":
        currentDate.setMinutes(currentDate.getMinutes() + 5)
        break
      case "15m":
        currentDate.setMinutes(currentDate.getMinutes() + 15)
        break
      case "30m":
        currentDate.setMinutes(currentDate.getMinutes() + 30)
        break
      case "1h":
        currentDate.setHours(currentDate.getHours() + 1)
        break
      case "4h":
        currentDate.setHours(currentDate.getHours() + 4)
        break
      case "1D":
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case "1W":
        currentDate.setDate(currentDate.getDate() + 7)
        break
      default:
        currentDate.setMinutes(currentDate.getMinutes() + 15)
    }
  }

  return data
}

function calculateTR(high: number, low: number, prevClose: number | null): number {
  if (prevClose === null) return high - low

  const hl = high - low
  const hc = Math.abs(high - prevClose)
  const lc = Math.abs(low - prevClose)

  return Math.max(hl, hc, lc)
}

function calculateATR(data: DataPoint[], period = 14): number[] {
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

interface SupertrendResult {
  upperBand: (number | null)[]
  lowerBand: (number | null)[]
  supertrend: (number | null)[]
  direction: (1 | -1 | null)[] // 1 for uptrend, -1 for downtrend
}

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

