/**
 * Calculate new axis ranges during drag operations
 */
export function calculateDragRanges(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  startRanges: { xaxis: any[]; yaxis: any[] },
  chartRect: DOMRect,
): { xaxisRange: any[]; yaxisRange: any[] } {
  try {
    // Calculate the drag distance
    const deltaX = currentX - startX
    const deltaY = currentY - startY

    // Get the plot dimensions
    const { width, height } = chartRect

    // Calculate the data range delta based on pixel movement
    const xRange = startRanges.xaxis
    const yRange = startRanges.yaxis

    // For date axes, we need to handle dates properly
    let newXRange
    if (typeof xRange[0] === "string") {
      try {
        // Convert string dates to timestamps, apply delta, then back to ISO strings
        const start = new Date(xRange[0]).getTime()
        const end = new Date(xRange[1]).getTime()

        if (isNaN(start) || isNaN(end)) {
          console.warn("Invalid date range:", xRange)
          return { xaxisRange: xRange, yaxisRange: yRange }
        }

        // Calculate the time delta in milliseconds
        const timeSpan = end - start
        const timeDelta = timeSpan * (deltaX / width)

        // Apply the delta to both start and end
        const newStart = new Date(start - timeDelta)
        const newEnd = new Date(end - timeDelta)

        // Format as ISO strings
        newXRange = [newStart.toISOString(), newEnd.toISOString()]
      } catch (error) {
        console.error("Error calculating new X range:", error)
        return { xaxisRange: xRange, yaxisRange: yRange }
      }
    } else {
      // For numeric axes
      const xSpan = xRange[1] - xRange[0]
      const xDelta = xSpan * (deltaX / width)
      newXRange = [xRange[0] - xDelta, xRange[1] - xDelta]
    }

    // Calculate new Y range
    const ySpan = yRange[1] - yRange[0]
    const yDelta = ySpan * (deltaY / height)
    const newYRange = [yRange[0] + yDelta, yRange[1] + yDelta]

    return {
      xaxisRange: newXRange,
      yaxisRange: newYRange,
    }
  } catch (error) {
    console.error("Error calculating drag ranges:", error)
    return {
      xaxisRange: startRanges.xaxis,
      yaxisRange: startRanges.yaxis,
    }
  }
}

/**
 * Apply calculated ranges to the chart
 */
export function applyDragRanges(
  plotElementId: string,
  xaxisRange: any[],
  yaxisRange: any[],
  axisNumber = 1,
): Promise<any> {
  const plotElement = document.getElementById(plotElementId)
  if (!plotElement || !window.Plotly) {
    return Promise.reject(new Error("Plot element or Plotly not available"))
  }

  const xaxisKey = axisNumber === 1 ? "xaxis" : `xaxis${axisNumber}`
  const yaxisKey = axisNumber === 1 ? "yaxis" : `yaxis${axisNumber}`

  const update: any = {
    [`${xaxisKey}.range`]: xaxisRange,
    [`${yaxisKey}.range`]: yaxisRange,
  }

  return window.Plotly.relayout(plotElement, update)
}

/**
 * Get current axis ranges from the chart
 */
export function getCurrentRanges(plotElementId: string, axisNumber = 1): { xaxis: any[]; yaxis: any[] } | null {
  const plotElement = document.getElementById(plotElementId)
  if (!plotElement || !window.Plotly) return null

  try {
    const gd = plotElement as any
    if (!gd._fullLayout) return null

    const xaxisKey = axisNumber === 1 ? "xaxis" : `xaxis${axisNumber}`
    const yaxisKey = axisNumber === 1 ? "yaxis" : `yaxis${axisNumber}`

    const xaxis = gd._fullLayout[xaxisKey]
    const yaxis = gd._fullLayout[yaxisKey]

    if (!xaxis || !yaxis) return null

    return {
      xaxis: xaxis.range.slice(),
      yaxis: yaxis.range.slice(),
    }
  } catch (error) {
    console.error("Error getting current ranges:", error)
    return null
  }
}

