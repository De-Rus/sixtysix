"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo } from "react"
import type { DataPoint } from "@/types/chart-types"
import type { Order, Trade, Position } from "@/types/trading-types"
import type { DrawingTool } from "@/types/drawing-types"
import { generateData } from "@/utils/mock/mock-data-generator"

interface ChartContextType {
  // Data
  data: DataPoint[]
  setData: (data: DataPoint[]) => void

  // Chart settings
  symbol: string
  setSymbol: (symbol: string) => void
  timeframe: string
  setTimeframe: (timeframe: string) => void
  selectedIndicators: string[]
  setSelectedIndicators: (indicators: string[]) => void
  indicatorConfigs: Record<string, Record<string, any>>
  setIndicatorConfigs: (configs: Record<string, Record<string, any>>) => void

  // Chart state
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void

  // Axis ranges
  xAxisRange: [string, string] | null
  setXAxisRange: (range: [string, string] | null) => void
  yAxisRange: [number, number] | null
  setYAxisRange: (range: [number, number] | null) => void

  // Drawing tools
  selectedTool: DrawingTool
  setSelectedTool: (tool: DrawingTool) => void

  // Trading data
  orders: Order[]
  setOrders: (orders: Order[]) => void
  trades: Trade[]
  setTrades: (trades: Trade[]) => void
  positions: Position[]
  setPositions: (positions: Position[]) => void

  // Actions
  updateChartData: (timeframe: string, symbol: string) => Promise<void>
  addOrder: (order: Order) => void
  removeOrder: (orderId: string) => void
  addTrade: (trade: Trade) => void
  removeTrade: (tradeId: string) => void
  addPosition: (position: Position) => void
  removePosition: (position: Position) => void
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

export function ChartProvider({ children }: { children: React.ReactNode }) {
  // Data state
  const [data, setData] = useState<DataPoint[]>([])

  // Chart settings
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("15m")
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [indicatorConfigs, setIndicatorConfigs] = useState<Record<string, Record<string, any>>>({})

  // Chart state
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Axis ranges
  const [xAxisRange, setXAxisRange] = useState<[string, string] | null>(null)
  const [yAxisRange, setYAxisRange] = useState<[number, number] | null>(null)

  // Drawing tools
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("cursor")

  // Trading data
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Update chart data
  const updateChartData = useCallback(async (newTimeframe: string, newSymbol: string) => {
    setIsLoading(true)

    try {
      // Generate new data
      const newData = generateData(500, newTimeframe, newSymbol)

      // Calculate y-axis range
      const prices = newData.flatMap((d) => [d.high, d.low])
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const padding = (maxPrice - minPrice) * 0.1

      setYAxisRange([minPrice - padding, maxPrice + padding])
      setXAxisRange([newData[0].time, newData[newData.length - 1].time])

      // Update data
      setData(newData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Trading actions
  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [...prev, order])
  }, [])

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
  }, [])

  const addTrade = useCallback((trade: Trade) => {
    setTrades((prev) => [...prev, trade])
  }, [])

  const removeTrade = useCallback((tradeId: string) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
  }, [])

  const addPosition = useCallback((position: Position) => {
    setPositions((prev) => [...prev, position])
  }, [])

  const removePosition = useCallback((positionToRemove: Position) => {
    setPositions((prev) =>
      prev.filter(
        (p) =>
          !(
            p.symbol === positionToRemove.symbol &&
            p.side === positionToRemove.side &&
            p.timestamp === positionToRemove.timestamp
          ),
      ),
    )
  }, [])

  // Create context value
  const value = useMemo(
    () => ({
      // Data
      data,
      setData,

      // Chart settings
      symbol,
      setSymbol,
      timeframe,
      setTimeframe,
      selectedIndicators,
      setSelectedIndicators,
      indicatorConfigs,
      setIndicatorConfigs,

      // Chart state
      isLoading,
      setIsLoading,
      darkMode,
      setDarkMode,

      // Axis ranges
      xAxisRange,
      setXAxisRange,
      yAxisRange,
      setYAxisRange,

      // Drawing tools
      selectedTool,
      setSelectedTool,

      // Trading data
      orders,
      setOrders,
      trades,
      setTrades,
      positions,
      setPositions,

      // Actions
      updateChartData,
      addOrder,
      removeOrder,
      addTrade,
      removeTrade,
      addPosition,
      removePosition,
    }),
    [
      data,
      symbol,
      timeframe,
      selectedIndicators,
      indicatorConfigs,
      isLoading,
      darkMode,
      xAxisRange,
      yAxisRange,
      selectedTool,
      orders,
      trades,
      positions,
      updateChartData,
      addOrder,
      removeOrder,
      addTrade,
      removeTrade,
      addPosition,
      removePosition,
    ],
  )

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
}

export function useChartContext() {
  const context = useContext(ChartContext)
  if (context === undefined) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

