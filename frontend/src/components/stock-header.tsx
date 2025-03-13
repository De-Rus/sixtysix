import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StockHeader() {
  const stock = {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 187.68,
    change: 1.25,
    changePercent: 0.67,
    marketCap: "2.95T",
    volume: "58.67M",
    avgVolume: "62.45M",
    high: 188.45,
    low: 186.21,
    open: 186.75,
    prevClose: 186.43,
    pe: 31.28,
    dividend: 0.96,
    yield: 0.51,
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{stock.symbol}</h1>
            <span className="text-lg text-muted-foreground">{stock.name}</span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold mr-2">
              ${stock.price.toFixed(2)}
            </span>
            <div
              className={`flex items-center ${
                stock.change >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stock.change >= 0 ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
              <span className="font-medium">
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.change >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%)
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-2 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Today, 4:00PM EDT
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700">Buy</Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700"
          >
            Sell
          </Button>
        </div>
      </div>
    </div>
  );
}
