import type { DataPoint } from "../../types/chart-types";

/**
 * Gets the Plotly layout from a DOM element
 */
export function getPlotlyLayout(elementId: string) {
  // Wait for Plotly to be available
  if (typeof window === "undefined" || !window.Plotly) {
    return null;
  }

  // Get the plot element
  const plotElement = document.getElementById(elementId);
  if (!plotElement) {
    return null;
  }

  try {
    // Get the layout directly from the element's data
    const gd = plotElement as any;
    if (!gd._fullLayout) {
      return null;
    }

    return gd._fullLayout;
  } catch (error) {
    console.error("Error getting Plotly layout:", error);
    return null;
  }
}

/**
 * Helper function to get mouse event data from Plotly events
 */
export function getMouseEventData(
  event: any,
  chartDiv: HTMLDivElement | null
): { price: number | null; time: string | null } {
  // Check if we have a valid event
  if (!event) {
    return { price: null, time: null };
  }

  try {
    // First try to get data directly from Plotly points
    if (event.points && event.points[0]) {
      const point = event.points[0];
      // For candlestick charts, we want the y value at the clicked position
      const price = point.y !== undefined ? point.y : null;
      return {
        price: price !== null ? Number(price.toFixed(2)) : null,
        time: point.x,
      };
    }

    // Fallback to manual calculation if we have event.event
    if (event.event) {
      const plotEl = document.getElementById("plot-container");
      if (!plotEl) {
        return { price: null, time: null };
      }

      // Try to get the layout from the plot element
      let layout;
      try {
        // @ts-ignore - Plotly types
        layout = window.Plotly?.d3?.select(plotEl).layout();
      } catch (e) {
        // If that fails, try to get it directly from the element
        const gd = plotEl as any;
        layout = gd._fullLayout;
      }

      if (!layout || !layout.yaxis || !layout.xaxis) {
        return { price: null, time: null };
      }

      const rect = plotEl.getBoundingClientRect();
      const mouseY = event.event.clientY - rect.top;
      const mouseX = event.event.clientX - rect.left;

      // Convert pixel coordinates to data coordinates
      const yRange = layout.yaxis.range;
      const plotHeight = rect.height;
      // Invert the y calculation since pixel coordinates are top-down
      const yRatio = 1 - mouseY / plotHeight;
      const price = yRange[0] + (yRange[1] - yRange[0]) * yRatio;

      // Calculate time
      const xRange = layout.xaxis.range;
      const xRatio = mouseX / rect.width;
      let time;
      try {
        const timeMs =
          new Date(xRange[0]).getTime() +
          (new Date(xRange[1]).getTime() - new Date(xRange[0]).getTime()) *
            xRatio;
        time = new Date(timeMs).toISOString();
      } catch (e) {
        // If date conversion fails, use numeric interpolation
        time = xRange[0] + (xRange[1] - xRange[0]) * xRatio;
      }

      return {
        price: Number(price.toFixed(2)),
        time,
      };
    }

    return { price: null, time: null };
  } catch (error) {
    console.error("Error getting mouse event data:", error);
    return { price: null, time: null };
  }
}

/**
 * Calculate axis ranges based on data
 */
export function getAxisRange(data: DataPoint[]): {
  xaxis: { range: [string, string] };
  yaxis: { range: [number, number] };
} {
  if (!data.length)
    return { xaxis: { range: ["", ""] }, yaxis: { range: [0, 0] } };

  const prices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return {
    xaxis: {
      range: [data[0].time, data[data.length - 1].time],
    },
    yaxis: {
      range: [minPrice - padding, maxPrice + padding],
    },
  };
}
