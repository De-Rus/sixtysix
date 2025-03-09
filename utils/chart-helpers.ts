export function interpolateY(x: number, xValues: number[], yValues: number[]): number | null {
  for (let i = 0; i < xValues.length - 1; i++) {
    if (x >= xValues[i] && x <= xValues[i + 1]) {
      const x1 = xValues[i]
      const x2 = xValues[i + 1]
      const y1 = yValues[i]
      const y2 = yValues[i + 1]

      // Linear interpolation formula
      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
    }
  }
  return null
}

export function getChartCoordinates(event: MouseEvent, chartDiv: HTMLDivElement) {
  const rect = chartDiv.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return { x, y }
}

export function pixelToData(
  pixel: { x: number; y: number },
  chartDiv: HTMLDivElement,
  xRange: [number, number],
  yRange: [number, number],
) {
  const rect = chartDiv.getBoundingClientRect()
  const xData = xRange[0] + (pixel.x / rect.width) * (xRange[1] - xRange[0])
  const yData = yRange[1] - (pixel.y / rect.height) * (yRange[1] - yRange[0])
  return { x: xData, y: yData }
}

// Add this new function to convert from plot coordinates to data coordinates
export function plotToDataCoordinates(
  plotX: number,
  plotY: number,
  xRange: [string, string],
  yRange: [number, number],
  plotRect: DOMRect,
): { x: string; y: number } {
  // Convert time range to timestamps for calculation
  const xStart = new Date(xRange[0]).getTime()
  const xEnd = new Date(xRange[1]).getTime()

  // Calculate the data value per pixel
  const xScale = (xEnd - xStart) / plotRect.width
  const yScale = (yRange[1] - yRange[0]) / plotRect.height

  // Convert plot coordinates to data values
  const timestamp = xStart + plotX * xScale
  const yValue = yRange[1] - plotY * yScale

  return {
    x: new Date(timestamp).toISOString(),
    y: yValue,
  }
}

// Add this helper to get plot coordinates relative to the plot area
export function getPlotCoordinates(event: MouseEvent, plotRect: DOMRect): { x: number; y: number } {
  return {
    x: event.clientX - plotRect.left,
    y: event.clientY - plotRect.top,
  }
}

// Add this new function to debounce events
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

// Add this function to handle zoom calculations
export function calculateNewRange(
  currentRange: [number, number],
  zoomLevel: number,
  centerPoint: number,
): [number, number] {
  const currentSpan = currentRange[1] - currentRange[0]
  const newSpan = currentSpan * zoomLevel
  const spanDiff = currentSpan - newSpan

  // Calculate how far through the range the center point is (0-1)
  const centerRatio = (centerPoint - currentRange[0]) / currentSpan

  // Apply the zoom centered on this point
  return [currentRange[0] + spanDiff * centerRatio, currentRange[1] - spanDiff * (1 - centerRatio)]
}

// Add these helper functions for date validation and range checking
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

export function validateTimeRange(range: [string, string]): [string, string] {
  try {
    const start = new Date(range[0])
    const end = new Date(range[1])

    if (!isValidDate(start) || !isValidDate(end)) {
      throw new Error("Invalid date in range")
    }

    if (start.getTime() > end.getTime()) {
      // Swap dates if they're in wrong order
      return [end.toISOString(), start.toISOString()]
    }

    return [start.toISOString(), end.toISOString()]
  } catch (error) {
    console.warn("Invalid time range:", error)
    // Return a safe fallback range (last hour)
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    return [hourAgo.toISOString(), now.toISOString()]
  }
}

export function ensureValidTimeRange(newRange: [string, string], fallbackRange: [string, string]): [string, string] {
  try {
    return validateTimeRange(newRange)
  } catch (error) {
    console.warn("Falling back to default range:", error)
    return fallbackRange
  }
}

