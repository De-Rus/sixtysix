import type { Order } from "@/types/trading-types";
import type { Trace } from "../indicators/base/indicator";
import type { DataPoint } from "@/types/chart-types";

export function generateOrderTraces(
  orders: Order[],
  chartData: DataPoint[]
): Trace[] {
  // Split orders by type for different visualizations
  const buyOrders = orders.filter((o) => o.side === "buy");
  const sellOrders = orders.filter((o) => o.side === "sell");

  const traces: Trace[] = [];

  // Define colors with higher saturation
  const buyColor = "rgb(0, 122, 255)"; // Brighter blue
  const sellColor = "rgb(255, 59, 48)"; // Brighter red

  // Helper function to find the corresponding candle price for the order time
  const findCandlePrice = (timestamp: string) => {
    const orderTime = new Date(timestamp).getTime();
    const candle = chartData.find(
      (d) => new Date(d.time).getTime() >= orderTime
    );
    return candle ? candle.close : null;
  };

  // Generate buy order markers and lines
  if (buyOrders.length > 0) {
    // Add connecting lines first (so they appear behind the markers)
    buyOrders.forEach((order) => {
      const candlePrice = findCandlePrice(order.timestamp);
      if (candlePrice !== null) {
        traces.push({
          x: [order.timestamp, order.timestamp],
          y: [candlePrice, order.price],
          type: "scatter",
          mode: "lines",
          name: "Buy Line",
          line: {
            color: `rgba(0, 122, 255, 0.5)`, // blue with transparency
            width: 1,
            dash: "dot",
          },
          showlegend: false,
          hoverinfo: "none",
        });
      }
    });

    // Add markers
    traces.push({
      x: buyOrders.map((o) => o.timestamp),
      y: buyOrders.map((o) => o.price),
      type: "scatter",
      mode: "markers+text",
      name: "Buy Orders",
      marker: {
        symbol: "triangle-up",
        size: 14, // Slightly larger
        color: buyColor, // Brighter blue
        // Removed the line property to eliminate borders
      },
      text: buyOrders.map(() => "BUY"),
      textposition: "top center",
      textfont: {
        family: "Arial, sans-serif",
        size: 11, // Slightly larger
        color: buyColor, // Brighter blue
        weight: 700, // Bold
      },
      hoverinfo: "text",
      hovertext: buyOrders.map(
        (o) =>
          `Buy ${o.symbol}<br>Price: ${o.price}<br>Qty: ${o.quantity}<br>Status: ${o.status}`
      ),
    });
  }

  // Generate sell order markers and lines
  if (sellOrders.length > 0) {
    // Add connecting lines first
    sellOrders.forEach((order) => {
      const candlePrice = findCandlePrice(order.timestamp);
      if (candlePrice !== null) {
        traces.push({
          x: [order.timestamp, order.timestamp],
          y: [candlePrice, order.price],
          type: "scatter",
          mode: "lines",
          name: "Sell Line",
          line: {
            color: `rgba(255, 59, 48, 0.5)`, // red with transparency
            width: 1,
            dash: "dot",
          },
          showlegend: false,
          hoverinfo: "none",
        });
      }
    });

    // Add markers
    traces.push({
      x: sellOrders.map((o) => o.timestamp),
      y: sellOrders.map((o) => o.price),
      type: "scatter",
      mode: "markers+text",
      name: "Sell Orders",
      marker: {
        symbol: "triangle-down",
        size: 14, // Slightly larger
        color: sellColor, // Brighter red
        // Removed the line property to eliminate borders
      },
      text: sellOrders.map(() => "SELL"),
      textposition: "bottom center",
      textfont: {
        family: "Arial, sans-serif",
        size: 11, // Slightly larger
        color: sellColor, // Brighter red
        weight: 700, // Bold
      },
      hoverinfo: "text",
      hovertext: sellOrders.map(
        (o) =>
          `Sell ${o.symbol}<br>Price: ${o.price}<br>Qty: ${o.quantity}<br>Status: ${o.status}`
      ),
    });
  }

  return traces;
}
