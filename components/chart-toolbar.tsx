"use client"

import { useEffect, useRef } from "react"
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
import { useState } from "react"
import { IndicatorConfigDialog } from "./indicator-config-dialog"
import { IchimokuIndicator } from "@/utils/indicators/ichimoku"
import { SMAIndicator, EMAIndicator } from "@/utils/indicators/moving-averages"
import { SupertrendIndicator } from "@/utils/indicators/supertrend"
import { TrendlineIndicator } from "@/utils/indicators/trendlines"
import { BollingerBandsIndicator } from "@/utils/indicators/bollinger-bands"
import { ChannelsIndicator } from "@/utils/indicators/channels"
import { MACDIndicator } from "@/utils/indicators/macd"
import { RenkoIndicator } from "@/utils/indicators/renko"
import { FibonacciIndicator } from "@/utils/indicators/fibonacci"
import { ADXIndicator } from "@/utils/indicators/adx"
import { Input } from "@/components/ui/input"
import { ElliottWaveIndicator } from "@/utils/indicators/elliott-wave"
import { SqueezeMomentumIndicator } from "@/utils/indicators/squeeze-momentum"
import { ParabolicSARIndicator } from "@/utils/indicators/parabolic-sar"
import { DonchianChannelsIndicator } from "@/utils/indicators/donchian"
import { RSIIndicator } from "@/utils/indicators/rsi"

interface ChartToolbarProps {
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
  selectedIndicators: string[]
  onIndicatorChange: (indicator: string, checked: boolean) => void
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  onIndicatorConfigChange: (indicator: string, config: Record<string, any>) => void
  configureIndicator?: string | null
  onConfigureIndicator?: (indicator: string | null) => void
}

export function ChartToolbar({
  onTimeframeChange,
  selectedTimeframe = "15m",
  selectedIndicators = [],
  onIndicatorChange,
  onSymbolChange,
  selectedSymbol = "AAPL",
  onIndicatorConfigChange,
  configureIndicator,
  onConfigureIndicator,
}: ChartToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [configDialog, setConfigDialog] = useState<{
    open: boolean
    indicator?: (typeof indicators)[0]
  }>({ open: false })

  const [configDialogState, setConfigDialogState] = useState<{
    isOpen: boolean
    indicator: string | null
  }>({ isOpen: false, indicator: null })

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
    console.log("Toolbar: timeframe clicked:", timeframe)
    onTimeframeChange?.(timeframe)
  }

  const indicators = [
    {
      value: "renko",
      label: RenkoIndicator.name,
      configurable: true,
      defaultParams: RenkoIndicator.defaultParams,
    },
    {
      value: "macd",
      label: MACDIndicator.name,
      configurable: true,
      defaultParams: MACDIndicator.defaultParams,
    },
    {
      value: "adx",
      label: ADXIndicator.name,
      configurable: true,
      defaultParams: ADXIndicator.defaultParams,
    },
    {
      value: "ichimoku",
      label: IchimokuIndicator.name,
      configurable: true,
      defaultParams: IchimokuIndicator.defaultParams,
    },
    {
      value: "sma",
      label: SMAIndicator.name,
      configurable: true,
      defaultParams: SMAIndicator.defaultParams,
    },
    {
      value: "ema",
      label: EMAIndicator.name,
      configurable: true,
      defaultParams: EMAIndicator.defaultParams,
    },
    {
      value: "supertrend",
      label: SupertrendIndicator.name,
      configurable: true,
      defaultParams: SupertrendIndicator.defaultParams,
    },
    { value: "smaCrossover", label: "SMA Crossover (20, 50)" },
    {
      value: "trendlines",
      label: TrendlineIndicator.name,
      configurable: true,
      defaultParams: TrendlineIndicator.defaultParams,
    },
    { value: "supportResistance", label: "Support & Resistance" },
    {
      value: "bollingerBands",
      label: BollingerBandsIndicator.name,
      configurable: true,
      defaultParams: BollingerBandsIndicator.defaultParams,
    },
    {
      value: "channels",
      label: ChannelsIndicator.name,
      configurable: true,
      defaultParams: ChannelsIndicator.defaultParams,
    },
    {
      value: "fibonacci",
      label: FibonacciIndicator.name,
      configurable: true,
      defaultParams: FibonacciIndicator.defaultParams,
    },
    {
      value: "elliottWave",
      label: ElliottWaveIndicator.name,
      configurable: true,
      defaultParams: ElliottWaveIndicator.defaultParams,
    },
    {
      value: "squeezeMomentum",
      label: SqueezeMomentumIndicator.name,
      configurable: true,
      defaultParams: SqueezeMomentumIndicator.defaultParams,
    },
    {
      value: "parabolicSar",
      label: ParabolicSARIndicator.name,
      configurable: true,
      defaultParams: ParabolicSARIndicator.defaultParams,
    },
    {
      value: "donchian",
      label: DonchianChannelsIndicator.name,
      configurable: true,
      defaultParams: DonchianChannelsIndicator.defaultParams,
    },
    {
      value: "rsi",
      label: RSIIndicator.name,
      configurable: true,
      defaultParams: RSIIndicator.defaultParams,
    },
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

  const handleIndicatorSelect = (indicator: (typeof indicators)[0], checked: boolean) => {
    if (checked && indicator.configurable) {
      setConfigDialog({ open: true, indicator })
    } else {
      onIndicatorChange?.(indicator.value, checked)
    }
  }

  const handleConfigSave = (params: Record<string, any>) => {
    if (configDialog.indicator) {
      onIndicatorChange?.(configDialog.indicator.value, true)
      onIndicatorConfigChange?.(configDialog.indicator.value, params)
    }
  }

  useEffect(() => {
    if (configureIndicator) {
      setConfigDialogState({
        isOpen: true,
        indicator: configureIndicator,
      })
      // Reset the configureIndicator state after opening the dialog
      if (onConfigureIndicator) {
        onConfigureIndicator(null)
      }
    }
  }, [configureIndicator, onConfigureIndicator])

  return (
    <>
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
                onCheckedChange={(checked) => handleIndicatorSelect(indicator, checked)}
              >
                {indicator.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {configDialog.indicator && (
        <IndicatorConfigDialog
          isOpen={configDialog.open}
          onClose={() => setConfigDialog({ open: false })}
          title={configDialog.indicator.label}
          parameters={configDialog.indicator.defaultParams}
          onSave={handleConfigSave}
        />
      )}
    </>
  )
}

export default ChartToolbar

