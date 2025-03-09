"use client"

import { useEffect } from "react"
import type { SimpleShape } from "@/utils/chart-drawing"

export function useDirectMouseEvents({
  isDrawing,
  startPoint,
  shapes,
  selectedTool,
  updateDrawing,
}: {
  isDrawing: boolean
  startPoint: { x: string; y: number } | null
  shapes: SimpleShape[]
  selectedTool: string
  updateDrawing: (point: { x: string; y: number }) => void
}) {
  useEffect(() => {
    // Only add event listener if we're drawing
    if (!isDrawing || !startPoint) {
      console.log(
        "DEBUG: Not setting up direct mouse events - isDrawing:",
        isDrawing,
        "startPoint:",
        startPoint ? "exists" : "null",
      )
      return
    }

    console.log("DEBUG: Setting up direct mouse events for drawing with startPoint:", startPoint)

    const handleDirectMouseMove = (e: MouseEvent) => {
      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) {
        console.log("DEBUG: Plot element or Plotly not available for direct mouse move")
        return
      }

      try {
        const rect = plotElement.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        console.log("DEBUG: Direct mouse move at pixel coordinates:", x, y)

        // Get the layout
        const gd = plotElement as any
        if (!gd._fullLayout) {
          console.log("DEBUG: Layout not available for direct mouse move")
          return
        }

        const xaxis = gd._fullLayout.xaxis
        const yaxis = gd._fullLayout.yaxis

        if (!xaxis || !yaxis) {
          console.log("DEBUG: Axes not available for direct mouse move")
          return
        }

        // Convert pixel to data coordinates
        const dataX = xaxis.p2d(x)
        const dataY = yaxis.p2d(y)

        console.log("DEBUG: Converted to data coordinates:", dataX, dataY)

        // Create the current point
        const currentPoint = { x: dataX, y: dataY }

        // Update the end point
        updateDrawing(currentPoint)

        // Update the plot directly
        const plotShapes = []

        // Add existing shapes
        for (const shape of shapes) {
          if (shape.type === "line") {
            plotShapes.push({
              type: "line",
              x0: shape.x0,
              y0: shape.y0,
              x1: shape.x1,
              y1: shape.y1,
              line: { color: shape.color, width: shape.width },
            })
          } else if (shape.type === "rect") {
            plotShapes.push({
              type: "rect",
              x0: shape.x0,
              y0: shape.y0,
              x1: shape.x1,
              y1: shape.y1,
              line: { color: shape.color, width: shape.width },
              fillcolor: shape.fillcolor || "rgba(0, 0, 255, 0.1)",
              opacity: shape.opacity || 0.2,
            })
          }
        }

        // Add the active shape
        if (selectedTool === "line") {
          plotShapes.push({
            type: "line",
            x0: startPoint.x,
            y0: startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
          })
        } else if (selectedTool === "rectangle") {
          plotShapes.push({
            type: "rect",
            x0: startPoint.x,
            y0: startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
            fillcolor: "rgba(255, 0, 0, 0.1)",
            opacity: 0.2,
          })
        }

        console.log("DEBUG: Updating plot with shapes during mouse move")
        // Update the plot
        window.Plotly.relayout(plotElement, { shapes: plotShapes })
      } catch (error) {
        console.error("DEBUG: Error in direct mouse move handler:", error)
      }
    }

    // Add the event listener to document for better coverage
    document.addEventListener("mousemove", handleDirectMouseMove)

    return () => {
      console.log("DEBUG: Removing direct mouse move event listener")
      document.removeEventListener("mousemove", handleDirectMouseMove)
    }
  }, [isDrawing, startPoint, shapes, selectedTool, updateDrawing])
}

