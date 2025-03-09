"use client"

import { useState, useEffect, useRef } from "react"

interface ChartDragZoneProps {
  axisKey: string
  top: string | number
  height: string | number
  zIndex?: number
  className?: string
  label: string // Required label prop
  color?: string
}

/**
 * A simplified drag zone component that displays the exact label provided
 */
export function ChartDragZone({
  axisKey,
  top,
  height,
  zIndex = 20,
  className = "",
  label,
  color = "blue",
}: ChartDragZoneProps) {
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
          console.error(`Axis ${axisKey} not found in layout during drag`)
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

        // Update ONLY this specific axis
        const updateObj: any = {}
        updateObj[`${axisKey}.range`] = newRange
        updateObj[`${axisKey}.autorange`] = false

        // Update the plot with new range
        if (window.Plotly) {
          window.Plotly.relayout(plotElement, updateObj).catch((error: any) => {
            console.error(`Error updating range:`, error)
          })
        }
      } catch (error) {
        console.error(`Error during drag:`, error)
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

  // Determine colors based on the color prop
  const bgColor =
    color === "transparent"
      ? "bg-transparent"
      : color === "blue"
        ? isDragging
          ? "bg-blue-500/20"
          : isHovering
            ? "bg-blue-100/10"
            : "bg-background"
        : isDragging
          ? "bg-purple-500/20"
          : isHovering
            ? "bg-purple-100/10"
            : "bg-background"

  const indicatorColor =
    color === "transparent"
      ? "bg-transparent"
      : color === "blue"
        ? isDragging
          ? "bg-blue-500"
          : "bg-blue-500/20"
        : isDragging
          ? "bg-purple-500"
          : "bg-purple-500/20"

  const textColor = color === "blue" ? "text-blue-300" : "text-purple-300"

  return (
    <div
      className={`${top === "0" ? "relative" : "absolute right-0"} w-[40px] transition-colors cursor-ns-resize border-l border-border
        flex items-center justify-center ${className} ${bgColor}`}
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
        setIsDragging(true)
        lastYRef.current = e.clientY
      }}
    >
      <div className={`h-6 w-1 ${indicatorColor} rounded-full`} />
      {label && <div className={`absolute left-2 text-xs ${textColor} font-medium`}>{label}</div>}
    </div>
  )
}

