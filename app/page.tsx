"use client"

import { useState } from "react"
import CandlestickChart from "@/components/candlestick-chart"
import { generateData } from "@/utils/indicator-calculations"
import type { Order, Trade, Position } from "@/types/trading-types"

// Updated sample data for better visualization
const sampleTrades: Trade[] = [
  {
    id: "1",
    orderId: "2",
    symbol: "AAPL",
    side: "sell",
    price: 190.0,
    quantity: 50,
    timestamp: new Date().toISOString(),
    pnl: 225.0,
  },
]

export default function Home() {
  const sampleData = generateData(200, "1h", "AAPL")
  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: "AAPL",
      side: "long",
      quantity: 100,
      averagePrice: sampleData[50].close,
      unrealizedPnl: 450.0,
      realizedPnl: 0,
      timestamp: sampleData[50].time,
    },
    {
      symbol: "AAPL",
      side: "short",
      quantity: 50,
      averagePrice: sampleData[100].close,
      unrealizedPnl: -225.0,
      realizedPnl: 0,
      timestamp: sampleData[100].time,
    },
  ])

  // Handler for position cancellation
  const handleCancelPosition = (positionToCancel: Position) => {
    setPositions((currentPositions) =>
      currentPositions.filter(
        (p) =>
          !(
            p.symbol === positionToCancel.symbol &&
            p.side === positionToCancel.side &&
            p.timestamp === positionToCancel.timestamp
          ),
      ),
    )
  }

  // Generate sample orders within the chart's timeframe
  const sampleOrders: Order[] = [
    {
      id: "1",
      symbol: "AAPL",
      side: "buy",
      type: "limit",
      price: sampleData[150].low * 0.99, // Slightly below the candle
      quantity: 100,
      status: "pending",
      timestamp: sampleData[150].time,
    },
    {
      id: "2",
      symbol: "AAPL",
      side: "sell",
      type: "limit",
      price: sampleData[160].high * 1.01, // Slightly above the candle
      quantity: 50,
      status: "filled",
      timestamp: sampleData[160].time,
    },
    {
      id: "3",
      symbol: "AAPL",
      side: "buy",
      type: "limit",
      price: sampleData[170].low * 0.98,
      quantity: 75,
      status: "cancelled",
      timestamp: sampleData[170].time,
    },
    {
      id: "4",
      symbol: "AAPL",
      side: "sell",
      type: "limit",
      price: sampleData[180].high * 1.02,
      quantity: 25,
      status: "rejected",
      timestamp: sampleData[180].time,
    },
  ]

  // Add orders state
  const [orders, setOrders] = useState<Order[]>(sampleOrders)

  // Add handler for new orders
  const handleNewOrder = (order: Order) => {
    setOrders((current) => [...current, order])
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Trading Chart Library</h1>
      <div className="grid gap-8">
        <CandlestickChart
          data={sampleData}
          height={600}
          symbol="AAPL"
          orders={orders}
          trades={sampleTrades}
          positions={positions}
          onCancelPosition={handleCancelPosition}
          onNewOrder={handleNewOrder}
        />
      </div>
    </main>
  )
}

