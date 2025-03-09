"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import ChartToolbar from "./ChartToolbar"
import CandlestickChart from "./CandlestickChart"
import type { DrawingTool } from "@/types/drawing-types"
import { DrawingToolDebug } from "../debug/DrawingToolDebug"
import { ConnectionTest } from "../debug/ConnectionTest"
import eventBus from "@/utils/event-bus"

const DEBUG = true

interface TradingChartProps {
  // Add any props needed
  data: any[]
  selectedIndicators?: string[]
  indicatorConfigs?: any
  darkMode?: boolean
  orders?: any[]
  positions?: any[]
  height?: number
  yAxisRange?: number[]
  xAxisRange?: string[]
  subplotHeights?: number[]
  onChartReady?: () => void
  onChartZoom?: (zoomLevel: number) => void
}

export function TradingChart({
  data,
  selectedIndicators = [],
  indicatorConfigs = {},
  darkMode = false,
  orders = [],
  positions = [],
  height = 500,
  yAxisRange,
  xAxisRange,
  subplotHeights,
  onChartReady,
  onChartZoom,
}: TradingChartProps) {
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<DrawingTool>("cursor")
  const chartRef = useRef<HTMLDivElement>(null)

  // Keep track of previous selectedDrawingTool for comparison
  const prevSelectedDrawingToolRef = useRef<DrawingTool>(selectedDrawingTool)

  // Add logging to track tool selection
  useEffect(() => {
    console.log(
      `TradingChart: selectedDrawingTool changed from ${prevSelectedDrawingToolRef.current} to ${selectedDrawingTool}`,
    )
    prevSelectedDrawingToolRef.current = selectedDrawingTool
  }, [selectedDrawingTool])

  // Log on mount
  useEffect(() => {
    console.log("TradingChart mounted")

    return () => {
      console.log("TradingChart unmounting")
    }
  }, [])

  // FIXED: This is the key function that needs to be fixed
  const handleToolSelect = useCallback(
    (tool: DrawingTool) => {
      console.log(`TradingChart: Tool selected: ${tool}`)

      console.log(`TradingChart: Current selectedDrawingTool: ${selectedDrawingTool}`)
      console.log(`TradingChart: Setting selectedDrawingTool to: ${tool}`)

      setSelectedDrawingTool(tool)

      // For debugging, set the data attribute
      const tradingChartElement = document.querySelector('[data-component="trading-chart"]')
      if (tradingChartElement) {
        tradingChartElement.setAttribute("data-selected-tool", tool)
        console.log(`TradingChart: Updated data-selected-tool attribute to: ${tool}`)
      }
    },
    [selectedDrawingTool],
  )

  // Add a global window function to directly set the tool for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).setDrawingTool = (tool: DrawingTool) => {
        console.log(`TradingChart: Setting tool directly to: ${tool}`)
        setSelectedDrawingTool(tool)
      }

      // Add a function to log the current state
      ;(window as any).logTradingChartState = () => {
        console.log("TradingChart state:", {
          selectedDrawingTool,
          data: data?.length || 0,
          selectedIndicators,
          darkMode,
        })
      }
    }
  }, [selectedDrawingTool, data, selectedIndicators, darkMode])

  useEffect(() => {
    console.log("TradingChart: Setting up event bus subscription")

    const unsubscribe = eventBus.subscribe("toolSelected", (tool: DrawingTool) => {
      console.log(`TradingChart: Received tool selection event for tool: ${tool}`)
      setSelectedDrawingTool(tool)
    })

    return () => {
      console.log("TradingChart: Cleaning up event bus subscription")
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (onChartReady && chartRef.current) {
      onChartReady()
    }
  }, [onChartReady])

  useEffect(() => {
    if (onChartZoom && chartRef.current) {
      // Implement zoom handling logic here
      console.log("Chart zoomed!")
    }
  }, [onChartZoom])

  return (
    <div
      className="flex flex-col h-full"
      data-component="trading-chart"
      data-selected-tool={selectedDrawingTool}
      ref={chartRef}
    >
      <ChartToolbar
        onToolSelect={handleToolSelect}
        selectedTool={selectedDrawingTool}
        // Add other props as needed
        darkMode={darkMode}
        selectedIndicators={selectedIndicators}
      />
      <CandlestickChart
        data={data}
        selectedIndicators={selectedIndicators}
        indicatorConfigs={indicatorConfigs}
        darkMode={darkMode}
        orders={orders}
        positions={positions}
        height={height}
        yAxisRange={yAxisRange}
        xAxisRange={xAxisRange}
        subplotHeights={subplotHeights}
        selectedTool={selectedDrawingTool} // Make sure this prop is being passed
        onChartZoom={onChartZoom} // Pass onChartZoom prop to CandlestickChart
      />

      {/* Add a debug button to directly set the drawing tool */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-4 right-4 bg-white p-2 border rounded shadow-md z-50">
          <div className="font-bold mb-2">Debug: Drawing Tools</div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-2 py-1 border rounded ${selectedDrawingTool === "cursor" ? "bg-blue-500 text-white" : ""}`}
              onClick={() => setSelectedDrawingTool("cursor")}
            >
              Cursor
            </button>
            <button
              className={`px-2 py-1 border rounded ${selectedDrawingTool === "line" ? "bg-blue-500 text-white" : ""}`}
              onClick={() => setSelectedDrawingTool("line")}
            >
              Line
            </button>
            <button
              className={`px-2 py-1 border rounded ${selectedDrawingTool === "circle" ? "bg-blue-500 text-white" : ""}`}
              onClick={() => setSelectedDrawingTool("circle")}
            >
              Circle
            </button>
          </div>
          <div className="mt-2">
            <div>Current Tool: {selectedDrawingTool}</div>
          </div>
        </div>
      )}
      {process.env.NODE_ENV !== "production" && <DrawingToolDebug />}
      {process.env.NODE_ENV !== "production" && <ConnectionTest />}
    </div>
  )
}

export default TradingChart

