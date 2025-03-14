"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchStocks, type StockSymbol } from "@/mocks/mock-stocks";
import { BarChart3, ChevronDown, LineChart, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IndicatorConfigDialog } from "../indicator-config-dialog";
import {
  IndicatorConstructor,
  indicatorRegistry,
} from "@/utils/indicators/registry";

interface ChartToolbarProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  selectedIndicators: string[];
  onIndicatorChange: (indicator: string, checked: boolean) => void;
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  onIndicatorConfigChange: (
    indicator: string,
    config: Record<string, any>
  ) => void;
  configureIndicator?: string | null;
  onConfigureIndicator?: (indicator: string | null) => void;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSymbol[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    indicator?: (typeof indicators)[0];
  }>({ open: false });

  const [configDialogState, setConfigDialogState] = useState<{
    isOpen: boolean;
    indicator: string | null;
  }>({ isOpen: false, indicator: null });

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
    console.log("Toolbar: timeframe clicked:", timeframe);
    onTimeframeChange?.(timeframe);
  };

  // Replace the static indicators array with dynamic generation from registry
  const indicators = indicatorRegistry
    .getRegisteredIndicators()
    .map((id) => ({
      id,
      indicator: indicatorRegistry.get(id) as IndicatorConstructor,
    }))
    .filter(({ indicator }) => !!indicator)
    .map(
      ({ id, indicator }: { id: string; indicator: IndicatorConstructor }) => {
        return {
          value: id,
          // @ts-ignore
          label: indicator.indicatorName,
          configurable: true,
          // @ts-ignore
          defaultParams: indicator.defaultParams || [],
        };
      }
    )
    .filter(Boolean);

  const filteredIndicators = indicators.filter((indicator) => {
    if (!indicator) return false;
    if (!searchQuery) return true;
    return indicator.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    if (searchQuery) {
      const results = searchStocks(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange?.(symbol);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleIndicatorSelect = (
    indicator: (typeof indicators)[0],
    checked: boolean
  ) => {
    if (!indicator) return;

    if (checked && indicator.configurable) {
      // Get fresh default parameters from registry
      const IndicatorClass = indicatorRegistry.get(indicator.value);
      if (!IndicatorClass) return;

      setConfigDialog({
        open: true,
        indicator: {
          ...indicator,
          // @ts-ignore - we know these properties exist
          defaultParams: IndicatorClass.defaultParams || [],
        },
      });
    } else {
      // If unchecking or not configurable, directly update
      onIndicatorChange?.(indicator.value, checked);
    }
  };

  // const handleConfigSave = (params: Record<string, any>) => {
  //   if (configDialog.indicator) {
  //     onIndicatorChange?.(configDialog.indicator.value, true);
  //     onIndicatorConfigChange?.(configDialog.indicator.value, params);
  //   }
  // };

  useEffect(() => {
    if (configureIndicator) {
      const indicator = indicators.find(
        (ind) => ind.value === configureIndicator
      );
      if (indicator) {
        setConfigDialog({
          open: true,
          indicator,
        });
      }
      // Reset the configureIndicator state after opening the dialog
      if (onConfigureIndicator) {
        onConfigureIndicator(null);
      }
    }
  }, [configureIndicator, onConfigureIndicator, indicators]);

  // Remove the unused configDialogState
  // const [configDialogState, setConfigDialogState] = useState<{...}>({...});

  const handleConfigSave = (params: Record<string, any>) => {
    if (configDialog.indicator) {
      const indicatorValue = configDialog.indicator.value;
      onIndicatorConfigChange?.(indicatorValue, params);

      // Only trigger indicator change if it's not already selected
      if (!selectedIndicators.includes(indicatorValue)) {
        onIndicatorChange?.(indicatorValue, true);
      }

      setConfigDialog({ open: false });
    }
  };

  useEffect(() => {
    if (configureIndicator) {
      setConfigDialogState({
        isOpen: true,
        indicator: configureIndicator,
      });
      // Reset the configureIndicator state after opening the dialog
      if (onConfigureIndicator) {
        onConfigureIndicator(null);
      }
    }
  }, [configureIndicator, onConfigureIndicator]);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 gap-1 px-2 text-xs ml-auto"
            >
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
                onCheckedChange={(checked) =>
                  handleIndicatorSelect(indicator, checked)
                }
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
  );
}

export default ChartToolbar;
