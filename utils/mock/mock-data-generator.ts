import type { DataPoint } from "../../types/chart-types"

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

