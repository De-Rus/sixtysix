import { DataPoint, Line } from "@/types/chart-types";

// Constants for chart layout
const SUBPLOT_HEIGHT_PERCENTAGE = 0.3; // 30% of total height per subplot
const XAXIS_HEIGHT_PERCENTAGE = 0.08; // Increased from 0.05 to 0.08 (8% height for x-axis)
const MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE = 0.05; // Increased from 0.03 to 0.05 (5% margin)

/**
 * Generate the Plotly layout for the chart
 */
export function generateChartLayout({
  darkMode,
  height,
  yAxisRange,
  xAxisRange,
  data,
  lines,
  activeLine,
  subplotHeights = [],
}: {
  darkMode: boolean;
  height: number;
  yAxisRange: [number, number] | null;
  xAxisRange: [string, string] | null;
  data: DataPoint[];
  lines: Line[];
  activeLine: Line | null;
  subplotHeights?: { id: string; height: number }[];
}) {
  // Calculate domain for main chart and subplots
  const hasSubplots = subplotHeights.length > 0;

  // Calculate the total height percentage taken by subplots
  const totalSubplotPercentage =
    subplotHeights.length * SUBPLOT_HEIGHT_PERCENTAGE;

  // Calculate main chart height (remaining space after subplots, x-axis, and margin)
  const mainChartPercentage = hasSubplots
    ? Math.max(
        0.1,
        1 -
          totalSubplotPercentage -
          XAXIS_HEIGHT_PERCENTAGE -
          MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE
      )
    : 1 - XAXIS_HEIGHT_PERCENTAGE - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE;

  // Convert to domain values (0-1 range)
  const mainChartDomainStart = 1 - mainChartPercentage;
  const mainChartDomainEnd = 1;
  const mainChartBottomMarginStart =
    mainChartDomainStart - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE;
  const xAxisPosition = mainChartBottomMarginStart;

  // Base layout
  const baseLayout: any = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    xaxis: {
      type: "date",
      showgrid: true,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      zeroline: false,
      rangeslider: { visible: false },
      color: darkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      range:
        xAxisRange ||
        (data.length ? [data[0].time, data[data.length - 1].time] : undefined),
      showspikes: false,
      domain: [0, 1], // Full width
      anchor: "y",
      showline: true,
      linecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
      linewidth: 1,
      position: xAxisPosition, // Position x-axis below main chart and margin
      fixedrange: false,
    },
    yaxis: {
      showgrid: true,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      zeroline: false,
      fixedrange: false,
      side: "right",
      color: darkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      autorange: false,
      range: yAxisRange,
      showspikes: false,
      showticklabels: true,
      tickmode: "auto",
      nticks: 8,
      tickfont: {
        size: 11,
        color: darkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      },
      showline: true,
      linecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
      linewidth: 1,
      domain: [mainChartDomainStart, mainChartDomainEnd], // Main chart at top
      anchor: "x",
    },
    dragmode: "pan",
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: darkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
      font: {
        color: darkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
        family: "monospace",
        size: 12,
      },
      align: "left",
    },
    hoverdistance: 50,
    hoveranchor: "x right",
    spikedistance: -1,
    showlegend: false,
    legend: { x: 0, y: 1 },
    margin: { l: 40, r: 40, t: 10, b: 20, pad: 0 }, // No padding
    height: height,
    shapes: [
      // Add a border line between main chart and margin
      {
        type: "line",
        x0: 0,
        y0: mainChartDomainStart,
        x1: 1,
        y1: mainChartDomainStart,
        xref: "paper",
        yref: "paper",
        line: {
          color: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
          width: 1,
        },
      },
    ],
  };

  // Add subplot axes if needed
  if (hasSubplots) {
    // Add a border line between main chart and x-axis
    baseLayout.shapes.push({
      type: "line",
      x0: 0,
      y0: mainChartBottomMarginStart,
      x1: 1,
      y1: mainChartBottomMarginStart,
      xref: "paper",
      yref: "paper",
      line: {
        color: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        width: 1,
      },
    });

    // Create each subplot with 30% height
    subplotHeights.forEach((subplot, index) => {
      const axisNumber = index + 2; // yaxis2, yaxis3, etc.

      // Calculate domain for this subplot (from bottom to top)
      // Each subplot is 30% of the total height
      const domainEnd =
        mainChartBottomMarginStart - index * SUBPLOT_HEIGHT_PERCENTAGE;
      const domainStart = domainEnd - SUBPLOT_HEIGHT_PERCENTAGE;

      // Add x-axis for this subplot
      baseLayout[`xaxis${axisNumber}`] = {
        type: "date",
        showgrid: true,
        gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        zeroline: false,
        showticklabels: index === 0, // Only show labels on bottom subplot
        range: baseLayout.xaxis.range,
        domain: [0, 1], // Full width
        anchor: `y${axisNumber}`,
        showline: index === 0, // Show line only on bottom subplot
        linecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        linewidth: 1,
        matches: "x",
        scaleanchor: "x",
        fixedrange: false,
      };

      // Add y-axis for this subplot
      baseLayout[`yaxis${axisNumber}`] = {
        showgrid: true,
        gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        zeroline: false,
        side: "right",
        color: darkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        tickfont: {
          size: 10,
          color: darkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        },
        domain: [domainStart, domainEnd], // 30% height
        anchor: `x${axisNumber}`,
        showline: true,
        linecolor: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
        linewidth: 1,
        fixedrange: false,
      };

      // Add a border line at the top of each subplot
      if (index < subplotHeights.length - 1) {
        baseLayout.shapes.push({
          type: "line",
          x0: 0,
          y0: domainStart,
          x1: 1,
          y1: domainStart,
          xref: "paper",
          yref: "paper",
          line: {
            color: darkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
            width: 1,
          },
        });
      }
    });
  }

  return baseLayout;
}

/**
 * Generate the Plotly config
 */
export function generateChartConfig() {
  return {
    scrollZoom: true,
    responsive: true,
    displaylogo: false,
    displayModeBar: false,
    modeBarButtonsToAdd: [],
    doubleClick: false,
    showAxisDragHandles: true,
    showAxisRangeEntryBoxes: false,
    staticPlot: false,
    editable: false,
    edits: {
      legendPosition: false,
      legendText: false,
      annotationPosition: false,
      annotationTail: false,
      annotationText: false,
    },
    hovermode: "x unified",
  };
}
