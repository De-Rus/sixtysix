"use client"

import { useEffect } from "react"

export function usePlotlyInitialization() {
  useEffect(() => {
    console.log("DEBUG: Component mounted, checking Plotly availability:", {
      plotlyAvailable: typeof window !== "undefined" && !!window.Plotly,
      windowExists: typeof window !== "undefined",
    })

    // Check if the plot container exists
    const checkPlotContainer = () => {
      const plotElement = document.getElementById("plot-container")
      console.log("DEBUG: Plot container check:", {
        exists: !!plotElement,
        plotlyAvailable: typeof window !== "undefined" && !!window.Plotly,
      })

      if (plotElement && window.Plotly) {
        console.log("DEBUG: Plot container and Plotly are available")
        // Check if the layout is initialized
        const gd = plotElement as any
        if (gd._fullLayout) {
          console.log("DEBUG: Plot layout is initialized:", {
            hasXaxis: !!gd._fullLayout.xaxis,
            hasYaxis: !!gd._fullLayout.yaxis,
          })
        } else {
          console.log("DEBUG: Plot layout is not yet initialized")
        }
      }
    }

    // Check immediately and after a delay to ensure Plotly has time to initialize
    checkPlotContainer()
    const timeoutId = setTimeout(checkPlotContainer, 1000)

    return () => clearTimeout(timeoutId)
  }, [])
}

