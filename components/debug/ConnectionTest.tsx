"use client"

import { useEffect, useState } from "react"
import eventBus from "@/utils/event-bus"
import type { DrawingTool } from "@/types/drawing-types"

export function ConnectionTest() {
  const [selectedTool, setSelectedTool] = useState<DrawingTool | null>(null)
  const [connectionStatus, setConnectionStatus] = useState("Initializing...")

  useEffect(() => {
    setConnectionStatus("Setting up event subscription...")

    // Subscribe to tool selection events
    const unsubscribe = eventBus.subscribe("toolSelected", (tool: DrawingTool) => {
      console.log(`ConnectionTest: Received tool selection event: ${tool}`)
      setSelectedTool(tool)
      setConnectionStatus(`Connected! Last event received at ${new Date().toLocaleTimeString()}`)
    })

    // Initialize with the last selected tool if available
    const lastTool = eventBus.getLastToolSelected()
    if (lastTool) {
      console.log(`ConnectionTest: Initializing with last tool: ${lastTool}`)
      setSelectedTool(lastTool)
      setConnectionStatus(`Connected! Initialized with last tool at ${new Date().toLocaleTimeString()}`)
    } else {
      setConnectionStatus("Connected! Waiting for events...")
    }

    return unsubscribe
  }, [])

  const testConnection = () => {
    const testTool: DrawingTool = "line"
    console.log(`ConnectionTest: Testing connection with tool: ${testTool}`)
    eventBus.emit("toolSelected", testTool)
    setConnectionStatus(`Test sent at ${new Date().toLocaleTimeString()}`)
  }

  const testCircleTool = () => {
    const testTool: DrawingTool = "circle"
    console.log(`ConnectionTest: Testing circle tool: ${testTool}`)
    eventBus.emit("toolSelected", testTool)
    setConnectionStatus(`Circle tool test sent at ${new Date().toLocaleTimeString()}`)
  }

  const testRectangleTool = () => {
    const testTool: DrawingTool = "rectangle"
    console.log(`ConnectionTest: Testing rectangle tool: ${testTool}`)
    eventBus.emit("toolSelected", testTool)
    setConnectionStatus(`Rectangle tool test sent at ${new Date().toLocaleTimeString()}`)
  }

  const testPencilTool = () => {
    const testTool: DrawingTool = "pencil"
    console.log(`ConnectionTest: Testing pencil tool: ${testTool}`)
    eventBus.emit("toolSelected", testTool)
    setConnectionStatus(`Pencil tool test sent at ${new Date().toLocaleTimeString()}`)
  }

  const testEraserTool = () => {
    const testTool: DrawingTool = "eraser"
    console.log(`ConnectionTest: Testing eraser tool: ${testTool}`)
    eventBus.emit("toolSelected", testTool)
    setConnectionStatus(`Eraser tool test sent at ${new Date().toLocaleTimeString()}`)
  }

  return (
    <div className="p-4 border rounded-md bg-muted/20">
      <h3 className="text-sm font-medium mb-2">Event Bus Connection Test</h3>
      <div className="text-xs mb-2">Status: {connectionStatus}</div>
      <div className="text-xs mb-2">Selected Tool: {selectedTool || "None"}</div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={testConnection} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Test Connection
        </button>
        <button onClick={testCircleTool} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Test Circle Tool
        </button>
        <button onClick={testRectangleTool} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Test Rectangle Tool
        </button>
        <button onClick={testPencilTool} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Test Pencil Tool
        </button>
        <button onClick={testEraserTool} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
          Test Eraser Tool
        </button>
      </div>
    </div>
  )
}

