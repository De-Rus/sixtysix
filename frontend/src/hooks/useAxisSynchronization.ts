"use client"

import { useCallback, useEffect } from "react"

export function useAxisSynchronization() {
  // Function to synchronize subplot axes with the main axis
  const synchronizeAxes = useCallback(() => {
    const plotElement = document.getElementById("plot-container")
    if (!plotElement || !window.Plotly) return

    try {
      const gd = plotElement as any
      if (!gd._fullLayout) return

      // Get the main x-axis range
      const mainRange = gd._fullLayout.xaxis.range

      // Check if we have any subplot axes
      const subplotAxes = Object.keys(gd._fullLayout).filter((key) => key.startsWith("xaxis") && key !== "xaxis")

      // If any subplot axis has a different range, synchronize them
      let needsUpdate = false
      const update: any = {}

      subplotAxes.forEach((axisKey) => {
        const subplotRange = gd._fullLayout[axisKey].range
        if (subplotRange[0] !== mainRange[0] || subplotRange[1] !== mainRange[1]) {
          update[`${axisKey}.range`] = mainRange
          needsUpdate = true
        }
      })

      if (needsUpdate) {
        window.Plotly.relayout(plotElement, update)
      }
    } catch (error) {
      console.error("Error synchronizing axes:", error)
    }
  }, [])

  // Set up an interval to check and synchronize axes
  useEffect(() => {
    // Synchronize axes on mount
    synchronizeAxes()

    // Set up an interval to check and synchronize axes
    const intervalId = setInterval(synchronizeAxes, 1000)

    return () => clearInterval(intervalId)
  }, [synchronizeAxes])

  // Add event listener for relayout events to keep subplot axes in sync
  useEffect(() => {
    const plotElement = document.getElementById("plot-container")
    if (!plotElement || !window.Plotly) return

    // Function to handle relayout events
    const handleRelayout = (eventData: any) => {
      // Check if the event is changing x-axis range
      if (eventData["xaxis.range[0]"] || eventData["xaxis.range[1]"] || eventData["xaxis.range"]) {
        // Synchronize all subplot x-axes with the main x-axis
        synchronizeAxes()
      }
    }

    // Add the event listener
    if (plotElement.on) {
      plotElement.on("plotly_relayout", handleRelayout)
    }

    return () => {
      // Remove the event listener
      if (plotElement.removeAllListeners) {
        plotElement.removeAllListeners("plotly_relayout")
      }
    }
  }, [synchronizeAxes])

  return { synchronizeAxes }
}

