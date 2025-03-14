"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ChartProps, DataPoint } from "../../types/chart-types";
import { ChartToolbar } from "./chart-toolbar";
import { mockStocks } from "@/mocks/mock-stocks";
import type { Order, Position } from "@/types/trading-types";
import { OrderContextMenu } from "../trading/order-context-menu";
import { getAxisRange, getMouseEventData } from "@/utils/chart/chart-utils";
import { useSubplotHeights, useSubplotRanges } from "@/hooks/use-subplots";
import { generatePlotData } from "@/utils/chart/indicators";
import { ChartDragZone } from "./chart-drag-zone";
import { Legend } from "@/components/chart/custom-legend";

// Add this import at the top of the file
import { IndicatorConfigDialog } from "../indicator-config-dialog";

// Constants for chart layout
const SUBPLOT_HEIGHT_PERCENTAGE = 0.3; // 30% of total height per subplot
const XAXIS_HEIGHT_PERCENTAGE = 0.08; // 8% height for x-axis
const MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE = 0.05; // 5% margin

declare global {
  interface Window {
    Plotly: any;
  }
}

interface CandlestickChartProps extends ChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
  orders?: Order[];
  positions?: Position[];
  onCancelPosition?: (position: Position) => void;
  onNewOrder?: (order: Order) => void;
}

const INDICATOR_CONFIGS = Object.fromEntries(
  indicatorRegistry
    .getRegisteredIndicators()
    .map((id) => {
      const IndicatorClass = indicatorRegistry.get(id);
      if (!IndicatorClass) return undefined;

      return [
        id,
        {
          label: (IndicatorClass as any).indicatorName || id,
          defaultParams: (IndicatorClass as any).defaultParams || [],
        },
      ] as const;
    })
    .filter(
      (entry): entry is [string, { label: string; defaultParams: any[] }] =>
        entry !== undefined
    )
);

import type {
  SimpleLine,
  SimpleRectangle,
  SimpleShape,
} from "@/types/shape-types";
import { generateChartConfig, generateChartLayout } from "@/utils/chart/layout";
import { generateData } from "@/utils/mock";
import { indicatorRegistry } from "@/utils/indicators/registry";

export default function CandlestickChart({
  data: initialData,
  height = 400,
  showIchimoku: initialShowIchimoku = true,
  showSMA: initialShowSMA = false,
  showEMA: initialShowEMA = false,
  darkMode = false,
  symbol: initialSymbol = "AAPL",
  orders = [],
  positions = [],
  onSymbolChange,
  onNewOrder,
}: CandlestickChartProps) {
  // State
  const [symbol, setSymbol] = useState(initialSymbol);
  const [data, setData] = useState<DataPoint[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    ...(initialShowIchimoku ? ["ichimoku"] : []),
    ...(initialShowSMA ? ["sma"] : []),
    ...(initialShowEMA ? ["ema"] : []),
  ]);
  const [timeframe, setTimeframe] = useState("15m");
  const [isLoading, setIsLoading] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  const [showChart, setShowChart] = useState(true);
  const [indicatorConfigs, setIndicatorConfigs] = useState<
    Record<string, Record<string, any>>
  >({});
  const [xAxisRange, setXAxisRange] = useState<[string, string] | null>(null);
  const [yAxisRange, setYAxisRange] = useState<[number, number] | null>(null);

  const [rightClickData, setRightClickData] = useState<{
    price: number | null;
    time: string | null;
  }>({
    price: null,
    time: null,
  });

  // Drawing state
  const [selectedTool, setSelectedTool] = useState<string>("cursor");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: string; y: number } | null>(
    null
  );
  const [endPoint, setEndPoint] = useState<{ x: string; y: number } | null>(
    null
  );
  const [currentMousePosition, setCurrentMousePosition] = useState<{
    x: string;
    y: number;
  } | null>(null);

  // Refs
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);

  // Custom hooks
  const { subplotHeights } = useSubplotHeights(selectedIndicators);
  // Calculate the total height percentage taken by subplots
  const totalSubplotPercentage =
    subplotHeights.length * SUBPLOT_HEIGHT_PERCENTAGE;

  // Calculate main chart height (remaining space after subplots, x-axis, and margin)
  const mainChartPercentage =
    subplotHeights.length > 0
      ? Math.max(
          0.1,
          1 -
            totalSubplotPercentage -
            XAXIS_HEIGHT_PERCENTAGE -
            MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE
        )
      : 1 - XAXIS_HEIGHT_PERCENTAGE - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE;

  // Convert to domain values (0-1 range)
  const mainChartDomainStart = 1 - mainChartPercentage;
  const mainChartDomainEnd = 1;
  const mainChartBottomMarginStart =
    mainChartDomainStart - MAIN_CHART_BOTTOM_MARGIN_PERCENTAGE;

  // Function to update chart data
  const updateChartData = useCallback(
    async (newTimeframe: string) => {
      setIsLoading(true);
      setShowChart(false);

      try {
        // Generate new data
        const newData = generateData(500, newTimeframe, symbol);
        const { yaxis } = getAxisRange(newData);
        setYAxisRange(yaxis.range);

        // Force a complete remount of the chart
        setChartKey(Date.now());

        // Update data in the next tick to ensure clean state
        setTimeout(() => {
          setData(newData);
          setShowChart(true);
        }, 0);
      } finally {
        setIsLoading(false);
      }
    },
    [symbol]
  );

  // Handle timeframe changes
  const handleTimeframeChange = useCallback(
    (newTimeframe: string) => {
      setTimeframe(newTimeframe);
      updateChartData(newTimeframe);
    },
    [updateChartData]
  );

  // Initial data load
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    } else {
      // Generate sample data for demonstration
      const sampleData = generateData(500);
      setData(sampleData);
    }
  }, [initialData]);

  // Update xAxisRange and yAxisRange when data changes
  useEffect(() => {
    if (data.length) {
      const { xaxis, yaxis } = getAxisRange(data);
      setXAxisRange(xaxis.range);
      setYAxisRange(yaxis.range);
    }
  }, [data]);

  // Chart interaction handlers
  const handlePlotEvent = useCallback((event: any) => {
    // Only process if we have valid event data
    if (!event || (!event.points && !event.event)) {
      return;
    }

    const eventData = getMouseEventData(event, chartRef.current);
    if (eventData.price !== null && eventData.time !== null) {
      setRightClickData(eventData);
    }
  }, []);

  // Update the symbol handler
  const handleSymbolChange = useCallback(
    (newSymbol: string) => {
      setSymbol(newSymbol);
      onSymbolChange?.(newSymbol);
      updateChartData(timeframe);
    },
    [timeframe, onSymbolChange, updateChartData]
  );

  // Add this function to the component
  const synchronizeAxes = useCallback(() => {
    const plotElement = document.getElementById("plot-container");
    if (!plotElement || !window.Plotly) return;

    try {
      const gd = plotElement as any;
      if (!gd._fullLayout) return;

      // Get the main x-axis range
      const mainRange = gd._fullLayout.xaxis.range;

      // Check if we have any subplot axes
      const subplotAxes = Object.keys(gd._fullLayout).filter(
        (key) => key.startsWith("xaxis") && key !== "xaxis"
      );

      // If any subplot axis has a different range, synchronize them
      let needsUpdate = false;
      const update: any = {};

      subplotAxes.forEach((axisKey) => {
        const subplotRange = gd._fullLayout[axisKey].range;
        if (
          subplotRange[0] !== mainRange[0] ||
          subplotRange[1] !== mainRange[1]
        ) {
          update[`${axisKey}.range`] = mainRange;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        window.Plotly.relayout(plotElement, update);
      }
    } catch (error) {
      console.error("Error synchronizing axes:", error);
    }
  }, []);

  // Add an effect to call this function periodically
  useEffect(() => {
    // Synchronize axes on mount
    synchronizeAxes();

    // Set up an interval to check and synchronize axes
    const intervalId = setInterval(synchronizeAxes, 1000);

    return () => clearInterval(intervalId);
  }, [synchronizeAxes]);

  // Add cursor style for better UX
  useEffect(() => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    // Remove all cursor classes first
    chartElement.classList.remove("cursor-grab", "cursor-crosshair");

    // Add appropriate cursor class based on selected tool
    if (["line", "horizontal", "rectangle"].includes(selectedTool)) {
      chartElement.classList.add("cursor-crosshair");
    } else {
      chartElement.classList.add("cursor-grab");
    }

    return () => {
      chartElement.classList.remove("cursor-grab", "cursor-crosshair");
    };
  }, [selectedTool]);

  // Add keyboard event listener for Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawing) {
        console.log("Canceling drawing (Escape key)");
        setIsDrawing(false);
        setStartPoint(null);
        setEndPoint(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawing]);

  // Function to extract point from event
  const extractPointFromEvent = useCallback((event: any) => {
    if (!event || !event.points || event.points.length === 0) {
      return null;
    }

    try {
      const point = event.points[0];

      // Make sure we have valid x and y values
      if (!point || point.x === undefined || point.y === undefined) {
        console.error("Invalid point data in event:", point);
        return null;
      }

      // For candlestick charts, we need to handle the point differently
      // to get the exact position where the user clicked
      const x = point.x;

      // Use the exact y-coordinate from the mouse position if available
      // This gives more precise positioning
      let y = point.y;
      if (event.event && point.yaxis) {
        try {
          // Convert pixel to data coordinates for more accuracy
          y = point.yaxis.p2d(event.event.offsetY);
        } catch (e) {
          console.warn("Could not convert y pixel to data:", e);
        }
      }

      return { x, y };
    } catch (error) {
      console.error("Error extracting point from event:", error);
      return null;
    }
  }, []);

  // Handle mouse move for drawing
  const handleMouseMove = useCallback(
    (event: any) => {
      // Extract point from event
      const point = extractPointFromEvent(event);
      if (!point) return;

      // Always update current mouse position
      setCurrentMousePosition(point);
      handlePlotEvent(event);
      console.log(`Mouse moved to:`, point);
    },
    [extractPointFromEvent, handlePlotEvent]
  );

  // // Handle click for drawing
  const handleClick = useCallback(
    (event: any) => {
      const point = extractPointFromEvent(event);
      if (!point) return;

      console.log(`Clicked at:`, point);
      handlePlotEvent(event);
    },
    [extractPointFromEvent, handlePlotEvent]
  );

  // Add event listener for relayout events to keep subplot axes in sync
  useEffect(() => {
    const plotElement = document.getElementById("plot-container") as any;
    if (!plotElement || !window.Plotly) return;

    // Function to handle relayout events
    const handleRelayout = (eventData: any) => {
      // Check if the event is changing x-axis range
      if (
        eventData["xaxis.range[0]"] ||
        eventData["xaxis.range[1]"] ||
        eventData["xaxis.range"]
      ) {
        // Synchronize all subplot x-axes with the main x-axis
        synchronizeAxes();
      }
    };

    // Add the event listener
    if (plotElement.on) {
      plotElement.on("plotly_relayout", handleRelayout);
    }

    return () => {
      // Remove the event listener
      if (plotElement.removeAllListeners) {
        plotElement.removeAllListeners("plotly_relayout");
      }
    };
  }, [synchronizeAxes]);

  // Handle removing an indicator from the legend
  const handleRemoveIndicator = useCallback((indicator: string) => {
    setSelectedIndicators((prev) => prev.filter((i) => i !== indicator));
  }, []);

  // Add a new state to track which indicator is being configured
  const [configureIndicator, setConfigureIndicator] = useState<string | null>(
    null
  );

  // Add a function to handle opening the configuration dialog
  const handleConfigureIndicator = useCallback(
    (indicator: string) => {
      console.log("Opening configuration for indicator:", indicator);

      // Get the current configuration for this indicator
      const currentConfig = indicatorConfigs[indicator] || {};

      // Get the indicator configuration definition
      const indicatorConfig =
        INDICATOR_CONFIGS[indicator as keyof typeof INDICATOR_CONFIGS];

      if (indicatorConfig) {
        // Set the dialog state with the indicator configuration
        setConfigDialog({
          open: true,
          indicator: {
            value: indicator,
            label: indicatorConfig.label,
            configurable: true,
            defaultParams: indicatorConfig.defaultParams.map((param) => ({
              ...param,
              value:
                currentConfig[param.name] !== undefined
                  ? currentConfig[param.name]
                  : param.value,
            })),
          },
        });
      }
    },
    [indicatorConfigs]
  );

  // Add a new state for the configuration dialog
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    indicator?: {
      value: string;
      label: string;
      configurable: boolean;
      defaultParams: any[];
    };
  }>({ open: false });

  // Handle saving indicator configuration
  const handleConfigSave = useCallback(
    (params: Record<string, any>) => {
      if (configDialog.indicator) {
        console.log(
          "Saving configuration for indicator:",
          configDialog.indicator.value,
          params
        );

        if (!configDialog?.indicator?.value) {
          console.error("Indicator value is not defined");
          return;
        }

        // Update the indicator configuration
        setIndicatorConfigs((prev) => ({
          ...prev,
          [configDialog.indicator!.value]: params,
        }));

        // Force a chart update by updating the chart key
        setChartKey(Date.now());

        // Close the dialog
        setConfigDialog({ open: false });
      }
    },
    [configDialog]
  );

  // Update chart when indicator configurations change
  useEffect(() => {
    if (Object.keys(indicatorConfigs).length > 0 && data.length > 0) {
      // Force a chart update when indicator configurations change
      setChartKey(Date.now());
    }
  }, [indicatorConfigs, data.length]);

  return (
    <Card className={`w-full ${darkMode ? "dark bg-gray-900 text-white" : ""}`}>
      <CardHeader className="p-0">
        <ChartToolbar
          selectedTimeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          selectedIndicators={selectedIndicators}
          onIndicatorChange={(indicator, checked) => {
            setSelectedIndicators((prev) =>
              checked
                ? [...prev, indicator]
                : prev.filter((i) => i !== indicator)
            );
          }}
          selectedSymbol={symbol}
          onSymbolChange={handleSymbolChange}
          onIndicatorConfigChange={(indicator, config) => {
            setIndicatorConfigs((prev) => ({
              ...prev,
              [indicator]: config,
            }));
          }}
          configureIndicator={configureIndicator}
          onConfigureIndicator={setConfigureIndicator}
        />
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="p-2 border-b">
          <h2 className="text-lg font-semibold">
            {symbol} - {mockStocks.find((s) => s.symbol === symbol)?.name}
          </h2>
        </div>
        <div
          className={`w-full h-[${height}px] relative border-b`}
          ref={chartRef}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="animate-pulse">Loading...</div>
            </div>
          )}
          {showChart && (
            <>
              {/* Custom Legend */}
              <Legend
                indicatorConfigs={indicatorConfigs}
                onConfigureIndicator={handleConfigureIndicator}
                onRemoveIndicator={handleRemoveIndicator}
                selectedIndicators={selectedIndicators}
              />

              <OrderContextMenu
                onNewOrder={onNewOrder}
                symbol={symbol}
                pointData={rightClickData}
              >
                <Plot
                  ref={plotRef}
                  key={chartKey}
                  data={generatePlotData({
                    data,
                    selectedIndicators,
                    indicatorConfigs: Object.fromEntries(
                      selectedIndicators.map((id) => [
                        id,
                        indicatorConfigs[id] ||
                          INDICATOR_CONFIGS[id]?.defaultParams.reduce(
                            (acc, param) => ({
                              ...acc,
                              [param.name]: param.value,
                            }),
                            {}
                          ),
                      ])
                    ),
                    darkMode,
                    orders,
                    positions,
                  })}
                  layout={{
                    ...generateChartLayout({
                      darkMode,
                      height,
                      yAxisRange: yAxisRange || [0, 100],
                      xAxisRange:
                        xAxisRange ||
                        (data.length
                          ? [data[0].time, data[data.length - 1].time]
                          : ["", ""]),
                      data,
                      lines: [], // Remove lines from here since we'll add shapes directly
                      activeLine: null, // Remove activeLine from here
                      subplotHeights: subplotHeights || [],
                    }),
                    // shapes: generateShapes(), // This is the key change - add shapes directly to the layout
                    showlegend: false, // Hide the default Plotly legend
                  }}
                  config={{
                    ...generateChartConfig(),
                    dragmode: selectedTool ? "select" : "pan",
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  useResizeHandler
                  onClick={handleClick}
                  // onClick={() => console.log("click")}
                  onMouseMove={handleMouseMove}
                  onRightClick={(event) => {
                    event.preventDefault();
                    handlePlotEvent(event);
                  }}
                  divId="plot-container"
                />

                {/* Drag zones container with flex-col */}
                <div className="absolute right-0 top-0 bottom-0 w-[40px] flex flex-col">
                  {/* Main chart drag zone */}
                  <ChartDragZone
                    axisKey="yaxis"
                    top="0"
                    height={`${
                      (mainChartDomainEnd - mainChartDomainStart) * 100
                    }%`}
                    zIndex={20}
                    label=""
                    color="transparent"
                  />

                  {/* Subplot drag zones in order: Y2, Y3, etc. */}
                  {subplotHeights.map((subplot, index) => {
                    const axisNumber = index + 2; // yaxis2, yaxis3, etc.
                    const axisKey = `yaxis${axisNumber}`;

                    return (
                      <ChartDragZone
                        key={subplot.id}
                        axisKey={axisKey}
                        top="0" // Not needed with flex
                        height={`${SUBPLOT_HEIGHT_PERCENTAGE * 100}%`}
                        zIndex={30}
                        className="border-t"
                        label=""
                        color="transparent"
                      />
                    );
                  })}
                </div>
              </OrderContextMenu>
            </>
          )}
        </div>
      </CardContent>
      {configDialog.indicator && (
        <IndicatorConfigDialog
          isOpen={configDialog.open}
          onClose={() => setConfigDialog({ open: false })}
          title={configDialog.indicator.label}
          parameters={configDialog.indicator.defaultParams}
          onSave={handleConfigSave}
        />
      )}
    </Card>
  );
}
