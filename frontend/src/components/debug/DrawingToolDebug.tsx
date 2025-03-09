"use client"

import { useState, useEffect } from "react"
import type { DrawingTool } from "@/types/drawing-types"
import eventBus from "@/utils/event-bus"

export function DrawingToolDebug() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("cursor")
  const [eventLog, setEventLog] = useState<string[]>([])

  useEffect(() => {
    console.log("DrawingToolDebug: Setting up event bus subscription")

    const unsubscribe = eventBus.subscribe("toolSelected", (tool: DrawingTool) => {
      console.log(`DrawingToolDebug: Received tool selection event for tool: ${tool}`)
      setSelectedTool(tool)
      setEventLog((prev) => [
        `${new Date().toISOString().split("T")[1].split(".")[0]} - Tool changed to: ${tool}`,
        ...prev.slice(0, 9),
      ])
    })

    return () => {
      console.log("DrawingToolDebug: Cleaning up event bus subscription")
      unsubscribe()
    }
  }, [])

  const handleToolSelect = (tool: DrawingTool) => {
    console.log(`DrawingToolDebug: Manually selecting tool: ${tool}`)
    eventBus.publish("toolSelected", tool)
  }

  // Add a global function to set the tool for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).setToolGlobally = (tool: DrawingTool) => {
        console.log(`DrawingToolDebug: Setting tool globally to: ${tool}`)
        eventBus.publish("toolSelected", tool)
      }
      ;(window as any).logEventBusState = () => {
        eventBus.logState()
      }

      // Add a specific test for the circle tool
      ;(window as any).testCircleTool = () => {
        console.log("DrawingToolDebug: Testing circle tool")

        // First, set the tool to circle
        eventBus.publish("toolSelected", "circle" as DrawingTool)

        // Find the candlestick chart
        const candlestickChart = document.querySelector('[data-component="candlestick-chart"]')
        if (!candlestickChart) {
          console.warn("DrawingToolDebug: Candlestick chart not found")
          return
        }

        // Get the chart's dimensions
        const rect = candlestickChart.getBoundingClientRect()

        // Create synthetic mouse events
        const mouseDownEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 3,
          clientY: rect.top + rect.height / 3,
        })

        const mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + (rect.width * 2) / 3,
          clientY: rect.top + (rect.height * 2) / 3,
        })

        // Dispatch the events
        console.log("DrawingToolDebug: Dispatching mousedown event")
        candlestickChart.dispatchEvent(mouseDownEvent)

        // Wait a bit before dispatching mouseup
        setTimeout(() => {
          console.log("DrawingToolDebug: Dispatching mouseup event")
          candlestickChart.dispatchEvent(mouseUpEvent)
        }, 500)
      }
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 bg-white p-2 border rounded shadow-md z-50 max-w-xs">
      <div className="font-bold mb-2">Drawing Tool Debug</div>
      <div className="mb-2">
        Current Tool: <span className="font-mono">{selectedTool}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className={`px-2 py-1 border rounded ${selectedTool === "cursor" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => handleToolSelect("cursor")}
        >
          Cursor
        </button>
        <button
          className={`px-2 py-1 border rounded ${selectedTool === "line" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => handleToolSelect("line")}
        >
          Line
        </button>
        <button
          className={`px-2 py-1 border rounded ${selectedTool === "circle" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => handleToolSelect("circle")}
        >
          Circle
        </button>
        <button
          className={`px-2 py-1 border rounded ${selectedTool === "rectangle" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => handleToolSelect("rectangle")}
        >
          Rectangle
        </button>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          className="px-2 py-1 border rounded bg-green-500 text-white"
          onClick={() => (window as any).testCircleTool()}
        >
          Test Circle
        </button>
        <button className="px-2 py-1 border rounded bg-gray-200" onClick={() => (window as any).logEventBusState()}>
          Log State
        </button>
      </div>
      <div className="text-xs text-gray-700 mb-2 font-bold">Event Log:</div>
      <div className="text-xs text-gray-600 max-h-32 overflow-y-auto border p-1">
        {eventLog.length > 0 ? (
          eventLog.map((log, i) => (
            <div key={i} className="mb-1">
              {log}
            </div>
          ))
        ) : (
          <div>No events yet</div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Use <code>window.testCircleTool()</code> in console to test
      </div>
    </div>
  )
}

