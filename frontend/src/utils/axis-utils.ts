import type { DataPoint } from "../types/chart-types"

/**
 * Calculate axis ranges based on data
 */
export function getAxisRange(data: DataPoint[]): {
  xaxis: { range: [string, string] }
  yaxis: { range: [number, number] }
} {
  if (!data.length) return { xaxis: { range: ["", ""] }, yaxis: { range: [0, 0] } }

  const prices = data.flatMap((d) => [d.high, d.low])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = (maxPrice - minPrice) * 0.1

  return {
    xaxis: {
      range: [data[0].time, data[data.length - 1].time],
    },
    yaxis: {
      range: [minPrice - padding, maxPrice + padding],
    },
  }
}

/**
 * Safely format a date string to prevent "unrecognized date" errors
 */
export function safeFormatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateStr)
      return dateStr
    }
    return date.toISOString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateStr
  }
}

/**
 * Gets the Plotly layout from a DOM element
 */
export function getPlotlyLayout(elementId: string) {
  // Wait for Plotly to be available
  if (typeof window === "undefined" || !window.Plotly) {
    console.log("Plotly not yet available")
    return null
  }

  // Get the plot element
  const plotElement = document.getElementById(elementId)
  if (!plotElement) {
    console.log("Plot element not found")
    return null
  }

  try {
    // Get the layout directly from the element's data
    const gd = plotElement as any
    if (!gd._fullLayout) {
      console.log("Layout not yet initialized")
      return null
    }

    return gd._fullLayout
  } catch (error) {
    console.error("Error getting Plotly layout:", error)
    return null
  }
}

/**
 * Synchronize x-axis ranges across multiple subplots
 */
export function synchronizeXAxes(plotElementId = "plot-container") {
  const plotElement = document.getElementById(plotElementId)
  if (!plotElement || !window.Plotly) return

  try {
    const gd = plotElement as any
    if (!gd._fullLayout || !gd._fullLayout.xaxis) return

    // Get the main x-axis range
    const mainRange = gd._fullLayout.xaxis.range

    // Create an update object for all x-axes
    const update: any = {}

    // Find all x-axes in the layout
    Object.keys(gd._fullLayout).forEach((key) => {
      if (key.startsWith("xaxis") && key !== "xaxis") {
        update[`${key}.range`] = mainRange
      }
    })

    // Only update if there are subplots to synchronize
    if (Object.keys(update).length > 0) {
      window.Plotly.relayout(plotElement, update)
    }
  } catch (error) {
    console.error("Error synchronizing x-axes:", error)
  }
}

