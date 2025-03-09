"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BarChart3, ChevronDown, LineChart, Plus, Search } from "lucide-react"
import { searchStocks, type StockSymbol } from "@/utils/mock-stocks"
import { Input } from "@/components/ui/input"

interface ChartToolbarProps {
  onTimeframeChange?: (timeframe: string) => void
  selectedTimeframe?: string
  selectedIndicators?: string[]
  onIndicatorChange?: (indicator: string, checked: boolean) => void
  onSymbolChange?: (symbol: string) => void
  selectedSymbol?: string
  onIndicatorConfigChange?: (indicator: string, config: Record<string, any>) => void
}

export function ChartToolbar({
  onTimeframeChange,
  selectedTimeframe = "15m",
  selectedIndicators = [],
  onIndicatorChange,
  onSymbolChange,
  selectedSymbol = "AAPL",
  onIndicatorConfigChange,
}: ChartToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const visibleTimeframes = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
  ]

  const dropdownTimeframes = [
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
  ]

  const handleTimeframeClick = (timeframe: string) => {
    onTimeframeChange?.(timeframe)
  }

  const indicators = [
    { value: "ichimoku", label: "Ichimoku Cloud" },
    { value: "sma", label: "Simple Moving Average" },
    { value: "ema", label: "Exponential Moving Average" },
    { value: "macd", label: "MACD" },
    { value: "rsi", label: "RSI" },
    { value: "bollingerBands", label: "Bollinger Bands" },
    { value: "supertrend", label: "Supertrend" },
    { value: "adx", label: "ADX" },
    { value: "stochastic", label: "Stochastic" },
  ]

  const filteredIndicators = indicators.filter((indicator) =>
    indicator.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (searchQuery) {
      const results = searchStocks(searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange?.(symbol)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  const handleIndicatorSelect = (indicator: string, checked: boolean) => {
    onIndicatorChange?.(indicator, checked)
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-white">
      <div className="flex items-center gap-2 min-w-[200px]">
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isSearchOpen}
              className="w-[200px] justify-between h-8"
            >
              {selectedSymbol}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start" side="bottom" alignOffset={0} sideOffset={8}>
            <Command>
              <CommandInput
                placeholder="Search symbols..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                ref={searchInputRef}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No symbols found.</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((stock) => (
                    <CommandItem
                      key={stock.symbol}
                      value={stock.symbol}
                      onSelect={() => handleSymbolSelect(stock.symbol)}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-sm text-muted-foreground">{stock.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.sector}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Plus className="h-4 w-4" />
      </Button>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1">
        {visibleTimeframes.map((tf) => (
          <Button
            key={tf.value}
            variant={selectedTimeframe === tf.value ? "secondary" : "ghost"}
            className="h-8 px-2 text-xs"
            onClick={() => handleTimeframeClick(tf.value)}
          >
            {tf.label}
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {dropdownTimeframes.map((tf) => (
              <DropdownMenuItem
                key={tf.value}
                onClick={() => handleTimeframeClick(tf.value)}
                className={selectedTimeframe === tf.value ? "bg-accent" : ""}
              >
                {tf.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <LineChart className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 px-2 text-xs">
            Indicators
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-[300px] overflow-auto">
          <div className="p-2">
            <Input
              placeholder="Search indicators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <DropdownMenuSeparator />
          {filteredIndicators.map((indicator) => (
            <DropdownMenuCheckboxItem
              key={indicator.value}
              checked={selectedIndicators.includes(indicator.value)}
              onCheckedChange={(checked) => handleIndicatorSelect(indicator.value, checked)}
            >
              {indicator.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

