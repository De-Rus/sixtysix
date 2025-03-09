"use client"

import { useState, useCallback } from "react"
import type { PlotMouseEvent } from "plotly.js"

export interface Line {
  start: { x: string; y: number }
  end: { x: string; y: number } | null
  active: boolean
  id: string
}

export interface Measurement {
  start: { x: string; y: number }
  end: { x: string; y: number } | null
}

/**
 * Hook to manage drawing tools
 */
export function useDrawingTools() {
  const [selectedTool, setSelectedTool] = useState<string>("cursor")
  const [lines, setLines] = useState<Line[]>([])
  const [activeLine, setActiveLine] = useState<Line | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Start drawing a line
  const startLine = useCallback((event: PlotMouseEvent) => {
    if (!event.points || event.points.length === 0) return

    const point = event.points[0]
    if (!point || !point.x || typeof point.y === "undefined") {
      console.error("Invalid point data:", point)
      return
    }

    console.log("Starting line at:", point.x, point.y)

    const newLine: Line = {
      id: `line-${Date.now()}`,
      start: { x: point.x as string, y: point.y as number },
      end: null,
      active: true,
    }

    console.log("Created new line:", newLine)
    setLines((prev) => [...prev, newLine])
    setActiveLine(newLine)
    setIsDrawing(true)
  }, [])

  // Update the active line as mouse moves
  const updateLine = useCallback(
    (event: PlotMouseEvent) => {
      if (!isDrawing || !activeLine) {
        console.log("Not updating line - not drawing or no active line")
        return
      }

      if (!event.points || event.points.length === 0) {
        console.log("No points in event")
        return
      }

      const point = event.points[0]
      if (!point || !point.x || typeof point.y === "undefined") {
        console.error("Invalid point data for update:", point)
        return
      }

      console.log("Moving line to:", point.x, point.y)

      const updatedLine = {
        ...activeLine,
        end: { x: point.x as string, y: point.y as number },
      }

      setActiveLine(updatedLine)

      // Also update the line in the lines array
      setLines((prev) => prev.map((line) => (line.id === activeLine.id ? updatedLine : line)))

      console.log("Updated active line:", updatedLine)
    },
    [activeLine, isDrawing],
  )

  // Complete the line
  const completeLine = useCallback(() => {
    if (!isDrawing || !activeLine || !activeLine.end) return

    console.log("Completing line")

    setLines((prev) => prev.map((line) => (line.id === activeLine.id ? { ...line, active: false } : line)))
    setActiveLine(null)
    setIsDrawing(false)
  }, [activeLine, isDrawing])

  // Cancel line drawing
  const cancelLine = useCallback(() => {
    if (!isDrawing || !activeLine) return

    console.log("Canceling line")

    setLines((prev) => prev.filter((line) => line.id !== activeLine.id))
    setActiveLine(null)
    setIsDrawing(false)
  }, [activeLine, isDrawing])

  return {
    selectedTool,
    setSelectedTool,
    lines,
    setLines,
    activeLine,
    isDrawing,
    startLine,
    updateLine,
    completeLine,
    cancelLine,
  }
}

