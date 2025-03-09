import { useState } from "react";

interface WatchlistItem {
  symbol: string;
  type: string;
  last: number;
  change: number;
  changePercent: number;
}

interface WatchlistProps {
  onSymbolSelect?: (symbol: string) => void;
}

export default function Watchlist({ onSymbolSelect }: WatchlistProps) {
  const [activeFilter, setActiveFilter] = useState<string>("ETF");
  const [watchlist] = useState<WatchlistItem[]>([
    {
      symbol: "VWRL",
      type: "ETF",
      last: 127.34,
      change: -2.22,
      changePercent: -1.71,
    },
    {
      symbol: "VUSA",
      type: "ETF",
      last: 99.57,
      change: -2.12,
      changePercent: -2.09,
    },
    {
      symbol: "EQQQ",
      type: "ETF",
      last: 447.00,
      change: -13.29,
      changePercent: -2.89,
    },
    {
      symbol: "ROBO",
      type: "ETF",
      last: 22.40,
      change: -0.435,
      changePercent: -1.91,
    },
    {
      symbol: "IEMM",
      type: "ETF",
      last: 40.35,
      change: -0.27,
      changePercent: -0.66,
    },
    {
      symbol: "LYXIB",
      type: "ETF",
      last: 134.94,
      change: 0.18,
      changePercent: 0.13,
    },
    {
      symbol: "UPRO",
      type: "ETF",
      last: 81.39,
      change: 1.18,
      changePercent: 1.47,
    },
    {
      symbol: "TECL",
      type: "ETF",
      last: 70.76,
      change: 2.76,
      changePercent: 4.06,
    },
    {
      symbol: "TQQQ",
      type: "ETF",
      last: 1362.68,
      change: 23.89,
      changePercent: 1.78,
    },
    {
      symbol: "3USL",
      type: "ETF",
      last: 91.07,
      change: -5.54,
      changePercent: -5.73,
    },
    {
      symbol: "QQQ3",
      type: "ETF",
      last: 176.68,
      change: -15.83,
      changePercent: -8.22,
    },
  ]);

  return (
    <div className="h-full bg-white text-gray-800 border border-gray-200 rounded-lg shadow-sm">
      <div className="p-2 border-b border-gray-200">
        <div className="flex space-x-2 text-xs">
          <button
            className={`px-3 py-1 rounded ${activeFilter === "ETF" ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-600"}`}
            onClick={() => setActiveFilter("ETF")}
          >
            ETF
          </button>
          <button
            className={`px-3 py-1 rounded ${activeFilter === "STOCKS" ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-600"}`}
            onClick={() => setActiveFilter("STOCKS")}
          >
            STOCKS
          </button>
        </div>
      </div>
      <div className="text-xs border-b border-gray-200 p-2 grid grid-cols-12 gap-2 bg-gray-50 font-medium">
        <div className="col-span-4">Symbol</div>
        <div className="col-span-3 text-right">Last</div>
        <div className="col-span-2 text-right">Chg</div>
        <div className="col-span-3 text-right">Chg%</div>
      </div>
      <div className="overflow-y-auto">
        {watchlist
          .filter((item) => item.type === activeFilter)
          .map((item) => (
            <button
              key={item.symbol}
              onClick={() => onSymbolSelect?.(item.symbol)}
              className="w-full p-2 hover:bg-gray-50 grid grid-cols-12 gap-2 text-xs border-b border-gray-100"
            >
              <div className="col-span-4 font-medium">{item.symbol}</div>
              <div className="col-span-3 text-right">{item.last.toFixed(2)}</div>
              <div
                className={`col-span-2 text-right ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(2)}
              </div>
              <div
                className={`col-span-3 text-right ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {item.change >= 0 ? "+" : ""}
                {item.changePercent.toFixed(2)}%
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}