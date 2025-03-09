"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ChartProps, DataPoint } from "../types/chart-types"
import { ChartToolbar } from "./chart-toolbar"
import { generateData } from "@/utils/indicator-calculations"
import { mockStocks } from "@/utils/mock-stocks"
import { TradingPanel } from "./trading-panel"
import type { Order, Trade, Position } from "@/types/trading-types"
import { TradeEntryDialog } from "./trade-entry-dialog"
import { v4 as uuidv4 } from "uuid"
import type { OrderSide, OrderType } from "@/types/trading-types"
import { OrderContextMenu } from "./order-context-menu"
import { getAxisRange, getMouseEventData } from "@/utils/chart-utils"
import { useSubplotHeights, useSubplotRanges } from "@/utils/chart-subplots"
import { generateChartLayout, generateChartConfig } from "@/utils/chart-layout"
import { generatePlotData } from "@/utils/chart-indicators"
import { ChartDragZone } from "./chart-drag-zone"
import { X } from "lucide-react"

// Add this import at the top of the file
import { IndicatorConfigDialog } from "./indicator-config-dialog"

// Constants for chart layout
const SUBPLOT_HEIGHT_PERCENTAGE = 0.3 // 30% of total height per subplot
const XAXIS_HEIGHT_PERCENTAGE = 0.08 // 8% height for x-axis
const MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE = 0.05 // 5% margin

declare global {
  interface Window {
    Plotly: any
  }
}

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface CandlestickChartProps extends ChartProps {
  symbol?: string
  onSymbolChange?: (symbol: string) => void
  orders?: Order[]
  trades?: Trade[]
  positions?: Position[]
  onCancelPosition?: (position: Position) => void
  onNewOrder?: (order: Order) => void
}

// Shape interfaces
interface SimpleLine {
  type: "line"
  x0: string
  y0: number
  x1: string
  y1: number
  color: string
  width: number
}

interface SimpleRectangle {
  type: "rect"
  x0: string
  y0: number
  x1: string
  y1: number
  color: string
  width: number
  fillcolor?: string
  opacity?: number
}

type SimpleShape = SimpleLine | SimpleRectangle

// Define indicator details for the custom legend
const INDICATOR_DETAILS = {
  sma: {
    name: "SMA",
    color: "rgb(249, 115, 22)",
    getLabel: (config: Record<string, any>) => `SMA (${config?.period || 14})`,
  },
  ema: {
    name: "EMA",
    color: "rgb(16, 185, 129)",
    getLabel: (config: Record<string, any>) => `EMA (${config?.period || 9})`,
  },
  ichimoku: {
    name: "Ichimoku",
    color: "rgb(59, 130, 246)",
    getLabel: (config: Record<string, any>) => {
      const conversionPeriod = config?.conversionPeriod || 9
      const basePeriod = config?.basePeriod || 26
      const spanPeriod = config?.spanPeriod || 52
      const displacement = config?.displacement || 26
      return `Ichimoku (${conversionPeriod},${basePeriod},${spanPeriod},${displacement})`
    },
  },
  rsi: {
    name: "RSI",
    color: "rgb(139, 92, 246)",
    getLabel: (config: Record<string, any>) => `RSI (${config?.period || 14})`,
  },
  macd: {
    name: "MACD",
    color: "rgb(236, 72, 153)",
    getLabel: (config: Record<string, any>) => {
      const fast = config?.fastPeriod || 12
      const slow = config?.slowPeriod || 26
      const signal = config?.signalPeriod || 9
      return `MACD (${fast},${slow},${signal})`
    },
  },
  bollinger: {
    name: "Bollinger",
    color: "rgb(251, 146, 60)",
    getLabel: (config: Record<string, any>) => {
      const period = config?.period || 20
      const stdDev = config?.stdDev || 2
      return `Bollinger (${period},${stdDev})`
    },
  },
}

// Define indicator configurations with their default parameters
const INDICATOR_CONFIGS = {
  sma: {
    label: "SMA",
    defaultParams: [
      { name: "period", type: "number", label: "Period", value: 14, min: 1, max: 200 },
      { name: "color", type: "color", label: "Color", value: "rgb(249, 115, 22)" },
    ],
  },
  ema: {
    label: "EMA",
    defaultParams: [
      { name: "period", type: "number", label: "Period", value: 9, min: 1, max: 200 },
      { name: "color", type: "color", label: "Color", value: "rgb(16, 185, 129)" },
    ],
  },
  rsi: {
    label: "RSI",
    defaultParams: [
      { name: "period", type: "number", label: "Period", value: 14, min: 1, max: 200 },
      { name: "color", type: "color", label: "Color", value: "rgb(139, 92, 246)" },
    ],
  },
  macd: {
    label: "MACD",
    defaultParams: [
      { name: "fastPeriod", type: "number", label: "Fast Period", value: 12, min: 1, max: 200 },
      { name: "slowPeriod", type: "number", label: "Slow Period", value: 26, min: 1, max: 200 },
      { name: "signalPeriod", type: "number", label: "Signal Period", value: 9, min: 1, max: 200 },
      { name: "macdColor", type: "color", label: "MACD Line Color", value: "rgb(59, 130, 246)" },
      { name: "signalColor", type: "color", label: "Signal Line Color", value: "rgb(249, 115, 22)" },
      { name: "histogramColor", type: "color", label: "Histogram Color", value: "rgb(139, 92, 246)" },
    ],
  },
  bollinger: {
    label: "Bollinger Bands",
    defaultParams: [
      { name: "period", type: "number", label: "Period", value: 20, min: 1, max: 200 },
      { name: "stdDev", type: "number", label: "Standard Deviation", value: 2, min: 0.1, max: 5, step: 0.1 },
      { name: "upperColor", type: "color", label: "Upper Band Color", value: "rgb(59, 130, 246)" },
      { name: "middleColor", type: "color", label: "Middle Band Color", value: "rgb(249, 115, 22)" },
      { name: "lowerColor", type: "color", label: "Lower Band Color", value: "rgb(139, 92, 246)" },
    ],
  },
  ichimoku: {
    label: "Ichimoku",
    defaultParams: [
      { name: "conversionPeriod", type: "number", label: "Conversion Period", value: 9, min: 1, max: 200 },
      { name: "basePeriod", type: "number", label: "Base Period", value: 26, min: 1, max: 200 },
      { name: "spanPeriod", type: "number", label: "Span Period", value: 52, min: 1, max: 200 },
      { name: "displacement", type: "number", label: "Displacement", value: 26, min: 1, max: 200 },
      { name: "conversionColor", type: "color", label: "Conversion Line Color", value: "rgb(59, 130, 246)" },
      { name: "baseColor", type: "color", label: "Base Line Color", value: "rgb(249, 115, 22)" },
      { name: "spanAColor", type: "color", label: "Span A Color", value: "rgba(59, 130, 246, 0.5)" },
      { name: "spanBColor", type: "color", label: "Span B Color", value: "rgba(236, 72, 153, 0.5)" },
      { name: "chikouColor", type: "color", label: "Chikou Color", value: "rgb(139, 92, 246)" },
    ],
  },
}

export default function CandlestickChart({
  data: initialData,
  height = 600,
  showIchimoku: initialShowIchimoku = true,
  showSMA: initialShowSMA = false,
  showEMA: initialShowEMA = false,
  darkMode = false,
  symbol: initialSymbol = "AAPL",
  onSymbolChange,
  orders = [],
  trades = [],
  positions = [],
  onCancelPosition,
  onNewOrder,
}: CandlestickChartProps) {
  // State
  const [symbol, setSymbol] = useState(initialSymbol)
  const [data, setData] = useState<DataPoint[]>([])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    ...(initialShowIchimoku ? ["ichimoku"] : []),
    ...(initialShowSMA ? ["sma"] : []),
    ...(initialShowEMA ? ["ema"] : []),
  ])
  const [timeframe, setTimeframe] = useState("15m")
  const [isLoading, setIsLoading] = useState(false)
  const [chartKey, setChartKey] = useState(Date.now())
  const [showChart, setShowChart] = useState(true)
  const [indicatorConfigs, setIndicatorConfigs] = useState<Record<string, Record<string, any>>>({})
  const [xAxisRange, setXAxisRange] = useState<[string, string] | null>(null)
  const [yAxisRange, setYAxisRange] = useState<[number, number] | null>(null)
  const [tradeDialog, setTradeDialog] = useState<{
    isOpen: boolean
    price?: number
  }>({ isOpen: false })
  const [rightClickData, setRightClickData] = useState<{
    price: number | null
    time: string | null
  }>({
    price: null,
    time: null,
  })

  // Drawing state
  const [selectedTool, setSelectedTool] = useState<string>("cursor")
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: string; y: number } | null>(null)
  const [endPoint, setEndPoint] = useState<{ x: string; y: number } | null>(null)
  const [shapes, setShapes] = useState<SimpleShape[]>([])
  const [currentMousePosition, setCurrentMousePosition] = useState<{ x: string; y: number } | null>(null)

  // Refs
  const chartRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<any>(null)

  // Custom hooks
  const { subplotHeights, setIsDraggingSubplot } = useSubplotHeights(selectedIndicators)
  const { subplotRanges, setSubplotRanges } = useSubplotRanges(selectedIndicators)

  // Calculate the total height percentage taken by subplots
  const totalSubplotPercentage = subplotHeights.length * SUBPLOT_HEIGHT_PERCENTAGE

  // Calculate main chart height (remaining space after subplots, x-axis, and margin)
  const mainChartPercentage =
    subplotHeights.length > 0
      ? Math.max(0.1, 1 - totalSubplotPercentage - XAXIS_HEIGHT_PERCENTAGE - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE)
      : 1 - XAXIS_HEIGHT_PERCENTAGE - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE

  // Convert to domain values (0-1 range)
  const mainChartDomainStart = 1 - mainChartPercentage
  const mainChartDomainEnd = 1
  const mainChartBottomMarginStart = mainChartDomainStart - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE

  // Function to update chart data
  const updateChartData = useCallback(
    async (newTimeframe: string) => {
      setIsLoading(true)
      setShowChart(false)

      try {
        // Generate new data
        const newData = generateData(500, newTimeframe, symbol)
        const { yaxis } = getAxisRange(newData)
        setYAxisRange(yaxis.range)

        // Force a complete remount of the chart
        setChartKey(Date.now())

        // Update data in the next tick to ensure clean state
        setTimeout(() => {
          setData(newData)
          setShowChart(true)
        }, 0)
      } finally {
        setIsLoading(false)
      }
    },
    [symbol],
  )

  // Handle timeframe changes
  const handleTimeframeChange = useCallback(
    (newTimeframe: string) => {
      setTimeframe(newTimeframe)
      updateChartData(newTimeframe)
    },
    [updateChartData],
  )

  // Initial data load
  useEffect(() => {
    if (initialData) {
      setData(initialData)
    } else {
      // Generate sample data for demonstration
      const sampleData = generateData(500)
      setData(sampleData)
    }
  }, [initialData])

  // Update xAxisRange and yAxisRange when data changes
  useEffect(() => {
    if (data.length) {
      const { xaxis, yaxis } = getAxisRange(data)
      setXAxisRange(xaxis.range)
      setYAxisRange(yaxis.range)
    }
  }, [data])

  // Chart interaction handlers
  const handlePlotEvent = useCallback((event: any) => {
    // Only process if we have valid event data
    if (!event || (!event.points && !event.event)) {
      return
    }

    const eventData = getMouseEventData(event, chartRef.current)
    if (eventData.price !== null && eventData.time !== null) {
      setRightClickData(eventData)
    }
  }, [])

  // Update the symbol handler
  const handleSymbolChange = useCallback(
    (newSymbol: string) => {
      setSymbol(newSymbol)
      onSymbolChange?.(newSymbol)
      updateChartData(timeframe)
    },
    [timeframe, onSymbolChange, updateChartData],
  )

  const handleNewOrder = useCallback(
    (tradeDetails: {
      side: OrderSide
      type: OrderType
      price: number
      quantity: number
    }) => {
      if (!onNewOrder) return

      const order: Order = {
        id: uuidv4(),
        symbol,
        timestamp: new Date().toISOString(),
        status: "pending",
        ...tradeDetails,
      }

      onNewOrder(order)
    },
    [onNewOrder, symbol],
  )

  // Add this function to the component
  const synchronizeAxes = useCallback(() => {
    const plotElement = document.getElementById("plot-container")
    if (!plotElement || !window.Plotly) return

    try {
      const gd = plotElement as any
      if (!gd._fullLayout) return

      // Get the main x-axis range
      const mainRange = gd._fullLayout.xaxis.range

      // Check if we have any subplot axes
      const subplotAxes = Object.keys(gd._fullLayout).filter((key) => key.startsWith("xaxis") && key !== "xaxis")

      // If any subplot axis has a different range, synchronize them
      let needsUpdate = false
      const update: any = {}

      subplotAxes.forEach((axisKey) => {
        const subplotRange = gd._fullLayout[axisKey].range
        if (subplotRange[0] !== mainRange[0] || subplotRange[1] !== mainRange[1]) {
          update[`${axisKey}.range`] = mainRange
          needsUpdate = true
        }
      })

      if (needsUpdate) {
        window.Plotly.relayout(plotElement, update)
      }
    } catch (error) {
      console.error("Error synchronizing axes:", error)
    }
  }, [])

  // Add an effect to call this function periodically
  useEffect(() => {
    // Synchronize axes on mount
    synchronizeAxes()

    // Set up an interval to check and synchronize axes
    const intervalId = setInterval(synchronizeAxes, 1000)

    return () => clearInterval(intervalId)
  }, [synchronizeAxes])

  // Add cursor style for better UX
  useEffect(() => {
    const chartElement = chartRef.current
    if (!chartElement) return

    // Remove all cursor classes first
    chartElement.classList.remove("cursor-grab", "cursor-crosshair")

    // Add appropriate cursor class based on selected tool
    if (["line", "horizontal", "rectangle"].includes(selectedTool)) {
      chartElement.classList.add("cursor-crosshair")
    } else {
      chartElement.classList.add("cursor-grab")
    }

    return () => {
      chartElement.classList.remove("cursor-grab", "cursor-crosshair")
    }
  }, [selectedTool])

  // Add keyboard event listener for Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawing) {
        console.log("Canceling drawing (Escape key)")
        setIsDrawing(false)
        setStartPoint(null)
        setEndPoint(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isDrawing])

  // Function to extract point from event
  const extractPointFromEvent = useCallback((event: any) => {
    if (!event || !event.points || event.points.length === 0) {
      return null
    }

    try {
      const point = event.points[0]

      // Make sure we have valid x and y values
      if (!point || point.x === undefined || point.y === undefined) {
        console.error("Invalid point data in event:", point)
        return null
      }

      // For candlestick charts, we need to handle the point differently
      // to get the exact position where the user clicked
      const x = point.x

      // Use the exact y-coordinate from the mouse position if available
      // This gives more precise positioning
      let y = point.y
      if (event.event && point.yaxis) {
        try {
          // Convert pixel to data coordinates for more accuracy
          y = point.yaxis.p2d(event.event.offsetY)
        } catch (e) {
          console.warn("Could not convert y pixel to data:", e)
        }
      }

      return { x, y }
    } catch (error) {
      console.error("Error extracting point from event:", error)
      return null
    }
  }, [])

  // Handle mouse move for drawing
  const handleMouseMove = useCallback(
    (event: any) => {
      // Extract point from event
      const point = extractPointFromEvent(event)
      if (!point) return

      // Always update current mouse position
      setCurrentMousePosition(point)

      // If we're in drawing mode and have started drawing
      if ((selectedTool === "line" || selectedTool === "rectangle") && isDrawing && startPoint) {
        console.log(`Moving ${selectedTool} to:`, point)

        // Update the end point state
        setEndPoint(point)

        // IMPORTANT: Immediately update the plot to show the shape
        const plotElement = document.getElementById("plot-container")
        if (plotElement && window.Plotly) {
          try {
            // Create shapes array with existing shapes and the active shape
            const plotShapes = shapes
              .map((shape) => {
                if (shape.type === "line") {
                  return {
                    type: "line",
                    x0: shape.x0,
                    y0: shape.y0,
                    x1: shape.x1,
                    y1: shape.y1,
                    line: {
                      color: shape.color,
                      width: shape.width,
                    },
                  }
                } else if (shape.type === "rect") {
                  return {
                    type: "rect",
                    x0: shape.x0,
                    y0: shape.y0,
                    x1: shape.x1,
                    y1: shape.y1,
                    line: {
                      color: shape.color,
                      width: shape.width,
                    },
                    fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
                    opacity: shape.opacity || 0.2,
                  }
                }
                return null
              })
              .filter(Boolean)

            // Add the active shape being drawn
            if (selectedTool === "line") {
              plotShapes.push({
                type: "line",
                x0: startPoint.x,
                y0: startPoint.y,
                x1: point.x,
                y1: point.y,
                line: {
                  color: "rgb(255, 0, 0)", // Red for active line
                  width: 2,
                },
              })
            } else if (selectedTool === "rectangle") {
              plotShapes.push({
                type: "rect",
                x0: startPoint.x,
                y0: startPoint.y,
                x1: point.x,
                y1: point.y,
                line: {
                  color: "rgb(255, 0, 0)", // Red for active rectangle
                  width: 2,
                },
                fillcolor: "rgba(255, 0, 0, 0.1)",
                opacity: 0.2,
              })
            }

            // Update the plot with the new shapes
            window.Plotly.relayout(plotElement, { shapes: plotShapes })
          } catch (error) {
            console.error(`Error updating ${selectedTool} during mouse move:`, error)
          }
        }
      } else if (event.event && event.points?.length > 0) {
        handlePlotEvent(event)
      }
    },
    [selectedTool, isDrawing, startPoint, shapes, extractPointFromEvent, handlePlotEvent],
  )

  // Handle click for drawing
  const handleClick = useCallback(
    (event: any) => {
      if (selectedTool === "line" || selectedTool === "rectangle") {
        const point = extractPointFromEvent(event)
        if (!point) {
          console.error("No valid point in click event")
          return
        }

        if (!isDrawing) {
          // First click - start drawing
          console.log(`Starting ${selectedTool} drawing at`, point)
          setStartPoint(point)
          setEndPoint(point) // Initialize end point to same as start
          setIsDrawing(true)

          // IMPORTANT: Immediately show the initial point
          const plotElement = document.getElementById("plot-container")
          if (plotElement && window.Plotly) {
            try {
              const plotShapes = shapes
                .map((shape) => {
                  if (shape.type === "line") {
                    return {
                      type: "line",
                      x0: shape.x0,
                      y0: shape.y0,
                      x1: shape.x1,
                      y1: shape.y1,
                      line: {
                        color: shape.color,
                        width: shape.width,
                      },
                    }
                  } else if (shape.type === "rect") {
                    return {
                      type: "rect",
                      x0: shape.x0,
                      y0: shape.y0,
                      x1: shape.x1,
                      y1: shape.y1,
                      line: {
                        color: shape.color,
                        width: shape.width,
                      },
                      fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
                      opacity: shape.opacity || 0.2,
                    }
                  }
                  return null
                })
                .filter(Boolean)

              // Initial point of new shape
              if (selectedTool === "line") {
                plotShapes.push({
                  type: "line",
                  x0: point.x,
                  y0: point.y,
                  x1: point.x,
                  y1: point.y,
                  line: {
                    color: "rgb(255, 0, 0)",
                    width: 2,
                  },
                })
              } else if (selectedTool === "rectangle") {
                plotShapes.push({
                  type: "rect",
                  x0: point.x,
                  y0: point.y,
                  x1: point.x,
                  y1: point.y,
                  line: {
                    color: "rgb(255, 0, 0)",
                    width: 2,
                  },
                  fillcolor: "rgba(255, 0, 0, 0.1)",
                  opacity: 0.2,
                })
              }

              window.Plotly.relayout(plotElement, { shapes: plotShapes })
            } catch (error) {
              console.error("Error showing initial point:", error)
            }
          }
        } else {
          // Second click - complete the shape
          if (!startPoint) {
            console.error("No start point available")
            return
          }

          console.log(`Completing ${selectedTool} from`, startPoint, "to", point)

          // Add the completed shape to our shapes array
          if (selectedTool === "line") {
            const newLine: SimpleLine = {
              type: "line",
              x0: startPoint.x,
              y0: startPoint.y,
              x1: point.x,
              y1: point.y,
              color: "rgb(0, 0, 255)",
              width: 2,
            }
            setShapes((prev) => [...prev, newLine])
          } else if (selectedTool === "rectangle") {
            const newRect: SimpleRectangle = {
              type: "rect",
              x0: startPoint.x,
              y0: startPoint.y,
              x1: point.x,
              y1: point.y,
              color: "rgb(0, 0, 255)",
              width: 2,
              fillcolor: "rgba(0, 0, 255, 0.1)",
              opacity: 0.2,
            }
            setShapes((prev) => [...prev, newRect])
          }

          // Reset drawing state
          setIsDrawing(false)
          setStartPoint(null)
          setEndPoint(null)

          // Update the plot with all shapes
          const plotElement = document.getElementById("plot-container")
          if (plotElement && window.Plotly) {
            const updatedShapes = [...shapes]
            if (selectedTool === "line") {
              updatedShapes.push({
                type: "line",
                x0: startPoint.x,
                y0: startPoint.y,
                x1: point.x,
                y1: point.y,
                color: "rgb(0, 0, 255)",
                width: 2,
              })
            } else if (selectedTool === "rectangle") {
              updatedShapes.push({
                type: "rect",
                x0: startPoint.x,
                y0: startPoint.y,
                x1: point.x,
                y1: point.y,
                color: "rgb(0, 0, 255)",
                width: 2,
                fillcolor: "rgba(0, 0, 255, 0.1)",
                opacity: 0.2,
              })
            }

            const plotShapes = updatedShapes
              .map((shape) => {
                if (shape.type === "line") {
                  return {
                    type: "line",
                    x0: shape.x0,
                    y0: shape.y0,
                    x1: shape.x1,
                    y1: shape.y1,
                    line: {
                      color: shape.color,
                      width: shape.width,
                    },
                  }
                } else if (shape.type === "rect") {
                  return {
                    type: "rect",
                    x0: shape.x0,
                    y0: shape.y0,
                    x1: shape.x1,
                    y1: shape.y1,
                    line: {
                      color: shape.color,
                      width: shape.width,
                    },
                    fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
                    opacity: shape.opacity || 0.2,
                  }
                }
                return null
              })
              .filter(Boolean)

            window.Plotly.relayout(plotElement, { shapes: plotShapes })
          }
        }
      } else if (selectedTool === "horizontal") {
        // For horizontal lines, we draw across the entire chart with a single click
        const point = extractPointFromEvent(event)
        if (!point) {
          console.error("No valid point in click event")
          return
        }

        console.log(`Drawing horizontal line at price ${point.y}`)

        // Get the full x-range of the chart to draw the line from left to right edge
        const plotElement = document.getElementById("plot-container")
        if (!plotElement || !window.Plotly) return

        try {
          const gd = plotElement as any
          if (!gd._fullLayout || !gd._fullLayout.xaxis) return

          // Get the current x-axis range
          const xRange = gd._fullLayout.xaxis.range
          const leftEdge = xRange[0]
          const rightEdge = xRange[1]

          // Create the horizontal line spanning the entire chart width
          const newLine: SimpleLine = {
            type: "line",
            x0: leftEdge,
            y0: point.y,
            x1: rightEdge,
            y1: point.y,
            color: "rgb(0, 0, 255)",
            width: 2,
          }

          // Add the new line to our shapes array
          setShapes((prev) => [...prev, newLine])

          // Update the plot with all shapes
          const plotShapes = [...shapes, newLine]
            .map((shape) => {
              if (shape.type === "line") {
                return {
                  type: "line",
                  x0: shape.x0,
                  y0: shape.y0,
                  x1: shape.x1,
                  y1: shape.y1,
                  line: {
                    color: shape.color,
                    width: shape.width,
                  },
                }
              } else if (shape.type === "rect") {
                return {
                  type: "rect",
                  x0: shape.x0,
                  y0: shape.y0,
                  x1: shape.x1,
                  y1: shape.y1,
                  line: {
                    color: shape.color,
                    width: shape.width,
                  },
                  fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
                  opacity: shape.opacity || 0.2,
                }
              }
              return null
            })
            .filter(Boolean)

          window.Plotly.relayout(plotElement, { shapes: plotShapes })
        } catch (error) {
          console.error("Error drawing horizontal line:", error)
        }
      } else {
        handlePlotEvent(event)
      }
    },
    [selectedTool, isDrawing, startPoint, shapes, extractPointFromEvent, handlePlotEvent],
  )

  // Generate shapes for the chart layout
  const generateShapes = useCallback(() => {
    const plotShapes = shapes
      .map((shape) => {
        if (shape.type === "line") {
          return {
            type: "line",
            x0: shape.x0,
            y0: shape.y0,
            x1: shape.x1,
            y1: shape.y1,
            line: {
              color: shape.color,
              width: shape.width,
            },
          }
        } else if (shape.type === "rect") {
          return {
            type: "rect",
            x0: shape.x0,
            y0: shape.y0,
            x1: shape.x1,
            y1: shape.y1,
            line: {
              color: shape.color,
              width: shape.width,
            },
            fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
            opacity: shape.opacity || 0.2,
          }
        }
        return null
      })
      .filter(Boolean)

    // Add active shape if drawing
    if (isDrawing && startPoint && endPoint) {
      if (selectedTool === "line") {
        plotShapes.push({
          type: "line",
          x0: startPoint.x,
          y0: startPoint.y,
          x1: endPoint.x,
          y1: endPoint.y,
          line: {
            color: "rgb(255, 0, 0)", // Red for active line
            width: 2,
          },
        })
      } else if (selectedTool === "rectangle") {
        plotShapes.push({
          type: "rect",
          x0: startPoint.x,
          y0: startPoint.y,
          x1: endPoint.x,
          y1: endPoint.y,
          line: {
            color: "rgb(255, 0, 0)", // Red for active rectangle
            width: 2,
          },
          fillcolor: "rgba(255, 0, 0, 0.1)",
          opacity: 0.2,
        })
      }
    }

    return plotShapes
  }, [shapes, isDrawing, startPoint, endPoint, selectedTool])

  // Add event listener for relayout events to keep subplot axes in sync
  useEffect(() => {
    const plotElement = document.getElementById("plot-container")
    if (!plotElement || !window.Plotly) return

    // Function to handle relayout events
    const handleRelayout = (eventData: any) => {
      // Check if the event is changing x-axis range
      if (eventData["xaxis.range[0]"] || eventData["xaxis.range[1]"] || eventData["xaxis.range"]) {
        // Synchronize all subplot x-axes with the main x-axis
        synchronizeAxes()
      }
    }

    // Add the event listener
    if (plotElement.on) {
      plotElement.on("plotly_relayout", handleRelayout)
    }

    return () => {
      // Remove the event listener
      if (plotElement.removeAllListeners) {
        plotElement.removeAllListeners("plotly_relayout")
      }
    }
  }, [synchronizeAxes])

  // Handle removing an indicator from the legend
  const handleRemoveIndicator = useCallback((indicator: string) => {
    setSelectedIndicators((prev) => prev.filter((i) => i !== indicator))
  }, [])

  // Add a new state to track which indicator is being configured
  const [configureIndicator, setConfigureIndicator] = useState<string | null>(null)

  // Add a function to handle opening the configuration dialog
  const handleConfigureIndicator = useCallback(
    (indicator: string) => {
      console.log("Opening configuration for indicator:", indicator)

      // Get the current configuration for this indicator
      const currentConfig = indicatorConfigs[indicator] || {}

      // Get the indicator configuration definition
      const indicatorConfig = INDICATOR_CONFIGS[indicator as keyof typeof INDICATOR_CONFIGS]

      if (indicatorConfig) {
        // Set the dialog state with the indicator configuration
        setConfigDialog({
          open: true,
          indicator: {
            value: indicator,
            label: indicatorConfig.label,
            configurable: true,
            defaultParams: indicatorConfig.defaultParams.map((param) => ({
              ...param,
              value: currentConfig[param.name] !== undefined ? currentConfig[param.name] : param.value,
            })),
          },
        })
      }
    },
    [indicatorConfigs],
  )

  // Add a new state for the configuration dialog
  const [configDialog, setConfigDialog] = useState<{
    open: boolean
    indicator?: {
      value: string
      label: string
      configurable: boolean
      defaultParams: any[]
    }
  }>({ open: false })

  // Handle saving indicator configuration
  const handleConfigSave = useCallback(
    (params: Record<string, any>) => {
      if (configDialog.indicator) {
        console.log("Saving configuration for indicator:", configDialog.indicator.value, params)

        // Update the indicator configuration
        setIndicatorConfigs((prev) => ({
          ...prev,
          [configDialog.indicator.value]: params,
        }))

        // Force a chart update by updating the chart key
        setChartKey(Date.now())

        // Close the dialog
        setConfigDialog({ open: false })
      }
    },
    [configDialog],
  )

  // Update chart when indicator configurations change
  useEffect(() => {
    if (Object.keys(indicatorConfigs).length > 0 && data.length > 0) {
      // Force a chart update when indicator configurations change
      setChartKey(Date.now())
    }
  }, [indicatorConfigs, data.length])

  // Custom legend component
  const CustomLegend = () => {
    if (selectedIndicators.length === 0) return null

    return (
      <div className="absolute left-4 top-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md rounded-md p-2 border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium mb-1 px-1">Indicators</div>
        <ul className="space-y-1">
          {selectedIndicators.map((indicator) => {
            const details = INDICATOR_DETAILS[indicator as keyof typeof INDICATOR_DETAILS] || {
              name: indicator.charAt(0).toUpperCase() + indicator.slice(1),
              color: "rgb(107, 114, 128)",
              getLabel: () => indicator.charAt(0).toUpperCase() + indicator.slice(1),
            }

            // Get the configuration for this indicator
            const config = indicatorConfigs[indicator] || {}

            // Generate the label with configuration details
            const label = details.getLabel(config)

            return (
              <li
                key={indicator}
                className="flex items-center justify-between gap-2 px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleConfigureIndicator(indicator)}
                >
                  {/* Removed the color dot */}
                  <span>{label}</span>
                </div>
                <button
                  onClick={() => handleRemoveIndicator(indicator)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={`Remove ${details.name} indicator`}
                >
                  <X size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // Add a new state for the configuration dialog open state
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  // Handle saving indicator configuration
  const handleIndicatorConfigSave = (indicatorId: string, newParams: Record<string, any>) => {
    console.log("Saving config for:", indicatorId, "New params:", newParams)

    // Update the indicator configuration
    setIndicatorConfigs((prev) => {
      const updated = {
        ...prev,
        [indicatorId]: {
          ...prev[indicatorId],
          ...newParams,
        },
      }
      console.log("Updated configs:", updated)
      return updated
    })

    // Force chart update
    setChartKey((prev) => prev + 1)
    setConfigDialogOpen(false)
  }

  return (
    <Card className={`w-full ${darkMode ? "dark bg-gray-900 text-white" : ""}`}>
      <CardHeader className="p-0">
        <ChartToolbar
          selectedTimeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          selectedIndicators={selectedIndicators}
          onIndicatorChange={(indicator, checked) => {
            setSelectedIndicators((prev) => (checked ? [...prev, indicator] : prev.filter((i) => i !== indicator)))
          }}
          selectedSymbol={symbol}
          onSymbolChange={handleSymbolChange}
          onIndicatorConfigChange={(indicator, config) => {
            setIndicatorConfigs((prev) => ({
              ...prev,
              [indicator]: config,
            }))
          }}
          configureIndicator={configureIndicator}
          onConfigureIndicator={setConfigureIndicator}
          configDialog={configDialog}
          onConfigDialog={setConfigDialog}
          onConfigSave={handleIndicatorConfigSave}
        />
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="p-2 border-b">
          <h2 className="text-lg font-semibold">
            {symbol} - {mockStocks.find((s) => s.symbol === symbol)?.name}
          </h2>
        </div>
        <div className={`w-full h-[${height}px] relative border-b`} ref={chartRef}>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="animate-pulse">Loading...</div>
            </div>
          )}
          {showChart && (
            <>
              {/* Custom Legend */}
              <CustomLegend />

              <OrderContextMenu onNewOrder={onNewOrder} symbol={symbol} pointData={rightClickData}>
                <Plot
                  ref={plotRef}
                  key={chartKey}
                  data={generatePlotData({
                    data,
                    selectedIndicators,
                    indicatorConfigs,
                    darkMode,
                    orders,
                    positions,
                  })}
                  layout={{
                    ...generateChartLayout({
                      darkMode,
                      height,
                      yAxisRange: yAxisRange || [0, 100],
                      xAxisRange: xAxisRange || (data.length ? [data[0].time, data[data.length - 1].time] : ["", ""]),
                      data,
                      lines: [], // Remove lines from here since we'll add shapes directly
                      activeLine: null, // Remove activeLine from here
                      subplotHeights: subplotHeights || [],
                    }),
                    shapes: generateShapes(), // This is the key change - add shapes directly to the layout
                    showlegend: false, // Hide the default Plotly legend
                  }}
                  config={{
                    ...generateChartConfig(),
                    dragmode: ["line", "rectangle"].includes(selectedTool) ? "select" : "pan",
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  useResizeHandler
                  onClick={handleClick}
                  onMouseMove={handleMouseMove}
                  onRightClick={(event) => {
                    event.preventDefault()
                    if ((selectedTool === "line" || selectedTool === "rectangle") && isDrawing) {
                      setIsDrawing(false)
                      setStartPoint(null)
                      setEndPoint(null)
                    } else {
                      handlePlotEvent(event)
                    }
                  }}
                  divId="plot-container"
                />

                {/* Drag zones container with flex-col */}
                <div className="absolute right-0 top-0 bottom-0 w-[40px] flex flex-col">
                  {/* Main chart drag zone */}
                  <ChartDragZone
                    axisKey="yaxis"
                    top="0"
                    height={`${(mainChartDomainEnd - mainChartDomainStart) * 100}%`}
                    zIndex={20}
                    label=""
                    color="transparent"
                  />

                  {/* Subplot drag zones in order: Y2, Y3, etc. */}
                  {subplotHeights.map((subplot, index) => {
                    const axisNumber = index + 2 // yaxis2, yaxis3, etc.
                    const axisKey = `yaxis${axisNumber}`

                    return (
                      <ChartDragZone
                        key={subplot.id}
                        axisKey={axisKey}
                        top="0" // Not needed with flex
                        height={`${SUBPLOT_HEIGHT_PERCENTAGE * 100}%`}
                        zIndex={30}
                        className="border-t"
                        label=""
                        color="transparent"
                      />
                    )
                  })}
                </div>
              </OrderContextMenu>
            </>
          )}
        </div>
        <TradingPanel
          orders={orders}
          trades={trades}
          positions={positions}
          onCancelPosition={onCancelPosition}
          className="mt-0"
        />
        <TradeEntryDialog
          isOpen={tradeDialog.isOpen}
          onClose={() => setTradeDialog({ isOpen: false })}
          onSubmit={handleNewOrder}
          defaultPrice={tradeDialog.price}
        />
      </CardContent>
      {configDialog.indicator && (
        <IndicatorConfigDialog
          isOpen={configDialog.open}
          onClose={() => setConfigDialog({ open: false })}
          title={configDialog.indicator.label}
          parameters={configDialog.indicator.defaultParams}
          onSave={handleConfigSave}
        />
      )}
    </Card>
  )
}

