"use client"

import { useCallback, useState } from "react"

// Shape interfaces
export interface SimpleLine {
  type: "line"
  x0: string
  y0: number
  x1: string
  y1: number
  color: string
  width: number
}

export interface SimpleRectangle {
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

export type SimpleShape = SimpleLine | SimpleRectangle

// Function to extract point from Plotly event
export function extractPointFromEvent(event: any) {
  if (!event) {
    console.log("DEBUG: extractPointFromEvent - No event provided")
    return null
  }

  try {
    // First, try to get points from the event
    if (event.points && event.points.length > 0) {
      const point = event.points[0]
      console.log("DEBUG: extractPointFromEvent - Found points in event:", {
        pointX: point.x,
        pointY: point.y,
        hasXaxis: !!point.xaxis,
        hasYaxis: !!point.yaxis,
      })

      // Make sure we have valid x and y values
      if (!point || point.x === undefined || point.y === undefined) {
        console.error("DEBUG: extractPointFromEvent - Invalid point data in event:", point)
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
          console.log("DEBUG: extractPointFromEvent - Converted y pixel to data:", {
            originalY: point.y,
            convertedY: y,
            offsetY: event.event.offsetY,
          })
        } catch (e) {
          console.warn("DEBUG: extractPointFromEvent - Could not convert y pixel to data:", e)
        }
      }

      return { x, y }
    }

    // If no points, try to extract from the raw event
    if (event.event && event.xaxis && event.yaxis) {
      console.log("DEBUG: extractPointFromEvent - Using raw event with axes")
      const xaxis = event.xaxis
      const yaxis = event.yaxis
      const eventData = event.event

      // Convert pixel coordinates to data coordinates
      const x = xaxis.p2d(eventData.offsetX)
      const y = yaxis.p2d(eventData.offsetY)

      console.log("DEBUG: extractPointFromEvent - Converted from raw event:", {
        offsetX: eventData.offsetX,
        offsetY: eventData.offsetY,
        dataX: x,
        dataY: y,
      })

      return { x, y }
    }

    // If we have a plotly_hover event with a direct xval and yval
    if (event.xval !== undefined && event.yval !== undefined) {
      console.log("DEBUG: extractPointFromEvent - Using direct xval/yval from event:", {
        xval: event.xval,
        yval: event.yval,
      })
      return { x: event.xval, y: event.yval }
    }

    console.log("DEBUG: extractPointFromEvent - Could not extract point from event:", {
      hasPoints: !!event.points,
      hasEvent: !!event.event,
      hasXaxis: !!event.xaxis,
      hasYaxis: !!event.yaxis,
      hasXval: event.xval !== undefined,
      hasYval: event.yval !== undefined,
    })
    return null
  } catch (error) {
    console.error("DEBUG: Error extracting point from event:", error)
    return null
  }
}

// Function to generate Plotly shapes from our shape objects
export function generateShapesForPlotly(
  shapes: SimpleShape[],
  isDrawing: boolean,
  startPoint: { x: string; y: number } | null,
  endPoint: { x: string; y: number } | null,
  selectedTool: string,
) {
  console.log("DEBUG: generateShapesForPlotly called with:", {
    shapesCount: shapes.length,
    isDrawing,
    startPoint,
    endPoint,
    selectedTool,
  })

  // Convert existing shapes to Plotly format
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

  console.log("DEBUG: Converted existing shapes:", plotShapes)

  // Add active shape if drawing
  if (isDrawing && startPoint && endPoint) {
    console.log("DEBUG: Adding active shape for drawing")
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

  console.log("DEBUG: Final shapes for Plotly:", plotShapes)
  return plotShapes
}

// Hook for managing drawing state
export function useDrawingTools() {
  const [selectedTool, setSelectedTool] = useState<string>("cursor")
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: string; y: number } | null>(null)
  const [endPoint, setEndPoint] = useState<{ x: string; y: number } | null>(null)
  const [shapes, setShapes] = useState<SimpleShape[]>([])
  const [currentMousePosition, setCurrentMousePosition] = useState<{ x: string; y: number } | null>(null)

  // Reset drawing state
  const resetDrawing = useCallback(() => {
    console.log("DEBUG: Resetting drawing state")
    setIsDrawing(false)
    setStartPoint(null)
    setEndPoint(null)
  }, [])

  // Start drawing
  const startDrawing = useCallback((point: { x: string; y: number }) => {
    console.log("DEBUG: Starting drawing at:", point)

    // Set all states in one go
    setIsDrawing(true)
    setStartPoint(point)
    setEndPoint(point)

    // Log the state immediately after setting
    console.log("DEBUG: Drawing state after startDrawing:", {
      isDrawingNow: true,
      startPointSet: !!point,
      endPointSet: !!point,
    })

    // Force a state update by using a timeout
    setTimeout(() => {
      console.log("DEBUG: Checking drawing state after timeout:", {
        isDrawing: true,
        startPoint: point,
      })
    }, 0)
  }, [])

  // Update drawing
  const updateDrawing = useCallback(
    (point: { x: string; y: number }) => {
      if (!isDrawing) return // Skip if not drawing
      console.log("DEBUG: Updating drawing to:", point)
      setEndPoint(point)
    },
    [isDrawing],
  )

  // Complete drawing
  const completeDrawing = useCallback(
    (point: { x: string; y: number }) => {
      console.log("DEBUG: Completing drawing at:", point)
      if (!startPoint) {
        console.error("DEBUG: Cannot complete drawing: no start point")
        return
      }

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
        console.log("DEBUG: Adding new line:", newLine)
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
        console.log("DEBUG: Adding new rectangle:", newRect)
        setShapes((prev) => [...prev, newRect])
      }

      // Reset drawing state
      resetDrawing()
    },
    [selectedTool, startPoint, resetDrawing],
  )

  // Add horizontal line
  const addHorizontalLine = useCallback((point: { x: string; y: number }, xRange: [string, string]) => {
    console.log("DEBUG: Adding horizontal line at:", point.y)
    const newLine: SimpleLine = {
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
    selectedTool,
    setSelectedTool,
    isDrawing,
    setIsDrawing, // Make sure we're exporting this
    startPoint,
    setStartPoint, // Make sure we're exporting this
    endPoint,
    setEndPoint, // Make sure we're exporting this
    shapes,
    setShapes,
    currentMousePosition,
    setCurrentMousePosition,
    resetDrawing,
    startDrawing,
    updateDrawing,
    completeDrawing,
    addHorizontalLine,
  }
}

