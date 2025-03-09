"use client"

import type React from "react"

import { useEffect } from "react"
import type { SimpleShape } from "@/types/drawing-types"
import { generateShapesForPlotly } from "@/utils/drawing/shape-generation"

interface KeyboardShortcutsProps {
  drawingStateRef: React.MutableRefObject<{
    isDrawing: boolean
    startPoint: any
    currentPoint: any
  }>
  setIsDrawing: (isDrawing: boolean) => void
  setStartPoint: (point: any) => void
  setEndPoint: (point: any) => void
  shapes: SimpleShape[]
}

export function useKeyboardShortcuts({
  drawingStateRef,
  setIsDrawing,
  setStartPoint,
  setEndPoint,
  shapes,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawingStateRef.current.isDrawing) {
        console.log("DEBUG: Canceling drawing with Escape key")

        // Reset the ref
        drawingStateRef.current.isDrawing = false
        drawingStateRef.current.startPoint = null
        drawingStateRef.current.currentPoint = null

        // Reset React state
        setIsDrawing(false)
        setStartPoint(null)
        setEndPoint(null)

        // Update the plot to remove the active shape
        const plotElement = document.getElementById("plot-container")
        if (plotElement && window.Plotly) {
          const plotShapes = generateShapesForPlotly(shapes, false, null, null, "")
          window.Plotly.relayout(plotElement, { shapes: plotShapes })
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [shapes, setIsDrawing, setStartPoint, setEndPoint, drawingStateRef])
}

