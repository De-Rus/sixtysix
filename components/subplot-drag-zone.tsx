"use client"

import { useState, useEffect, useRef } from "react"

interface SubplotDragZoneProps {
  axisKey?: string
  top: string | number
  height: string | number
  zIndex?: number
  className?: string
  label?: string
}

/**
 * Drag zone specifically for subplot axes (yaxis2, yaxis3, etc.)
 */
export function SubplotDragZone({
  axisKey = "yaxis",
  top,
  height,
  zIndex = 30,
  className = "",
  label,
}: SubplotDragZoneProps) {
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
          console.error(`[MAIN CHART] Axis ${axisKey} not found in layout during drag`)
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

        // Update ONLY the main chart axis
        const updateObj: any = {}
        updateObj[`${axisKey}.range`] = newRange
        updateObj[`${axisKey}.autorange`] = false

        console.log(`[MAIN CHART] Updating range:`, newRange)

        // Update the plot with new range
        if (window.Plotly) {
          window.Plotly.relayout(plotElement, updateObj)
            .then(() => {
              console.log(`[MAIN CHART] Update successful`)
            })
            .catch((error: any) => {
              console.error(`[MAIN CHART] Error updating range:`, error)
            })
        }
      } catch (error) {
        console.error(`[MAIN CHART] Error during drag:`, error)
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

  return (
    <div
      className={`absolute right-0 w-[40px] transition-colors cursor-ns-resize border-l border-border
        flex items-center justify-center ${className} ${isDragging ? "bg-blue-500/20" : isHovering ? "bg-blue-100/10" : "bg-background"}`}
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
        console.log(`[MAIN CHART] Drag started`)
        setIsDragging(true)
        lastYRef.current = e.clientY
      }}
    >
      <div className={`h-6 w-1 ${isDragging ? "bg-blue-500" : "bg-blue-500/20"} rounded-full`} />
      <div className="absolute left-2 text-xs text-purple-300">{label || `Y${axisKey.replace("yaxis", "")}`}</div>
    </div>
  )
}

