/**
 * Generates the layout configuration for Plotly charts
 * @param options Options for generating the layout
 * @returns Plotly layout object
 */
export function generateChartLayout({
  darkMode,
  height,
  yAxisRange,
  xAxisRange,
  data,
  lines,
  activeLine,
  subplotHeights,
}: {
  darkMode: boolean
  height: number
  yAxisRange: number[]
  xAxisRange: string[]
  data: any[]
  lines: any[]
  activeLine: string | null
  subplotHeights: { id: string; height: number }[]
}) {
  // Calculate the total height percentage taken by subplots
  const totalSubplotPercentage = subplotHeights.reduce((acc, subplot) => acc + subplot.height, 0)

  // Calculate main chart height (remaining space after subplots and x-axis)
  const xAxisHeightPercentage = 0.08 // 8% height for x-axis
  const mainChartBottomMarginPercentage = 0.05 // 5% margin

  const mainChartPercentage =
    subplotHeights.length > 0
      ? Math.max(0.1, 1 - totalSubplotPercentage - xAxisHeightPercentage - mainChartBottomMarginPercentage)
      : 1 - xAxisHeightPercentage - mainChartBottomMarginPercentage

  // Convert to domain values (0-1 range)
  const mainChartDomainStart = 1 - mainChartPercentage
  const mainChartDomainEnd = 1

  // Base layout
  const layout: any = {
    height: height,
    margin: { l: 50, r: 50, t: 30, b: 30 },
    paper_bgcolor: darkMode ? "#1e1e1e" : "white",
    plot_bgcolor: darkMode ? "#1e1e1e" : "white",
    font: {
      color: darkMode ? "#e0e0e0" : "#333333",
    },
    showlegend: false,
    xaxis: {
      type: "date",
      rangeslider: { visible: false },
      range: xAxisRange,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      zerolinecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
      domain: [0, 1],
      tickfont: {
        size: 10,
      },
    },
    yaxis: {
      range: yAxisRange,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      zerolinecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
      domain: [mainChartDomainStart, mainChartDomainEnd],
      tickfont: {
        size: 10,
      },
      fixedrange: false,
    },
    dragmode: "zoom",
    hovermode: "closest",
  }

  // Add subplots if needed
  if (subplotHeights.length > 0) {
    let currentBottom = 0

    subplotHeights.forEach((subplot, index) => {
      const axisNumber = index + 2 // yaxis2, yaxis3, etc.
      const domainStart = currentBottom
      const domainEnd = currentBottom + subplot.height
      currentBottom = domainEnd

      layout[`yaxis${axisNumber}`] = {
        gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        zerolinecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        domain: [domainStart, domainEnd],
        tickfont: {
          size: 10,
        },
        fixedrange: false,
      }

      // Special configurations for specific indicators
      if (subplot.id === "rsi") {
        layout[`yaxis${axisNumber}`].range = [0, 100]
        layout[`yaxis${axisNumber}`].title = "RSI"
      } else if (subplot.id === "macd") {
        layout[`yaxis${axisNumber}`].title = "MACD"
      } else if (subplot.id === "adx") {
        layout[`yaxis${axisNumber}`].range = [0, 100]
        layout[`yaxis${axisNumber}`].title = "ADX"
      } else if (subplot.id === "stochastic") {
        layout[`yaxis${axisNumber}`].range = [0, 100]
        layout[`yaxis${axisNumber}`].title = "Stochastic"
      }
    })
  }

  return layout
}

