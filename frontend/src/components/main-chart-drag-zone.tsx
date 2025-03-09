"use client"

import { useState, useEffect, useRef } from "react"

interface MainChartDragZoneProps {
  top: string | number
  height: string | number
  zIndex?: number
  className?: string
  axisKey?: string
  label?: string
}

/**
 * Drag zone specifically for the main chart (yaxis)
 */
export function MainChartDragZone({
  top,
  height,
  zIndex = 20,
  className = "",
  axisKey = "yaxis2",
  label,
}: MainChartDragZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const lastYRef = useRef(0)
  const lastUpdateTimeRef = useRef(Date.now())

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle updates to prevent flickering
      const now = Date.now()
      if (now - lastUpdateTimeRef.current < 30) return
      lastUpdateTimeRef.current = now

      const deltaY = e.clientY - lastYRef.current
      lastYRef.current = e.clientY

      const plotElement = document.getElementById("plot-container")
      if (!plotElement) return

      try {
        // Get the plot's bounding rectangle
        const rect = plotElement.getBoundingClientRect()

        // Calculate the relative movement
        const relativeMove = deltaY / rect.height

        // Get the current range from the element's data
        const gd = plotElement as any
        if (!gd._fullLayout || !gd._fullLayout[axisKey]) {
          console.error(`[SUBPLOT] Axis ${axisKey} not found in layout during drag`)
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

        // Update ONLY the subplot axis
        const updateObj: any = {}
        updateObj[`${axisKey}.range`] = newRange
        updateObj[`${axisKey}.autorange`] = false

        console.log(`[SUBPLOT ${axisKey}] Updating range:`, newRange)

        // Update the plot with new range
        if (window.Plotly) {
          window.Plotly.relayout(plotElement, updateObj)
            .then(() => {
              console.log(`[SUBPLOT ${axisKey}] Update successful`)
            })
            .catch((error: any) => {
              console.error(`[SUBPLOT ${axisKey}] Error updating range:`, error)
            })
        }
      } catch (error) {
        console.error(`[SUBPLOT ${axisKey}] Error during drag:`, error)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, axisKey])

  // Extract the axis number for display
  const axisNumber = axisKey.replace("yaxis", "")

  return (
    <div
      className={`absolute right-0 w-[40px] transition-colors cursor-ns-resize border-l border-border
        flex items-center justify-center ${className} ${isDragging ? "bg-purple-500/20" : isHovering ? "bg-purple-100/10" : "bg-background"}`}
      style={{
        top: typeof top === "number" ? `${top}px` : top,
        height: typeof height === "number" ? `${height}px` : height,
        zIndex,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log(`[SUBPLOT ${axisKey}] Drag started`)
        setIsDragging(true)
        lastYRef.current = e.clientY
      }}
    >
      <div className={`h-6 w-1 ${isDragging ? "bg-purple-500" : "bg-purple-500/20"} rounded-full`} />
      <div className="absolute left-2 text-xs text-blue-300">{label || "Main"}</div>
    </div>
  )
}

