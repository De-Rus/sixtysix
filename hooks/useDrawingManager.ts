"use client"

import { useState, useCallback, useRef } from "react"
import type { DrawingTool, Point, SimpleShape } from "@/types/drawing-types"
import { createShape, createHorizontalLine } from "@/utils/drawing/shape-generation"
import { extractPointFromEvent } from "@/utils/drawing/point-extraction"
import { generateShapesForPlotly } from "@/utils/drawing/shape-generation"

export function useDrawingManager() {
  // Drawing state
  const [shapes, setShapes] = useState<SimpleShape[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("cursor")

  // Ref for direct access to drawing state (avoids closure issues)
  const drawingStateRef = useRef({
    isDrawing: false,
    startPoint: null as Point | null,
    currentPoint: null as Point | null,
  })

  // Reset drawing state
  const resetDrawing = useCallback(() => {
    // Reset ref state (synchronous)
    drawingStateRef.current.isDrawing = false
    drawingStateRef.current.startPoint = null
    drawingStateRef.current.currentPoint = null

    // Reset React state (asynchronous)
    setIsDrawing(false)
    setStartPoint(null)
    setEndPoint(null)
  }, [])

  // Start drawing
  const startDrawing = useCallback((point: Point) => {
    // Update ref state (synchronous)
    drawingStateRef.current.isDrawing = true
    drawingStateRef.current.startPoint = point
    drawingStateRef.current.currentPoint = point

    // Update React state (asynchronous)
    setIsDrawing(true)
    setStartPoint(point)
    setEndPoint(point)
  }, [])

  // Update drawing
  const updateDrawing = useCallback((point: Point) => {
    if (!drawingStateRef.current.isDrawing) return

    // Update ref state (synchronous)
    drawingStateRef.current.currentPoint = point

    // Update React state (asynchronous)
    setEndPoint(point)
  }, [])

  // Complete drawing
  const completeDrawing = useCallback(
    (point: Point) => {
      const startPointRef = drawingStateRef.current.startPoint
      if (!startPointRef) return

      // Create the shape
      const newShape = createShape(selectedTool, startPointRef, point)

      if (newShape) {
        // Add the shape
        setShapes((prev) => [...prev, newShape])

        // Reset drawing state
        resetDrawing()
      }
    },
    [selectedTool, resetDrawing],
  )

  // Add horizontal line
  const addHorizontalLine = useCallback((point: Point, xRange: [string | number, string | number]) => {
    const newLine = createHorizontalLine(point.y, xRange)
    setShapes((prev) => [...prev, newLine])
  }, [])

  // Handle click event
  const handleClick = useCallback(
    (event: any) => {
      if (selectedTool === "cursor") return

      const point = extractPointFromEvent(event)
      if (!point) return

      if (selectedTool === "horizontal") {
        // For horizontal line, we need the x-axis range
        const plotElement = document.getElementById("plot-container")
        if (!plotElement || !window.Plotly) return

        try {
          const gd = plotElement as any
          if (!gd._fullLayout || !gd._fullLayout.xaxis) return

          const xRange = gd._fullLayout.xaxis.range
          addHorizontalLine(point, xRange)
        } catch (error) {
          console.error("Error creating horizontal line:", error)
        }
      } else if (!isDrawing) {
        // First click - start drawing
        startDrawing(point)
      } else {
        // Second click - complete drawing
        completeDrawing(point)
      }
    },
    [selectedTool, isDrawing, startDrawing, completeDrawing, addHorizontalLine],
  )

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (event: any) => {
      if (selectedTool === "cursor" || !isDrawing) return

      const point = extractPointFromEvent(event)
      if (!point) return

      updateDrawing(point)

      // Update the plot immediately
      const plotElement = document.getElementById("plot-container")
      if (plotElement && window.Plotly && startPoint) {
        try {
          const plotShapes = generateShapesForPlotly(shapes, true, startPoint, point, selectedTool)

          window.Plotly.relayout(plotElement, { shapes: plotShapes })
        } catch (error) {
          console.error("Error updating shape during mouse move:", error)
        }
      }
    },
    [selectedTool, isDrawing, shapes, startPoint, updateDrawing],
  )

  // Handle right click event
  const handleRightClick = useCallback(
    (event: any) => {
      event.preventDefault()

      if (isDrawing) {
        resetDrawing()

        // Update the plot
        const plotElement = document.getElementById("plot-container")
        if (plotElement && window.Plotly) {
          const plotShapes = generateShapesForPlotly(shapes, false, null, null, "")
          window.Plotly.relayout(plotElement, { shapes: plotShapes })
        }
      }
    },
    [isDrawing, shapes, resetDrawing],
  )

  // Get Plotly shapes
  const getPlotlyShapes = useCallback(() => {
    return generateShapesForPlotly(shapes, isDrawing, startPoint, endPoint, selectedTool)
  }, [shapes, isDrawing, startPoint, endPoint, selectedTool])

  return {
    // State
    shapes,
    setShapes,
    isDrawing,
    startPoint,
    endPoint,
    selectedTool,
    setSelectedTool,
    drawingStateRef,

    // Actions
    resetDrawing,
    startDrawing,
    updateDrawing,
    completeDrawing,
    addHorizontalLine,

    // Event handlers
    handleClick,
    handleMouseMove,
    handleRightClick,

    // Utilities
    getPlotlyShapes,
  }
}

