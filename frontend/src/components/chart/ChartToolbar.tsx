"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BarChart3, ChevronDown, Plus, Search } from "lucide-react";
import { searchStocks, type StockSymbol } from "@/utils/mock-stocks";
import { useState } from "react";
import { IndicatorConfigDialog } from "./indicator-config-dialog";
import { IchimokuIndicator } from "@/utils/indicators/ichimoku";
import { SMAIndicator, EMAIndicator } from "@/utils/indicators/moving-averages";
import { SupertrendIndicator } from "@/utils/indicators/supertrend";
import { TrendlineIndicator } from "@/utils/indicators/trendlines";
import { BollingerBandsIndicator } from "@/utils/indicators/bollinger-bands";
import { ChannelsIndicator } from "@/utils/indicators/channels";
import { MACDIndicator } from "@/utils/indicators/impl/macd";
import { RenkoIndicator } from "@/utils/indicators/impl/renko";
import { FibonacciIndicator } from "@/utils/indicators/fibonacci";
import { ADXIndicator } from "@/utils/indicators/adx";
import { Input } from "@/components/ui/input";
import { ElliottWaveIndicator } from "@/utils/indicators/elliott-wave";
import { SqueezeMomentumIndicator } from "@/utils/indicators/squeeze-momentum";
import { ParabolicSARIndicator } from "@/utils/indicators/parabolic-sar";
import { DonchianChannelsIndicator } from "@/utils/indicators/donchian";
import { RSIIndicator } from "@/utils/indicators/rsi";
import { StochasticIndicator } from "@/utils/indicators/stochastic";
import type { ChartType, DrawingTool } from "@/types";
import eventBus from "@/utils/event-bus";

const DEBUG = true;

interface ChartToolbarProps {
  onTimeframeChange?: (timeframe: string) => void;
  selectedTimeframe?: string;
  selectedIndicators?: string[];
  onIndicatorChange?: (indicator: string, checked: boolean) => void;
  onSymbolChange?: (symbol: string) => void;
  selectedSymbol?: string;
  onIndicatorConfigChange?: (
    indicator: string,
    config: Record<string, any>
  ) => void;
  darkMode?: boolean;
  setDarkMode?: (darkMode: boolean) => void;
  chartType?: ChartType;
  setChartType?: (chartType: ChartType) => void;
  onChartTypeChange?: (chartType: ChartType) => void;
  onResetChart?: () => void;
  onFullScreen?: () => void;
  onToolSelect?: (tool: DrawingTool) => void;
  selectedTool?: DrawingTool;
  onAddIndicator?: () => void;
  onToggleSettings?: () => void;
  className?: string;
}

export function ChartToolbar({
  onTimeframeChange,
  selectedTimeframe = "15m",
  selectedIndicators = [],
  onIndicatorChange,
  onSymbolChange,
  selectedSymbol = "AAPL",
  onIndicatorConfigChange,
  darkMode = false,
  setDarkMode,
  chartType,
  setChartType,
  onChartTypeChange,
  onResetChart,
  onFullScreen,
  onToolSelect,
  selectedTool = "cursor",
  onAddIndicator,
  onToggleSettings,
  className,
}: ChartToolbarProps) {
  const [indicatorSearchQuery, setIndicatorSearchQuery] = useState("");
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    indicator?: (typeof indicators)[0];
  }>({ open: false });

  // Keep track of previous selectedTool for comparison
  const prevSelectedToolRef = useRef<DrawingTool>(selectedTool);

  // Log when selectedTool changes
  useEffect(() => {
    console.log(
      `ChartToolbar: selectedTool prop changed from ${prevSelectedToolRef.current} to ${selectedTool}`
    );
    prevSelectedToolRef.current = selectedTool;

    // Log all props for debugging
    console.log("ChartToolbar props:", {
      selectedTool,
      hasOnToolSelect: !!onToolSelect,
      hasOnTimeframeChange: !!onTimeframeChange,
      hasOnIndicatorChange: !!onIndicatorChange,
      hasOnSymbolChange: !!onSymbolChange,
      hasOnIndicatorConfigChange: !!onIndicatorConfigChange,
      hasSetDarkMode: !!setDarkMode,
      hasSetChartType: !!setChartType,
      hasOnChartTypeChange: !!onChartTypeChange,
      hasOnResetChart: !!onResetChart,
      hasOnFullScreen: !!onFullScreen,
      hasOnAddIndicator: !!onAddIndicator,
      hasOnToggleSettings: !!onToggleSettings,
    });
  }, [
    selectedTool,
    onToolSelect,
    onTimeframeChange,
    onIndicatorChange,
    onSymbolChange,
    onIndicatorConfigChange,
    setDarkMode,
    setChartType,
    onChartTypeChange,
    onResetChart,
    onFullScreen,
    onAddIndicator,
    onToggleSettings,
  ]);

  // Log on mount
  useEffect(() => {
    console.log("ChartToolbar mounted with props:", {
      selectedTool,
      hasOnToolSelect: !!onToolSelect,
    });

    return () => {
      console.log("ChartToolbar unmounting");
    };
  }, [selectedTool, onToolSelect]); // Added dependencies

  // Log MACD default params on component mount
  useEffect(() => {
    console.log(
      "MACD default params:",
      JSON.stringify(MACDIndicator.defaultParams, null, 2)
    );
  }, []);

  const visibleTimeframes = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
  ];

  const dropdownTimeframes = [
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1D", label: "1D" },
    { value: "1W", label: "1W" },
  ];

  const handleTimeframeClick = (timeframe: string) => {
    onTimeframeChange?.(timeframe);
  };

  // Define indicators with explicit default parameters
  const indicators = [
    {
      value: "macd",
      label: MACDIndicator.indicatorName,
      configurable: true,
      defaultParams: MACDIndicator.defaultParams,
    },
    {
      value: "renko",
      label: RenkoIndicator.indicatorName,
      configurable: true,
      defaultParams: RenkoIndicator.defaultParams,
    },
    {
      value: "adx",
      label: ADXIndicator.indicatorName,
      configurable: true,
      defaultParams: ADXIndicator.defaultParams,
    },
    {
      value: "ichimoku",
      label: IchimokuIndicator.indicatorName,
      configurable: true,
      defaultParams: IchimokuIndicator.defaultParams,
    },
    {
      value: "sma",
      label: SMAIndicator.indicatorName,
      configurable: true,
      defaultParams: SMAIndicator.defaultParams,
    },
    {
      value: "ema",
      label: EMAIndicator.indicatorName,
      configurable: true,
      defaultParams: EMAIndicator.defaultParams,
    },
    {
      value: "supertrend",
      label: SupertrendIndicator.indicatorName,
      configurable: true,
      defaultParams: SupertrendIndicator.defaultParams,
    },
    { value: "smaCrossover", label: "SMA Crossover (20, 50)" },
    {
      value: "trendlines",
      label: TrendlineIndicator.indicatorName,
      configurable: true,
      defaultParams: TrendlineIndicator.defaultParams,
    },
    { value: "supportResistance", label: "Support & Resistance" },
    {
      value: "bollingerBands",
      label: BollingerBandsIndicator.indicatorName,
      configurable: true,
      defaultParams: BollingerBandsIndicator.defaultParams,
    },
    {
      value: "channels",
      label: ChannelsIndicator.indicatorName,
      configurable: true,
      defaultParams: ChannelsIndicator.defaultParams,
    },
    {
      value: "fibonacci",
      label: FibonacciIndicator.indicatorName,
      configurable: true,
      defaultParams: FibonacciIndicator.defaultParams,
    },
    {
      value: "elliottWave",
      label: ElliottWaveIndicator.indicatorName,
      configurable: true,
      defaultParams: ElliottWaveIndicator.defaultParams,
    },
    {
      value: "squeezeMomentum",
      label: SqueezeMomentumIndicator.indicatorName,
      configurable: true,
      defaultParams: SqueezeMomentumIndicator.defaultParams,
    },
    {
      value: "parabolicSar",
      label: ParabolicSARIndicator.indicatorName,
      configurable: true,
      defaultParams: ParabolicSARIndicator.defaultParams,
    },
    {
      value: "donchian",
      label: DonchianChannelsIndicator.indicatorName,
      configurable: true,
      defaultParams: DonchianChannelsIndicator.defaultParams,
    },
    {
      value: "rsi",
      label: RSIIndicator.indicatorName,
      configurable: true,
      defaultParams: RSIIndicator.defaultParams,
    },
    {
      value: "stochastic",
      label: StochasticIndicator.indicatorName,
      configurable: true,
      defaultParams: StochasticIndicator.defaultParams,
    },
  ];

  const filteredIndicators = indicators.filter((indicator) =>
    indicator.label.toLowerCase().includes(indicatorSearchQuery.toLowerCase())
  );

  useEffect(() => {
    if (symbolSearchQuery) {
      const results = searchStocks(symbolSearchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [symbolSearchQuery]);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange?.(symbol);
    setIsSearchOpen(false);
    setSymbolSearchQuery("");
  };

  const handleIndicatorSelect = (
    indicator: (typeof indicators)[0],
    checked: boolean
  ) => {
    if (checked && indicator.configurable) {
      console.log("Opening config dialog for indicator:", indicator.label);
      console.log(
        "Default params:",
        JSON.stringify(indicator.defaultParams, null, 2)
      );

      // Make sure we're passing the correct defaultParams
      setConfigDialog({
        open: true,
        indicator: {
          ...indicator,
          // Ensure defaultParams is not undefined
          defaultParams: indicator.defaultParams || [],
        },
      });
    } else {
      onIndicatorChange?.(indicator.value, checked);
    }
  };

  const handleConfigSave = (params: Record<string, any>) => {
    if (configDialog.indicator) {
      onIndicatorChange?.(configDialog.indicator.value, true);
      onIndicatorConfigChange?.(configDialog.indicator.value, params);
    }
  };

  const handleChartTypeChange = (chartType: ChartType) => {
    onChartTypeChange?.(chartType);
  };

  // FIXED: This is the key function that needs to be fixed
  const handleToolSelect = useCallback(
    (tool: DrawingTool) => {
      console.log(`ChartToolbar: Tool selected: ${tool}`);

      // Log the current state of onToolSelect
      console.log(
        `ChartToolbar: onToolSelect prop is ${
          onToolSelect ? "defined" : "undefined"
        }`
      );

      // Directly call the parent's onToolSelect prop
      if (onToolSelect) {
        console.log(
          `ChartToolbar: Calling parent onToolSelect with tool: ${tool}`
        );
        try {
          onToolSelect(tool);
          console.log("ChartToolbar: onToolSelect called successfully");
        } catch (error) {
          console.error("ChartToolbar: Error calling onToolSelect:", error);
        }
      } else {
        console.warn("ChartToolbar: onToolSelect prop is not defined");
      }

      // For debugging, set the data attribute
      const chartToolbarElement = document.querySelector(
        '[data-component="chart-toolbar"]'
      );
      if (chartToolbarElement) {
        chartToolbarElement.setAttribute("data-selected-tool", tool);
        console.log(
          `ChartToolbar: Updated data-selected-tool attribute to: ${tool}`
        );
      }
    },
    [onToolSelect]
  );

  useEffect(() => {
    console.log("ChartToolbar: Setting up event bus subscription");

    const unsubscribe = eventBus.subscribe(
      "toolSelected",
      (tool: DrawingTool) => {
        console.log(
          `ChartToolbar: Received tool selection event for tool: ${tool}`
        );
        handleToolSelect(tool);
      }
    );

    return () => {
      console.log("ChartToolbar: Cleaning up event bus subscription");
      unsubscribe();
    };
  }, [handleToolSelect]);

  return (
    <>
      <div
        className={`flex items-center gap-2 p-2 border-b ${className}`}
        data-component="chart-toolbar"
        data-selected-tool={selectedTool}
      >
        {/* Removed DrawingToolbar component from here */}
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
            <PopoverContent
              className="w-[400px] p-0"
              align="start"
              side="bottom"
              alignOffset={0}
              sideOffset={8}
            >
              <Command>
                <CommandInput
                  placeholder="Search symbols..."
                  value={symbolSearchQuery}
                  onValueChange={setSymbolSearchQuery}
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
                          <span className="text-sm text-muted-foreground">
                            {stock.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {stock.sector}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onResetChart}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onFullScreen}
        >
          <BarChart3 className="h-4 w-4" />
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
          <Button
            variant={chartType === "line" ? "secondary" : "ghost"}
            onClick={() => handleChartTypeChange("line")}
            className="h-8 px-2 text-xs"
          >
            Line
          </Button>
          <Button
            variant={chartType === "bar" ? "secondary" : "ghost"}
            onClick={() => handleChartTypeChange("bar")}
            className="h-8 px-2 text-xs"
          >
            Bar
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
                value={indicatorSearchQuery}
                onChange={(e) => setIndicatorSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <DropdownMenuSeparator />
            {filteredIndicators.map((indicator) => (
              <DropdownMenuCheckboxItem
                key={indicator.value}
                checked={selectedIndicators.includes(indicator.value)}
                onCheckedChange={(checked) =>
                  handleIndicatorSelect(indicator, checked)
                }
              >
                {indicator.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-4 w-px bg-border" />
        <Button
          variant={darkMode ? "default" : "ghost"}
          onClick={() => setDarkMode?.(!darkMode)}
          className="h-8 px-2 text-xs"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onAddIndicator}>
          Add Indicator
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleSettings}>
          Settings
        </Button>
      </div>

      {configDialog.indicator && (
        <>
          {console.log(
            "Rendering IndicatorConfigDialog with params:",
            JSON.stringify(configDialog.indicator?.defaultParams, null, 2)
          )}
          <IndicatorConfigDialog
            isOpen={configDialog.open}
            onClose={() => setConfigDialog({ open: false })}
            title={configDialog.indicator?.label}
            parameters={configDialog.indicator?.defaultParams || []}
            onSave={handleConfigSave}
          />
        </>
      )}
    </>
  );
}

export default ChartToolbar;
