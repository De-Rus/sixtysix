"use client"

import { useState, useEffect, useRef } from "react"

interface AxisDragZoneProps {
  axisKey: string
  top: string | number
  height: string | number
  zIndex?: number
  className?: string
}

export function AxisDragZone({ axisKey, top, height, zIndex = 20, className = "" }: AxisDragZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const startYRef = useRef(0)
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

        console.log(`[${axisKey}] Updating range:`, newRange)
        console.log(`[${axisKey}] DEBUG:`)
        console.log(`- Current range:`, currentRange)
        console.log(`- New range:`, newRange)
        console.log(`- Update object:`, updateObj)

        // Update the plot with new range
        if (window.Plotly) {
          console.log(`[${axisKey}] Applying update to plot element:`, plotElement.id)
          window.Plotly.relayout(plotElement, updateObj)
            .then(() => {
              console.log(`[${axisKey}] Update successful`)

              // Verify the update was applied correctly
              const gd = plotElement as any
              if (gd._fullLayout && gd._fullLayout[axisKey]) {
                console.log(`[${axisKey}] New actual range:`, gd._fullLayout[axisKey].range)
              }
            })
            .catch((error: any) => {
              console.error(`[${axisKey}] Error updating range:`, error)
            })
        }
      } catch (error) {
        console.error(`[${axisKey}] Error during drag:`, error)
      }
    }

    const handleMouseUp = () => {
      console.log(`[${axisKey}] Drag ended`)
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
        flex items-center justify-center ${className} ${isDragging ? "bg-primary/20" : isHovering ? "bg-gray-100/10" : "bg-background"}`}
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

        console.log(`[${axisKey}] Drag started`)
        setIsDragging(true)
        startYRef.current = e.clientY
        lastYRef.current = e.clientY
      }}
    >
      <div className={`h-6 w-1 ${isDragging ? "bg-primary" : "bg-muted-foreground/20"} rounded-full`} />
      <div className="absolute left-2 text-xs text-muted-foreground">{axisKey.replace("yaxis", "Y")}</div>
    </div>
  )
}

