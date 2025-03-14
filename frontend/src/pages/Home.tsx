"use client";

import { FC, useState } from "react";
import CandlestickChart from "@/components/chart/candlestick-chart";
import { Watchlist } from "@/components/watchlist";
import { DrawingToolbar } from "@/components/drawing-toolbar";
import type { Order, Trade, Position } from "@/types/trading-types";
import { DataPoint } from "@/types";
import { useSymbol } from "@/hooks/use-symbol";
import StockHeader from "@/components/stock-header";
import AdvancedChartTools from "@/components/advanced-chart-tools";
import { TradingPanel } from "@/components/trading/trading-panel";
import { TradeEntryDialog } from "@/components/trading/trade-entry-dialog";

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

interface HomeContentProps {
  data: DataPoint[];
}

export const Home: FC<HomeContentProps> = ({ data }) => {
  const [activeTool, setActiveTool] = useState("select");
  const { currentSymbol, setCurrentSymbol } = useSymbol();
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [tradeDialog, setTradeDialog] = useState<{
    isOpen: boolean;
    price?: number;
  }>({ isOpen: false });

  // Handle tool change
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    // Close advanced tools menu when a tool is selected
    if (
      tool.startsWith("fibonacci-") ||
      tool.startsWith("gann-") ||
      tool.startsWith("elliott-") ||
      tool.startsWith("harmonic-") ||
      tool.startsWith("andrews-") ||
      tool.startsWith("percent-")
    ) {
      setShowAdvancedTools(false);
    }
  };

  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: currentSymbol,
      side: "long",
      quantity: 100,
      averagePrice: data[50].close,
      unrealizedPnl: 450.0,
      realizedPnl: 0,
      timestamp: data[50].time,
    },
    {
      symbol: currentSymbol,
      side: "short",
      quantity: 50,
      averagePrice: data[100].close,
      unrealizedPnl: -225.0,
      realizedPnl: 0,
      timestamp: data[100].time,
    },
  ]);

  // Generate sample orders within the chart's timeframe
  const sampleOrders: Order[] = [
    {
      id: "1",
      symbol: currentSymbol,
      side: "buy",
      type: "limit",
      price: data[150].low * 0.99, // Slightly below the candle
      quantity: 100,
      status: "pending",
      timestamp: data[150].time,
    },
    {
      id: "2",
      symbol: currentSymbol,
      side: "sell",
      type: "limit",
      price: data[160].high * 1.01, // Slightly above the candle
      quantity: 50,
      status: "filled",
      timestamp: data[160].time,
    },
    {
      id: "3",
      symbol: currentSymbol,
      side: "buy",
      type: "limit",
      price: data[170].low * 0.98,
      quantity: 75,
      status: "cancelled",
      timestamp: data[170].time,
    },
    {
      id: "4",
      symbol: currentSymbol,
      side: "sell",
      type: "limit",
      price: data[180].high * 1.02,
      quantity: 25,
      status: "rejected",
      timestamp: data[180].time,
    },
  ];

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

  // Add orders state
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // Add handler for new orders
  const handleNewOrder = (order: Order) => {
    setOrders((current) => [...current, order]);
  };

  // Handle symbol selection from watchlist
  const handleSymbolSelect = (symbol: string) => {
    setCurrentSymbol(symbol);
    console.log("Chaning current symbol", symbol);
  };

  const handleToggleAdvancedTools = () => {
    setShowAdvancedTools(!showAdvancedTools);
  };

  return (
    <div className="flex flex-col w-full bg-background">
      <div className="border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">TradePro</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-accent">
              <span className="sr-only">Notifications</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-bell"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              JD
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex gap-4 overflow-hidden">
        <div className="min-h-[calc(100vh-100px)]">
          <DrawingToolbar
            activeTool={activeTool}
            onToolChange={handleToolChange}
            onToggleAdvancedTools={handleToggleAdvancedTools}
          />
        </div>
        <div className="w-full flex flex-col gap-4">
          <div className="py-2">
            <StockHeader />
          </div>
          <div className="min-h-[400px]">
            <CandlestickChart data={data} orders={sampleOrders} />
          </div>
          <div>
            <TradingPanel
              orders={sampleOrders}
              trades={sampleTrades}
              positions={positions}
              onCancelPosition={handleCancelPosition}
              className="mt-0"
            />
            <TradeEntryDialog
              symbol={currentSymbol}
              isOpen={tradeDialog.isOpen}
              onClose={() => setTradeDialog({ isOpen: false })}
              onSubmit={(trade) => {
                console.log(trade);
              }}
              defaultPrice={tradeDialog.price}
            />
          </div>
        </div>
        <div className="border-l px-4">
          <Watchlist onSymbolSelect={handleSymbolSelect} />
        </div>
        {showAdvancedTools && (
          <AdvancedChartTools
            onToolSelect={handleToolChange}
            activeTool={activeTool}
            isVisible={showAdvancedTools}
          />
        )}
      </div>
    </div>
  );
};
