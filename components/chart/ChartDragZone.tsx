"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"

interface ChartDragZoneProps {
  axisKey: string
  top?: string
  height: string
  zIndex?: number
  label?: string
  color?: string
  className?: string
}

export function ChartDragZone({
  axisKey,
  top = "0",
  height,
  zIndex = 10,
  label = "",
  color = "rgba(0, 0, 0, 0.05)",
  className = "",
}: ChartDragZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragZoneRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startRangeRef = useRef<[number, number] | null>(null)

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation() // Prevent event from bubbling to parent elements

      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) return

      try {
        const gd = plotElement as any
        if (!gd._fullLayout) return

        const axis = gd._fullLayout[axisKey]
        if (!axis) {
          console.error(`Axis ${axisKey} not found in layout`)
          return
        }

        // Store the starting position and range
        startYRef.current = e.clientY
        startRangeRef.current = [...axis.range]

        setIsDragging(true)

        // Change cursor style
        if (dragZoneRef.current) {
          dragZoneRef.current.style.cursor = "grabbing"
        }

        console.log(`Started dragging ${axisKey} at y=${e.clientY} with range:`, startRangeRef.current)
      } catch (error) {
        console.error(`Error starting drag for ${axisKey}:`, error)
      }
    },
    [axisKey],
  )

  // Handle mouse move during dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !startRangeRef.current) return

      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) return

      try {
        // Calculate the drag distance in pixels
        const deltaY = e.clientY - startYRef.current

        // Get the element dimensions
        const rect = dragZoneRef.current?.getBoundingClientRect() || plotElement.getBoundingClientRect()

        // Convert pixel distance to data units
        const rangeSize = startRangeRef.current[1] - startRangeRef.current[0]
        const pixelToDataRatio = rangeSize / rect.height

        // Calculate the data change (invert for y-axis since pixel coordinates increase downward)
        const dataChange = deltaY * pixelToDataRatio

        // Calculate new range
        const newRange: [number, number] = [
          startRangeRef.current[0] + dataChange,
          startRangeRef.current[1] + dataChange,
        ]

        // Update the axis
        const update: any = {}
        update[`${axisKey}.range`] = newRange

        console.log(`Updating ${axisKey} range to:`, newRange)

        window.Plotly.relayout(plotElement, update).catch((error) =>
          console.error(`Error updating ${axisKey} range:`, error),
        )
      } catch (error) {
        console.error(`Error during drag for ${axisKey}:`, error)
      }
    },
    [isDragging, axisKey],
  )

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      console.log(`Ended dragging ${axisKey}`)
      setIsDragging(false)
      startRangeRef.current = null

      // Reset cursor style
      if (dragZoneRef.current) {
        dragZoneRef.current.style.cursor = "ns-resize"
      }
    }
  }, [isDragging, axisKey])

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      // Also handle mouse leave as mouse up
      document.addEventListener("mouseleave", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseleave", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={dragZoneRef}
      className={`absolute right-0 cursor-ns-resize ${className}`}
      style={{
        top,
        height,
        width: "40px",
        backgroundColor: isDragging ? "rgba(0, 0, 255, 0.1)" : color,
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        color: "rgba(0, 0, 0, 0.5)",
        userSelect: "none",
        borderLeft: "1px solid rgba(0, 0, 0, 0.1)",
      }}
      onMouseDown={handleMouseDown}
    >
      {label && <div className="text-xs">{label}</div>}
      <div className="h-6 w-1 bg-gray-300 rounded-full opacity-50"></div>
    </div>
  )
}

