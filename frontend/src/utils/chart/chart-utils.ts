/**
 * Utility functions for chart operations
 */

/**
 * Extracts mouse event data from a Plotly event
 * @param event The Plotly event object
 * @param chartElement The chart DOM element
 * @returns Object containing price and time data
 */
export function getMouseEventData(event: any, chartElement: HTMLElement | null) {
  // Default return value
  const defaultData = {
    price: null as number | null,
    time: null as string | null,
  }

  // Check if we have a valid event
  if (!event || (!event.points && !event.event)) {
    return defaultData
  }

  try {
    // For click events
    if (event.points && event.points.length > 0) {
      const point = event.points[0]
      return {
        price: point.y,
        time: point.x,
      }
    }

    // For hover/mousemove events
    if (event.event && chartElement) {
      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) return defaultData

      const gd = plotElement as any
      if (!gd._fullLayout) return defaultData

      const xaxis = gd._fullLayout.xaxis
      const yaxis = gd._fullLayout.yaxis

      if (!xaxis || !yaxis) return defaultData

      // Get mouse coordinates relative to the plot
      const rect = plotElement.getBoundingClientRect()
      const x = event.event.clientX - rect.left
      const y = event.event.clientY - rect.top

      // Convert pixel coordinates to data coordinates
      const dataX = xaxis.p2d(x)
      const dataY = yaxis.p2d(y)

      // Format the time value if it's a date
      let timeValue
      if (typeof dataX === "number") {
        // If it's a timestamp, convert to ISO string
        timeValue = new Date(dataX).toISOString()
      } else {
        timeValue = dataX
      }

      return {
        price: dataY,
        time: timeValue,
      }
    }
  } catch (error) {
    console.error("Error extracting mouse event data:", error)
  }

  return defaultData
}

/**
 * Formats a price value for display
 * @param price The price value to format
 * @param decimals Number of decimal places
 * @returns Formatted price string
 */
export function formatPrice(price: number, decimals = 2): string {
  return price.toFixed(decimals)
}

/**
 * Formats a date for display
 * @param date Date string or timestamp
 * @param format Format type ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export function formatDate(date: string | number, format: "short" | "medium" | "long" = "medium"): string {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date)

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString()
    case "long":
      return dateObj.toLocaleString()
    case "medium":
    default:
      return dateObj.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
  }
}

/**
 * Extracts a point from a Plotly event
 * @param event The Plotly event
 * @returns Object with x and y coordinates
 */
export function extractPointFromEvent(event: any): { x: number | string | null; y: number | null } {
  if (!event) return { x: null, y: null }

  try {
    // For click events with points
    if (event.points && event.points.length > 0) {
      const point = event.points[0]
      return {
        x: point.x,
        y: point.y,
      }
    }

    // For events with event property (mousemove, etc.)
    if (event.event) {
      const plotElement = document.getElementById("plot-container")
      if (!plotElement || !window.Plotly) return { x: null, y: null }

      const gd = plotElement as any
      if (!gd._fullLayout) return { x: null, y: null }

      const xaxis = gd._fullLayout.xaxis
      const yaxis = gd._fullLayout.yaxis

      if (!xaxis || !yaxis) return { x: null, y: null }

      // Get mouse coordinates relative to the plot
      const rect = plotElement.getBoundingClientRect()
      const x = event.event.clientX - rect.left
      const y = event.event.clientY - rect.top

      // Convert pixel coordinates to data coordinates
      const dataX = xaxis.p2d(x)
      const dataY = yaxis.p2d(y)

      return {
        x: dataX,
        y: dataY,
      }
    }
  } catch (error) {
    console.error("Error extracting point from event:", error)
  }

  return { x: null, y: null }
}

/**
 * Calculates the distance between two points
 * @param x1 X coordinate of first point
 * @param y1 Y coordinate of first point
 * @param x2 X coordinate of second point
 * @param y2 Y coordinate of second point
 * @returns Distance between the points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * Determines if a point is near a line
 * @param x X coordinate of the point
 * @param y Y coordinate of the point
 * @param x1 X coordinate of line start
 * @param y1 Y coordinate of line start
 * @param x2 X coordinate of line end
 * @param y2 Y coordinate of line end
 * @param threshold Maximum distance to be considered "near"
 * @returns Boolean indicating if point is near the line
 */
export function isPointNearLine(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold = 10,
): boolean {
  // Calculate the distance from point to line
  const lineLength = calculateDistance(x1, y1, x2, y2)
  if (lineLength === 0) return calculateDistance(x, y, x1, y1) <= threshold

  // Calculate the distance from point to line using the formula for distance from point to line
  const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength * lineLength)

  if (t < 0) {
    // Point is beyond the start of the line
    return calculateDistance(x, y, x1, y1) <= threshold
  } else if (t > 1) {
    // Point is beyond the end of the line
    return calculateDistance(x, y, x2, y2) <= threshold
  } else {
    // Point is within the line segment
    const projX = x1 + t * (x2 - x1)
    const projY = y1 + t * (y2 - y1)
    return calculateDistance(x, y, projX, projY) <= threshold
  }
}

/**
 * Converts a date string to a timestamp
 * @param dateStr Date string
 * @returns Timestamp in milliseconds
 */
export function dateToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

/**
 * Converts a timestamp to a date string
 * @param timestamp Timestamp in milliseconds
 * @returns ISO date string
 */
export function timestampToDate(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

/**
 * Generates a unique ID for chart elements
 * @returns Unique ID string
 */
export function generateChartElementId(): string {
  return `chart-element-${Math.random().toString(36).substring(2, 11)}`
}

