import type { DataPoint } from "../../types/chart-types";
import type { Order, Position } from "../../types/trading-types";
import type { Trace } from "../indicators/base/indicator";
import { indicatorRegistry } from "../indicators/registry";
import { generateOrderTraces } from "./order-traces";
import { generatePositionTraces } from "./position-traces";

export function generatePlotData({
  data,
  selectedIndicators,
  indicatorConfigs,
  darkMode,
  orders,
  positions,
}: {
  data: DataPoint[];
  selectedIndicators: string[];
  indicatorConfigs: Record<string, Record<string, any>>;
  darkMode: boolean;
  orders: Order[];
  positions: Position[];
}): any[] {
  console.log("Generating plot data with configs:", indicatorConfigs);
  if (!data.length) return [];

  // Check if we have subplots
  const subplotIndicators = selectedIndicators.filter((indicatorId) => {
    switch (indicatorId) {
      case "macd":
      case "adx":
      case "squeezeMomentum":
      case "rsi":
        return true;
      default:
        return false;
    }
  });
  const hasSubplots = subplotIndicators.length > 0;

  // Always add candlesticks first
  const mainPaneTraces: Trace[] = [
    {
      type: "candlestick",
      x: data.map((d) => d.time),
      open: data.map((d) => d.open),
      high: data.map((d) => d.high),
      low: data.map((d) => d.low),
      close: data.map((d) => d.close),
      name: "Candlesticks",
      increasing: {
        line: { color: darkMode ? "rgb(74, 222, 128)" : "rgb(34, 197, 94)" },
        fillcolor: darkMode ? "rgb(74, 222, 128)" : "rgb(34, 197, 94)",
      },
      decreasing: {
        line: { color: darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)" },
        fillcolor: darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)",
      },
      yaxis: "y",
      xaxis: hasSubplots ? "x" : undefined,
      hovertext: data.map(
        (d) =>
          `${new Date(d.time).toLocaleString()}<br>` +
          `O: ${d.open.toFixed(2)}<br>` +
          `H: ${d.high.toFixed(2)}<br>` +
          `L: ${d.low.toFixed(2)}<br>` +
          `C: ${d.close.toFixed(2)}`
      ),
      hoverinfo: "text",
    } as unknown as Trace,
  ];

  // Add position traces first (so they appear behind orders)
  mainPaneTraces.push(...generatePositionTraces(positions, data));

  // Add order traces
  mainPaneTraces.push(...generateOrderTraces(orders, data));

  const subplotTraces: Trace[] = [];

  // Process all selected indicators
  selectedIndicators.forEach((indicatorId) => {
    const indicator = indicatorRegistry.createIndicator(indicatorId, data);
    const config = indicatorConfigs[indicatorId] || {};

    if (indicator) {
      indicator.setParameters(config);

      // Get indicator traces
      const traces = indicator.generateTraces();

      // Add traces to appropriate array based on subplot configuration
      if (indicator.constructor.getConfig().subplot) {
        subplotTraces.push(...traces);
      } else {
        mainPaneTraces.push(...traces);
      }
    }
  });

  return [...mainPaneTraces, ...subplotTraces];
}
