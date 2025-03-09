/**
 * Generates the configuration object for Plotly charts
 * @returns Plotly config object
 */
export function generateChartConfig() {
  return {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
    doubleClick: "reset",
    showAxisDragHandles: true,
    showAxisRangeEntryBoxes: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      "toImage",
      "sendDataToCloud",
      "editInChartStudio",
      "toggleHover",
      "lasso2d",
      "select2d",
      "hoverClosestCartesian",
      "hoverCompareCartesian",
    ],
    modeBarButtonsToAdd: [],
  }
}

