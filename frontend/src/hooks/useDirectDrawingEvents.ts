"use client"

import type React from "react"

import { useEffect } from "react"
import type { DrawingTool, Point, SimpleShape } from "@/types/drawing-types"
import { generateShapesForPlotly } from "@/utils/drawing/shape-generation"

interface DirectDrawingEventsProps {
  selectedTool: DrawingTool
  shapes: SimpleShape[]
  drawingStateRef: React.MutableRefObject<{
    isDrawing: boolean
    startPoint: Point | null
    currentPoint: Point | null
  }>
  setEndPoint: (point: Point | null) => void
}

export function useDirectDrawingEvents({
  selectedTool,
  shapes,
  drawingStateRef,
  setEndPoint,
}: DirectDrawingEventsProps) {
  useEffect(() => {
    // Don't set up direct mouse move handler for cursor tool
    if (selectedTool === "cursor" || !["line", "rectangle"].includes(selectedTool)) {
      console.log(
        "DEBUG: Not setting up direct mouse move handler - tool not supported or cursor selected:",
        selectedTool,
      )
      return
    }

    console.log("DEBUG: Setting up direct mouse move handler for drawing tool:", selectedTool)

    const handleDirectMouseMove = (e: MouseEvent) => {
      // Only process if we're drawing and not using cursor tool
      if (selectedTool === "cursor" || !drawingStateRef.current.isDrawing || !drawingStateRef.current.startPoint) {
        return
      }

      console.log("DEBUG: Direct mouse move while drawing", {
        clientX: e.clientX,
        clientY: e.clientY,
        startPoint: drawingStateRef.current.startPoint,
      })

      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) {
        console.log("DEBUG: Plot element or Plotly not available for mouse move")
        return
      }

      try {
        const rect = plotElement.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        console.log("DEBUG: Mouse position relative to plot:", {
          x,
          y,
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        })

        // Get the layout
        const gd = plotElement as any
        if (!gd._fullLayout) {
          console.log("DEBUG: Layout not available for mouse move")
          return
        }

        const xaxis = gd._fullLayout.xaxis
        const yaxis = gd._fullLayout.yaxis

        if (!xaxis || !yaxis) {
          console.log("DEBUG: Axes not available for mouse move")
          return
        }

        // Convert pixel to data coordinates
        const dataX = xaxis.p2d(x)
        const dataY = yaxis.p2d(y)

        console.log("DEBUG: Converted to data coordinates:", { dataX, dataY })

        // Create the current point
        const currentPoint = { x: dataX, y: dataY }

        // Update the ref
        drawingStateRef.current.currentPoint = currentPoint

        // Also update React state
        setEndPoint(currentPoint)

        // Generate the shape
        let activeShape
        if (selectedTool === "line") {
          activeShape = {
            type: "line",
            x0: drawingStateRef.current.startPoint.x,
            y0: drawingStateRef.current.startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
          }
        } else if (selectedTool === "rectangle") {
          activeShape = {
            type: "rect",
            x0: drawingStateRef.current.startPoint.x,
            y0: drawingStateRef.current.startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
            fillcolor: "rgba(255, 0, 0, 0.1)",
            opacity: 0.2,
          }
        }

        if (activeShape) {
          console.log("DEBUG: Generated active shape for mouse move:", activeShape)

          // Update the plot directly with all shapes plus the active one
          const plotShapes = [...generateShapesForPlotly(shapes, false, null, null, ""), activeShape]

          try {
            // Check if Plotly is fully initialized
            if (window.Plotly && plotElement && plotElement._fullLayout) {
              window.Plotly.relayout(plotElement, { shapes: plotShapes }).catch((err) =>
                console.error("DEBUG: Error updating shape during mouse move:", err),
              )
            } else {
              console.log("DEBUG: Plotly not fully initialized, skipping relayout")
            }
          } catch (error) {
            console.error("DEBUG: Error updating shape during mouse move:", error)
          }
        }
      } catch (error) {
        console.error("DEBUG: Error in direct mouse move handler:", error)
      }
    }

    // Add the event listener
    document.addEventListener("mousemove", handleDirectMouseMove)
    console.log("DEBUG: Added direct mouse move event listener")

    return () => {
      document.removeEventListener("mousemove", handleDirectMouseMove)
      console.log("DEBUG: Removed direct mouse move event listener")
    }
  }, [selectedTool, shapes, setEndPoint, drawingStateRef])
}

