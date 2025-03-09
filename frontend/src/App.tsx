"use client";

import { useState } from "react";
import CandlestickChart from "@/components/candlestick-chart";
import Watchlist from "@/components/watchlist";
import { generateData } from "@/utils/indicator-calculations";
import { DrawingToolbar } from "@/components/drawing-toolbar";
import type { Order, Trade, Position } from "@/types/trading-types";

// Updated sample data for better visualization
const sampleTrades: Trade[] = [
  {
    id: "1",
    orderId: "2",
    symbol: "AAPL",
    side: "sell",
    price: 190.0,
    quantity: 50,
    timestamp: new Date().toISOString(),
    pnl: 225.0,
  },
];

export default function Home() {
  const [activeTool, setActiveTool] = useState("select");
  const [isDragging, setIsDragging] = useState(false);
  const [hasSelectedShape, setHasSelectedShape] = useState(false);
  const [showPathWarning, setShowPathWarning] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState("AAPL");
  const sampleData = generateData(200, "1h", currentSymbol);
  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: currentSymbol,
      side: "long",
      quantity: 100,
      averagePrice: sampleData[50].close,
      unrealizedPnl: 450.0,
      realizedPnl: 0,
      timestamp: sampleData[50].time,
    },
    {
      symbol: currentSymbol,
      side: "short",
      quantity: 50,
      averagePrice: sampleData[100].close,
      unrealizedPnl: -225.0,
      realizedPnl: 0,
      timestamp: sampleData[100].time,
    },
  ]);

  // Handler for position cancellation
  const handleCancelPosition = (positionToCancel: Position) => {
    setPositions((currentPositions) =>
      currentPositions.filter(
        (p) =>
          !(
            p.symbol === positionToCancel.symbol &&
            p.side === positionToCancel.side &&
            p.timestamp === positionToCancel.timestamp
          )
      )
    );
  };

  // Generate sample orders within the chart's timeframe
  const sampleOrders: Order[] = [
    {
      id: "1",
      symbol: currentSymbol,
      side: "buy",
      type: "limit",
      price: sampleData[150].low * 0.99, // Slightly below the candle
      quantity: 100,
      status: "pending",
      timestamp: sampleData[150].time,
    },
    {
      id: "2",
      symbol: currentSymbol,
      side: "sell",
      type: "limit",
      price: sampleData[160].high * 1.01, // Slightly above the candle
      quantity: 50,
      status: "filled",
      timestamp: sampleData[160].time,
    },
    {
      id: "3",
      symbol: currentSymbol,
      side: "buy",
      type: "limit",
      price: sampleData[170].low * 0.98,
      quantity: 75,
      status: "cancelled",
      timestamp: sampleData[170].time,
    },
    {
      id: "4",
      symbol: currentSymbol,
      side: "sell",
      type: "limit",
      price: sampleData[180].high * 1.02,
      quantity: 25,
      status: "rejected",
      timestamp: sampleData[180].time,
    },
  ];

  // Add orders state
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // Add handler for new orders
  const handleNewOrder = (order: Order) => {
    setOrders((current) => [...current, order]);
  };

  // Add handler for order cancellation
  const handleCancelOrder = (orderToCancel: Order) => {
    setOrders((currentOrders) =>
      currentOrders.filter((o) => o.id !== orderToCancel.id)
    );
  };

  // Handle symbol selection from watchlist
  const handleSymbolSelect = (symbol: string) => {
    setCurrentSymbol(symbol);
  };

  return (
    <div className="flex h-screen">
      <DrawingToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDeleteSelected={() => {
          // Handle delete
        }}
        isDragging={isDragging}
        hasSelectedShape={hasSelectedShape}
        showPathWarning={showPathWarning}
        className="h-full"
      />
      <div className="flex-1 relative">
        <CandlestickChart
          data={sampleData}
          orders={sampleOrders}
          trades={sampleTrades}
          positions={positions}
          onCancelOrder={handleCancelOrder}
          onCancelPosition={handleCancelPosition}
          activeTool={activeTool}
          onDragStateChange={setIsDragging}
          onSelectedShapeChange={setHasSelectedShape}
          onShowPathWarning={setShowPathWarning}
        />
      </div>
      <Watchlist onSymbolSelect={setCurrentSymbol} className="p-4" />
    </div>
  );
}
