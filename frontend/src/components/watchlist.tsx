import { FC, useState } from "react";
import { Search, Star, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sample watchlist data
const sampleWatchlist = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 187.68,
    change: 1.25,
    changePercent: 0.67,
    isFavorite: true,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 402.65,
    change: -3.45,
    changePercent: -0.85,
    isFavorite: true,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.89,
    change: 0.56,
    changePercent: 0.39,
    isFavorite: false,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 178.12,
    change: 2.34,
    changePercent: 1.33,
    isFavorite: true,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 950.02,
    change: 15.67,
    changePercent: 1.68,
    isFavorite: false,
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    price: 472.22,
    change: -1.89,
    changePercent: -0.4,
    isFavorite: false,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 175.34,
    change: -5.67,
    changePercent: -3.13,
    isFavorite: true,
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway",
    price: 408.78,
    change: 0.92,
    changePercent: 0.23,
    isFavorite: false,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    price: 198.56,
    change: 2.45,
    changePercent: 1.25,
    isFavorite: false,
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    price: 275.45,
    change: 1.23,
    changePercent: 0.45,
    isFavorite: false,
  },
];

interface WatchlistProps {
  onSymbolSelect: (symbol: string) => void;
}

export const Watchlist: FC<WatchlistProps> = ({ onSymbolSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlist, setWatchlist] = useState(sampleWatchlist);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter watchlist based on search term
  const filteredWatchlist = watchlist.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort watchlist
  const sortedWatchlist = [...filteredWatchlist].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    if (key === "symbol") {
      return direction === "asc"
        ? a.symbol.localeCompare(b.symbol)
        : b.symbol.localeCompare(a.symbol);
    }

    if (key === "price") {
      return direction === "asc" ? a.price - b.price : b.price - a.price;
    }

    if (key === "change") {
      return direction === "asc"
        ? a.changePercent - b.changePercent
        : b.changePercent - a.changePercent;
    }

    return 0;
  });

  // Toggle sort
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    setWatchlist(
      watchlist.map((stock) =>
        stock.symbol === symbol
          ? { ...stock, isFavorite: !stock.isFavorite }
          : stock
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search symbols or companies"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b">
              <th className="text-left font-medium p-2 w-10"></th>
              <th
                className="text-left font-medium p-2 cursor-pointer hover:bg-accent/50"
                onClick={() => requestSort("symbol")}
              >
                Symbol
                {sortConfig?.key === "symbol" && (
                  <span className="ml-1">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="text-right font-medium p-2 cursor-pointer hover:bg-accent/50"
                onClick={() => requestSort("price")}
              >
                Price
                {sortConfig?.key === "price" && (
                  <span className="ml-1">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="text-right font-medium p-2 cursor-pointer hover:bg-accent/50"
                onClick={() => requestSort("change")}
              >
                Change
                {sortConfig?.key === "change" && (
                  <span className="ml-1">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedWatchlist.map((stock) => (
              <tr
                key={stock.symbol}
                className="border-b hover:bg-accent/50 cursor-pointer"
                onClick={() => onSymbolSelect(stock.symbol)}
              >
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(stock.symbol);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        stock.isFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </Button>
                </td>
                <td className="p-2">
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {stock.name}
                  </div>
                </td>
                <td className="p-2 text-right font-mono">
                  ${stock.price.toFixed(2)}
                </td>
                <td className="p-2 text-right">
                  <div
                    className={cn(
                      "flex items-center justify-end font-medium",
                      stock.change >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {stock.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stock.change >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
            {filteredWatchlist.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-muted-foreground"
                >
                  No stocks found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
