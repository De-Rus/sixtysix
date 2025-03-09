"use client"

import { useCallback, useRef, useState } from "react"
import type { DrawingTool, Point, SimpleShape } from "@/types/drawing-types"
import { createShape } from "@/utils/drawing/shape-generation"

export interface DrawingStateRef {
  isDrawing: boolean
  startPoint: Point | null
  currentPoint: Point | null
}

export function useDrawingState() {
  // React state for drawing
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("cursor")
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
  const [shapes, setShapes] = useState<SimpleShape[]>([])
  const [currentMousePosition, setCurrentMousePosition] = useState<Point | null>(null)

  // Ref for direct access to drawing state (avoids closure issues)
  const drawingStateRef = useRef<DrawingStateRef>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
  })

  // Reset drawing state
  const resetDrawing = useCallback(() => {
    console.log("DEBUG: Resetting drawing state")

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
    console.log("DEBUG: Starting drawing at:", point)

    // Update ref state (synchronous)
    drawingStateRef.current.isDrawing = true
    drawingStateRef.current.startPoint = point
    drawingStateRef.current.currentPoint = point

    // Update React state (asynchronous)
    setIsDrawing(true)
    setStartPoint(point)
    setEndPoint(point)

    console.log("DEBUG: Drawing state after startDrawing:", {
      isDrawingRef: drawingStateRef.current.isDrawing,
      startPointRef: drawingStateRef.current.startPoint,
    })
  }, [])

  // Update drawing
  const updateDrawing = useCallback((point: Point) => {
    if (!drawingStateRef.current.isDrawing) return

    console.log("DEBUG: Updating drawing to:", point)

    // Update ref state (synchronous)
    drawingStateRef.current.currentPoint = point

    // Update React state (asynchronous)
    setEndPoint(point)
  }, [])

  // Complete drawing
  const completeDrawing = useCallback(
    (point: Point) => {
      console.log("DEBUG: Completing drawing at:", point)

      const startPointRef = drawingStateRef.current.startPoint
      if (!startPointRef) {
        console.error("DEBUG: Cannot complete drawing: no start point")
        return
      }

      // Create the shape
      const newShape = createShape(selectedTool, startPointRef, point)

      if (newShape) {
        console.log("DEBUG: Creating new shape:", newShape)

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
    console.log("DEBUG: Adding horizontal line at:", point.y)

    const newLine: SimpleShape = {
      type: "line",
      x0: xRange[0],
      y0: point.y,
      x1: xRange[1],
      y1: point.y,
      color: "rgb(0, 0, 255)",
      width: 2,
    }

    setShapes((prev) => [...prev, newLine])
  }, [])

  return {
    // State
    selectedTool,
    isDrawing,
    startPoint,
    endPoint,
    shapes,
    currentMousePosition,

    // Refs
    drawingStateRef,

    // Setters
    setSelectedTool,
    setIsDrawing,
    setStartPoint,
    setEndPoint,
    setShapes,
    setCurrentMousePosition,

    // Actions
    resetDrawing,
    startDrawing,
    updateDrawing,
    completeDrawing,
    addHorizontalLine,
  }
}

