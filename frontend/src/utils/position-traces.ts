import type { Position } from "@/types/trading-types";
import type { DataPoint } from "@/types/chart-types";
import type { Trace } from "@/utils/indicators/base/base-indicator";

export function generatePositionTraces(
  positions: Position[],
  chartData: DataPoint[]
): Trace[] {
  if (!positions.length || !chartData.length) return [];

  const traces: Trace[] = [];
  const timeRange = [chartData[0].time, chartData[chartData.length - 1].time];

  positions.forEach((position) => {
    // Determine color based on position side
    const color =
      position.side === "long" ? "rgb(59, 130, 246)" : "rgb(239, 68, 68)"; // blue for long, red for short

    // Create the position line trace
    traces.push({
      x: timeRange,
      y: [position.entryPrice, position.exitPrice || position.averagePrice], // Update: Use exitPrice if available, otherwise use averagePrice
      type: "scatter",
      mode: "lines",
      name: `${position.side.toUpperCase()} Position`,
      line: {
        color,
        width: 1,
        dash: "dot",
      },
      hoverinfo: "none", // Changed from "text" to "none"
      text: `Entry: ${position.entryPrice}<br>Exit: ${
        position.exitPrice || "N/A"
      }<br>Quantity: ${position.quantity}`, //Added hover text
    });
  });

  return traces;
}
