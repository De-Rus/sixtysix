import type { DataPoint } from "@/types/chart-types"

/**
 * Generates realistic mock candlestick data for testing
 * @param count Number of data points to generate
 * @returns Array of candlestick data points
 */
export function generateMockData(count = 100): DataPoint[] {
  const data: DataPoint[] = []
  let basePrice = 100 + Math.random() * 100 // Start with a random price between 100-200
  const volatility = 2 // Controls the amount of price movement
  const volumeBase = 1000 // Base volume
  const volumeVariance = 500 // Volume variance

  // Start date: 100 days ago
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - count)

  for (let i = 0; i < count; i++) {
    // Create a date for this candle (add i days to start date)
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)

    // Generate random price movement
    const changePercent = (Math.random() - 0.5) * volatility
    const change = basePrice * (changePercent / 100)

    // Calculate OHLC values
    const open = basePrice
    const close = basePrice + change
    const high = Math.max(open, close) + Math.random() * Math.abs(change)
    const low = Math.min(open, close) - Math.random() * Math.abs(change)

    // Generate random volume
    const volume = Math.floor(volumeBase + Math.random() * volumeVariance)

    // Add data point
    data.push({
      time: currentDate.getTime(), // Unix timestamp in milliseconds
      open,
      high,
      low,
      close,
      volume,
    })

    // Set the next candle's open price to this candle's close price
    basePrice = close
  }

  return data
}

/**
 * Generates mock order data for testing
 * @param data Candlestick data to base orders on
 * @param count Number of orders to generate
 * @returns Array of buy/sell orders
 */
export function generateMockOrders(data: DataPoint[], count = 10) {
  if (!data || data.length === 0) return []

  const orders = []
  const orderTypes = ["buy", "sell"]

  for (let i = 0; i < count; i++) {
    // Pick a random data point
    const randomIndex = Math.floor(Math.random() * data.length)
    const dataPoint = data[randomIndex]

    // Determine if buy or sell
    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)]

    // Generate a price near the candle
    let price
    if (orderType === "buy") {
      // Buy orders typically below the candle
      price = dataPoint.low - Math.random() * (dataPoint.high - dataPoint.low) * 0.2
    } else {
      // Sell orders typically above the candle
      price = dataPoint.high + Math.random() * (dataPoint.high - dataPoint.low) * 0.2
    }

    orders.push({
      time: dataPoint.time,
      price,
      type: orderType,
      volume: Math.floor(Math.random() * 10) + 1,
    })
  }

  return orders
}

/**
 * Generates mock trade data for testing
 * @param data Candlestick data to base trades on
 * @param count Number of trades to generate
 * @returns Array of executed trades
 */
export function generateMockTrades(data: DataPoint[], count = 5) {
  if (!data || data.length === 0) return []

  const trades = []
  const tradeTypes = ["buy", "sell"]

  for (let i = 0; i < count; i++) {
    // Pick a random data point
    const randomIndex = Math.floor(Math.random() * data.length)
    const dataPoint = data[randomIndex]

    // Determine if buy or sell
    const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)]

    // Generate a price within the candle range
    const price = dataPoint.low + Math.random() * (dataPoint.high - dataPoint.low)

    trades.push({
      time: dataPoint.time,
      price,
      type: tradeType,
      volume: Math.floor(Math.random() * 5) + 1,
      profit: tradeType === "sell" ? (Math.random() * 10).toFixed(2) : null,
    })
  }

  return trades
}

