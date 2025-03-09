"use client"

import { useState, useEffect, useRef, useCallback } from "react"

/**
 * Hook to handle Y-axis dragging for multiple plots
 */
export function useYAxisDrag(selectedIndicators: string[]) {
  const [isDraggingYAxis, setIsDraggingYAxis] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [yAxisRange, setYAxisRange] = useState<[number, number] | null>(null)
  const currentDragAxisRef = useRef<string>("yaxis") // Use a ref instead of state for immediate updates
  const lastUpdateTimeRef = useRef(Date.now())
  const lastY = useRef(0)

  // Add a separate state for subplot dragging
  const [isDraggingSubplot, setIsDraggingSubplot] = useState(false)
  const [subplotDragInfo, setSubplotDragInfo] = useState<{
    axisKey: string
    startY: number
  } | null>(null)

  // Main chart drag handler
  useEffect(() => {
    if (!isDraggingYAxis) return

    // Initialize the lastY ref with the dragStartY
    lastY.current = dragStartY

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle updates to prevent flickering
      const now = Date.now()
      if (now - lastUpdateTimeRef.current < 30) {
        return
      }
      lastUpdateTimeRef.current = now

      const plotElement = document.getElementById("plot-container")
      if (!plotElement) return

      try {
        // Get the plot's bounding rectangle
        const rect = plotElement.getBoundingClientRect()
        const deltaY = e.clientY - lastY.current
        lastY.current = e.clientY

        // Calculate the relative movement
        const relativeMove = deltaY / rect.height

        // Get the current range from the element's data
        const gd = plotElement as any
        if (!gd._fullLayout || !gd._fullLayout.yaxis) return

        const currentRange = gd._fullLayout.yaxis.range
        const rangeSize = currentRange[1] - currentRange[0]

        // Calculate zoom factor
        const zoomFactor = Math.exp(relativeMove * 2)

        // Calculate new range while maintaining the center point
        const centerPrice = (currentRange[0] + currentRange[1]) / 2
        const newHalfRange = (rangeSize * zoomFactor) / 2
        const newRange = [centerPrice - newHalfRange, centerPrice + newHalfRange]

        // Update ONLY the main chart axis
        const updateObj: any = {}
        updateObj["yaxis.range"] = newRange
        updateObj["yaxis.autorange"] = false

        console.log("Updating main chart with range:", newRange)

        // Update the plot with new range
        if (window.Plotly) {
          window.Plotly.relayout(plotElement, updateObj)
            .then(() => {
              setYAxisRange(newRange)
            })
            .catch((error: any) => {
              console.error("Error updating main chart range:", error)
            })
        }
      } catch (error) {
        console.error("Error during main chart drag:", error)
      }
    }

    const handleMouseUp = () => {
      const plotElement = document.getElementById("plot-container")
      if (plotElement) {
        try {
          const gd = plotElement as any
          if (gd._fullLayout && gd._fullLayout.yaxis) {
            const finalRange = gd._fullLayout.yaxis.range
            setYAxisRange([finalRange[0], finalRange[1]])
          }
        } catch (error) {
          console.error("Error getting final range for main chart:", error)
        }
      }

      setIsDraggingYAxis(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingYAxis, dragStartY])

  // Subplot drag handler - completely separate from main chart
  useEffect(() => {
    if (!isDraggingSubplot || !subplotDragInfo) return

    const { axisKey, startY } = subplotDragInfo
    let lastDragY = startY

    const handleSubplotMouseMove = (e: MouseEvent) => {
      // Throttle updates
      const now = Date.now()
      if (now - lastUpdateTimeRef.current < 30) return
      lastUpdateTimeRef.current = now

      const plotElement = document.getElementById("plot-container")
      if (!plotElement) return

      try {
        // Get the plot's bounding rectangle
        const rect = plotElement.getBoundingClientRect()
        const deltaY = e.clientY - lastDragY
        lastDragY = e.clientY

        // Calculate the relative movement
        const relativeMove = deltaY / rect.height

        // Get the current range from the element's data
        const gd = plotElement as any
        if (!gd._fullLayout || !gd._fullLayout[axisKey]) {
          console.error(`Subplot axis ${axisKey} not found in layout`)
          return
        }

        const currentRange = gd._fullLayout[axisKey].range
        const rangeSize = currentRange[1] - currentRange[0]

        // Calculate zoom factor
        const zoomFactor = Math.exp(relativeMove * 2)

        // Calculate new range while maintaining the center point
        const centerPrice = (currentRange[0] + currentRange[1]) / 2
        const newHalfRange = (rangeSize * zoomFactor) / 2
        const newRange = [centerPrice - newHalfRange, centerPrice + newHalfRange]

        // Update ONLY the specific subplot axis
        const updateObj: any = {}
        updateObj[`${axisKey}.range`] = newRange
        updateObj[`${axisKey}.autorange`] = false

        console.log(`Updating subplot ${axisKey} with range:`, newRange)

        // Update the plot with new range
        if (window.Plotly) {
          window.Plotly.relayout(plotElement, updateObj).catch((error: any) => {
            console.error(`Error updating subplot ${axisKey} range:`, error)
          })
        }
      } catch (error) {
        console.error(`Error during subplot ${axisKey} drag:`, error)
      }
    }

    const handleSubplotMouseUp = () => {
      setIsDraggingSubplot(false)
      setSubplotDragInfo(null)
    }

    document.addEventListener("mousemove", handleSubplotMouseMove)
    document.addEventListener("mouseup", handleSubplotMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleSubplotMouseMove)
      document.removeEventListener("mouseup", handleSubplotMouseUp)
    }
  }, [isDraggingSubplot, subplotDragInfo])

  // Function to start dragging a subplot
  const startSubplotDrag = useCallback((axisKey: string, startY: number) => {
    console.log(`Starting subplot drag for ${axisKey} at Y=${startY}`)
    setIsDraggingSubplot(true)
    setSubplotDragInfo({ axisKey, startY })
  }, [])

  return {
    // Main chart drag
    isDraggingYAxis,
    setIsDraggingYAxis,
    dragStartY,
    setDragStartY,
    yAxisRange,
    setYAxisRange,

    // Subplot drag
    isDraggingSubplot,
    startSubplotDrag,
  }
}

