"use client"

import { useEffect, useRef } from "react"
import { generateShapesForPlotly } from "@/utils/chart-drawing"

interface DirectDrawingHandlerProps {
  isDrawing: boolean
  startPoint: { x: string; y: number } | null
  shapes: any[]
  selectedTool: string
  onUpdate: (point: { x: string; y: number }) => void
}

/**
 * A component that directly handles drawing without relying on hooks
 * This is a more direct approach that should be more reliable
 */
export function DirectDrawingHandler({
  isDrawing,
  startPoint,
  shapes,
  selectedTool,
  onUpdate,
}: DirectDrawingHandlerProps) {
  const isActive = useRef(false)

  // Set up the handler when drawing starts
  useEffect(() => {
    if (!isDrawing || !startPoint) {
      console.log("DEBUG: DirectDrawingHandler - Not active")
      isActive.current = false
      return
    }

    console.log("DEBUG: DirectDrawingHandler - Activating with startPoint:", startPoint)
    isActive.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive.current) return

      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) return

      try {
        const rect = plotElement.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Get the layout
        const gd = plotElement as any
        if (!gd._fullLayout) return

        const xaxis = gd._fullLayout.xaxis
        const yaxis = gd._fullLayout.yaxis

        if (!xaxis || !yaxis) return

        // Convert pixel to data coordinates
        const dataX = xaxis.p2d(x)
        const dataY = yaxis.p2d(y)

        console.log("DEBUG: DirectDrawingHandler - Mouse move at:", dataX, dataY)

        // Create the current point
        const currentPoint = { x: dataX, y: dataY }

        // Update via callback
        onUpdate(currentPoint)

        // Generate shape for the active drawing
        let activeShape
        if (selectedTool === "line") {
          activeShape = {
            type: "line",
            x0: startPoint.x,
            y0: startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
          }
        } else if (selectedTool === "rectangle") {
          activeShape = {
            type: "rect",
            x0: startPoint.x,
            y0: startPoint.y,
            x1: dataX,
            y1: dataY,
            line: { color: "rgb(255, 0, 0)", width: 2 },
            fillcolor: "rgba(255, 0, 0, 0.1)",
            opacity: 0.2,
          }
        }

        if (activeShape) {
          // Update the plot directly with all shapes plus the active one
          const plotShapes = [...generateShapesForPlotly(shapes, false, null, null, ""), activeShape]

          window.Plotly.relayout(plotElement, { shapes: plotShapes })
        }
      } catch (error) {
        console.error("DEBUG: DirectDrawingHandler - Error:", error)
      }
    }

    // Add the event listener
    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      console.log("DEBUG: DirectDrawingHandler - Deactivating")
      isActive.current = false
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isDrawing, startPoint, shapes, selectedTool, onUpdate])

  return null // This component doesn't render anything
}

