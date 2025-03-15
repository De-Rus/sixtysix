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

import { generateChartConfig, generateChartLayout } from "@/utils/chart/layout";
import { generateData } from "@/utils/mock";
import { indicatorRegistry } from "@/utils/indicators/registry";

import { Button } from "@/components/ui/button";
import {
  Pencil,
  PenLineIcon as StraightLine,
  Square,
  Circle,
  Eraser,
  Trash2,
  MousePointer,
} from "lucide-react";

interface DrawingToolbarProps {
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;
  clearCanvas: () => void;
}

export function DrawingToolbar2({
  currentTool,
  setCurrentTool,
  clearCanvas,
}: DrawingToolbarProps) {
  const tools = [
    { id: "cursor", icon: MousePointer, label: "Cursor" },
    { id: "line", icon: StraightLine, label: "Line" },
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-1 mr-4">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? "default" : "outline"}
            size="icon"
            onClick={() => setCurrentTool(tool.id)}
            title={tool.label}
            className="h-8 w-8"
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={clearCanvas}
        title="Clear All"
        className="h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
interface Point {
  x: number | string;
  y: number;
}

interface Drawing {
  type: string;
  points: Point[];
  color: string;
  width: number;
}

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
  // const [isDrawing, setIsDrawing] = useState(false);
  // const [startPoint, setStartPoint] = useState<{ x: string; y: number } | null>(
  //   null
  // );
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
  // const handleMouseMove = useCallback(
  //   (event: any) => {
  //     // Extract point from event
  //     const point = extractPointFromEvent(event);
  //     if (!point) return;

  //     // Always update current mouse position
  //     setCurrentMousePosition(point);
  //     handlePlotEvent(event);
  //     console.log(`Mouse moved to:`, point);
  //   },
  //   [extractPointFromEvent, handlePlotEvent]
  // );

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing.current || !currentTool || currentTool === "cursor") return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Get the Plotly layout and yaxis
    const plotlyNode = plotRef.current;
    if (!plotlyNode || !plotlyNode.el) return;

    const layout = plotlyNode.el._fullLayout;
    const yaxis = layout.yaxis;

    // Convert to data coordinates
    const dataPoint = {
      x: canvasToData(canvasX, canvasY).x,
      y: yaxis.p2d(canvasY), // Use direct canvas Y coordinate
    };

    if (currentTool === "line") {
      tempPoints.current = [dataPoint];
    }

    redrawCanvas();
    e.preventDefault();
  };

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

  // Begin test
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentTool, setCurrentTool] = useState<string | null>("cursor");

  // Drawing state
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const drawings = useRef<Drawing[]>([]);
  const tempPoints = useRef<Point[]>([]);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Get the plot area bounds (excluding margins)
  const getPlotArea = () => {
    if (!plotRef.current) return { left: 0, top: 0, width: 0, height: 0 };

    try {
      const plotlyNode = plotRef.current;
      const layout = plotlyNode.el._fullLayout;

      return {
        left: layout.margin.l,
        top: layout.margin.t,
        width: layout.width - layout.margin.l - layout.margin.r,
        height: layout.height - layout.margin.t - layout.margin.b,
      };
    } catch (error) {
      console.error("Error getting plot area:", error);
      return { left: 0, top: 0, width: 0, height: 0 };
    }
  };

  // Convert canvas coordinates to data coordinates
  // const canvasToData = (canvasX: number, canvasY: number): Point => {
  //   if (!plotRef.current) return { x: 0, y: 0 };

  //   try {
  //     const plotlyNode = plotRef.current;
  //     const layout = plotlyNode.el._fullLayout;
  //     const xaxis = layout.xaxis;
  //     const yaxis = layout.yaxis;
  //     const plotArea = getPlotArea();

  //     // For y-axis, calculate directly from the range
  //     const yrange = yaxis.range;
  //     const relY = (canvasY - plotArea.top) / plotArea.height;
  //     const yInDataCoord = yrange[1] - relY * (yrange[1] - yrange[0]);

  //     // For x-axis, calculate from the range
  //     const xrange = xaxis.range;
  //     const relX = (canvasX - plotArea.left) / plotArea.width;

  //     // Get the current visible x-range as timestamps
  //     const xmin = new Date(xrange[0]).getTime();
  //     const xmax = new Date(xrange[1]).getTime();

  //     // Calculate the timestamp at this position
  //     const timestamp = xmin + relX * (xmax - xmin);

  //     // Format as ISO string for consistency
  //     const xValue = new Date(timestamp).toISOString();

  //     return { x: xValue, y: yInDataCoord };
  //   } catch (error) {
  //     console.error("Error in canvasToData:", error);
  //     return { x: 0, y: 0 };
  //   }
  // };
  const canvasToData = (canvasX: number, canvasY: number): Point => {
    if (!plotRef.current) return { x: 0, y: 0 };

    try {
      const plotlyNode = plotRef.current;
      const layout = plotlyNode.el._fullLayout;
      const xaxis = layout.xaxis;
      const yaxis = layout.yaxis;
      const plotArea = getPlotArea();

      // For y-axis, use Plotly's built-in conversion
      let yInDataCoord;
      try {
        // Convert pixel to data coordinates using Plotly's p2d function
        yInDataCoord = yaxis.p2d(canvasY);
      } catch (e) {
        // Fallback to manual calculation if p2d fails
        const yrange = yaxis.range;
        const relY = (canvasY - plotArea.top) / plotArea.height;
        yInDataCoord = yrange[1] - relY * (yrange[1] - yrange[0]);
      }

      // X-axis calculation remains the same
      const xrange = xaxis.range;
      const relX = (canvasX - plotArea.left) / plotArea.width;
      const xmin = new Date(xrange[0]).getTime();
      const xmax = new Date(xrange[1]).getTime();
      const timestamp = xmin + relX * (xmax - xmin);
      const xValue = new Date(timestamp).toISOString();

      return { x: xValue, y: yInDataCoord };
    } catch (error) {
      console.error("Error in canvasToData:", error);
      return { x: 0, y: 0 };
    }
  };

  // Draw a line on the canvas
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    width: number
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  // Redraw all drawings
  // Redraw all drawings
  const redrawCanvas = () => {
    if (!canvasRef.current || !plotRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current plot area and axes
    const plotArea = getPlotArea();
    const layout = plotRef.current.el._fullLayout;
    const xaxis = layout.xaxis;
    const yaxis = layout.yaxis;

    // Get current ranges
    const xrange = xaxis.range;
    const yrange = yaxis.range;

    // Convert ranges to timestamps for x-axis
    const xmin = new Date(xrange[0]).getTime();
    const xmax = new Date(xrange[1]).getTime();

    // Redraw all saved drawings
    drawings.current.forEach((drawing, index) => {
      try {
        if (drawing.type === "line" && drawing.points.length >= 2) {
          // Use Plotly's direct conversion for both points
          const x1Time = new Date(drawing.points[0].x as string).getTime();
          const x2Time = new Date(drawing.points[1].x as string).getTime();

          const x1 =
            plotArea.left + ((x1Time - xmin) / (xmax - xmin)) * plotArea.width;
          const x2 =
            plotArea.left + ((x2Time - xmin) / (xmax - xmin)) * plotArea.width;

          const y1 = yaxis.d2p(drawing.points[0].y);
          const y2 = yaxis.d2p(drawing.points[1].y);

          // Draw the line
          drawLine(ctx, x1, y1, x2, y2, drawing.color, drawing.width);
        } else if (drawing.type === "pencil" && drawing.points.length >= 2) {
          ctx.beginPath();
          ctx.strokeStyle = drawing.color;
          ctx.lineWidth = drawing.width;
          ctx.lineCap = "round";

          // Process each point using direct Plotly conversion
          for (let i = 0; i < drawing.points.length; i++) {
            const point = drawing.points[i];
            const xTime = new Date(point.x as string).getTime();
            const x =
              plotArea.left + ((xTime - xmin) / (xmax - xmin)) * plotArea.width;
            const y = yaxis.d2p(point.y);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        }
      } catch (error) {
        console.error(`Error redrawing drawing ${index}:`, error);
      }
    });

    // Draw temporary points for ongoing drawing
    if (
      isDrawing.current &&
      startPoint.current &&
      tempPoints.current.length > 0
    ) {
      try {
        if (currentTool === "line") {
          // Get canvas coordinates for start point
          const startX =
            plotArea.left +
            ((new Date(startPoint.current.x as string).getTime() - xmin) /
              (xmax - xmin)) *
              plotArea.width;
          const startY = yaxis.d2p(startPoint.current.y);

          // Get canvas coordinates for end point
          const endX =
            plotArea.left +
            ((new Date(tempPoints.current[0].x as string).getTime() - xmin) /
              (xmax - xmin)) *
              plotArea.width;
          const endY = yaxis.d2p(tempPoints.current[0].y);

          // Draw the line directly using canvas coordinates
          drawLine(ctx, startX, startY, endX, endY, "#FFCC00", 2);
        } else if (currentTool === "pencil" && tempPoints.current.length >= 2) {
          ctx.beginPath();
          ctx.strokeStyle = "#FFCC00";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";

          // Process each point using direct Plotly conversion
          for (let i = 0; i < tempPoints.current.length; i++) {
            const point = tempPoints.current[i];
            const xTime = new Date(point.x as string).getTime();
            const x =
              plotArea.left + ((xTime - xmin) / (xmax - xmin)) * plotArea.width;
            const y = yaxis.d2p(point.y);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        }
      } catch (error) {
        console.error("Error drawing temporary points:", error);
      }
    }
  };

  // Modify the syncCanvasWithPlot function to include a small delay
  // to ensure layout is fully updated
  // Sync canvas with plot
  const syncCanvasWithPlot = () => {
    if (!canvasRef.current || !plotRef.current) return;

    try {
      const canvas = canvasRef.current;
      const plotlyNode = plotRef.current;

      if (plotlyNode && plotlyNode.el) {
        const layout = plotlyNode.el._fullLayout;

        // Set canvas dimensions to match plot
        canvas.width = layout.width;
        canvas.height = layout.height;

        // Redraw canvas
        redrawCanvas();
      }
    } catch (error) {
      console.error("Error syncing canvas:", error);
    }
  };

  // Plotly event handlers
  const handlePlotInitialized = () => {
    console.log("Plot initialized");
    syncCanvasWithPlot();

    // Add event listener for continuous panning/zooming
    if (plotRef.current && plotRef.current.el) {
      plotRef.current.el.on("plotly_relayouting", () => {
        redrawCanvas();
      });
    }
  };

  const handlePlotResize = () => {
    console.log("Plot resized");
    syncCanvasWithPlot();
  };

  // Update the handlePlotRelayout function to ensure consistent redrawing
  const handlePlotRelayout = (eventData: any) => {
    console.log("Plot relayout");

    // Add a small delay to ensure the chart has fully updated
    requestAnimationFrame(() => {
      syncCanvasWithPlot();
    });
  };

  const handleMouseDownRef = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUpRef = useRef<(e: MouseEvent) => void>(() => {});

  // Direct DOM event handlers for drawing
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      if (!currentTool || currentTool === "cursor") return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Get the Plotly layout
      const plotlyNode = plotRef.current;
      if (!plotlyNode || !plotlyNode.el) return;

      // Convert to data coordinates directly using Plotly's conversion
      const dataPoint = canvasToData(canvasX, canvasY);

      console.log(
        "Mouse down at canvas:",
        canvasX,
        canvasY,
        "data:",
        dataPoint
      );

      isDrawing.current = true;
      startPoint.current = dataPoint;
      tempPoints.current = [dataPoint];

      e.preventDefault();
      redrawCanvas();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current || !currentTool || currentTool === "cursor")
        return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Convert to data coordinates directly
      const dataPoint = canvasToData(canvasX, canvasY);

      if (currentTool === "pencil") {
        tempPoints.current.push(dataPoint);
      } else if (currentTool === "line") {
        tempPoints.current = [dataPoint];
      }

      // Redraw
      redrawCanvas();
      e.preventDefault();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (
        !isDrawing.current ||
        !currentTool ||
        currentTool === "cursor" ||
        !startPoint.current
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Convert to data coordinates
      const dataPoint = canvasToData(canvasX, canvasY);

      console.log("Mouse up at canvas:", canvasX, canvasY, "data:", dataPoint);
      setDebugInfo(
        `Mouse up at canvas: (${canvasX.toFixed(0)}, ${canvasY.toFixed(
          0
        )}), data: (${dataPoint.x}, ${dataPoint.y.toFixed(2)})`
      );

      // Save drawing
      if (currentTool === "line") {
        drawings.current.push({
          type: "line",
          points: [startPoint.current, dataPoint],
          color: "#FFCC00",
          width: 2,
        });
        console.log(
          "Line saved:",
          drawings.current[drawings.current.length - 1]
        );
      } else if (currentTool === "pencil" && tempPoints.current.length > 1) {
        drawings.current.push({
          type: "pencil",
          points: [...tempPoints.current],
          color: "#FFCC00",
          width: 2,
        });
        console.log(
          "Pencil drawing saved with",
          tempPoints.current.length,
          "points"
        );
      }

      // Reset state
      isDrawing.current = false;
      startPoint.current = null;
      tempPoints.current = [];

      // Redraw canvas
      redrawCanvas();

      // Prevent default
      e.preventDefault();
    };

    // Add wheel event listener to prevent interference with chart zooming
    const handleWheel = (e: WheelEvent) => {
      if (currentTool !== "cursor") {
        // Don't prevent default - let the event bubble to the chart
        // This allows zooming with the wheel even when a drawing tool is selected
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: true });

    // Add event listeners directly to the canvas
    handleMouseDownRef.current = handleMouseDown;
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;

    if (currentTool && currentTool !== "cursor") {
      canvas.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mousemove", handleMouseMove); // Keep this on document for better tracking
      document.addEventListener("mouseup", handleMouseUp); // Keep this on document for better tracking
    }

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDownRef.current);
      document.removeEventListener("mousemove", handleMouseMoveRef.current);
      document.removeEventListener("mouseup", handleMouseUpRef.current);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [currentTool]);

  const clearCanvas = () => {
    drawings.current = [];
    redrawCanvas();
    // setDebugInfo("Canvas cleared");
  };

  const handlePlotZoom = (eventData: any) => {
    console.log("Plot zoom");

    // Force autorange after zoom if the range looks unreasonable
    if (plotRef.current && plotRef.current.el) {
      const layout = plotRef.current.el._fullLayout;
      const yaxis = layout.yaxis;

      // Check if the y-range has gone to unreasonable values
      if (yaxis.range && (yaxis.range[0] < -100 || yaxis.range[1] > 1000)) {
        // Reset to autorange
        const update = {
          "yaxis.autorange": true,
        };

        // Update the plot with a small delay
        setTimeout(() => {
          if (plotRef.current && plotRef.current.el) {
            plotRef.current.el.relayout(update);
          }
        }, 100);
      }
    }

    // Sync canvas after zoom
    requestAnimationFrame(() => {
      syncCanvasWithPlot();
    });
  };

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

        <DrawingToolbar2
          currentTool={currentTool}
          setCurrentTool={(tool) => {
            // Store the previous tool
            const prevTool = currentTool;

            // Update the current tool
            setCurrentTool(tool);
            setDebugInfo(`Tool changed to: ${tool}`);

            // If we're switching between cursor and drawing mode, force a relayout
            if (
              (prevTool === "cursor" && tool !== "cursor") ||
              (prevTool !== "cursor" && tool === "cursor")
            ) {
              // Add a small delay to allow the chart to update
              setTimeout(() => {
                // Force a redraw of the canvas
                if (plotRef.current && plotRef.current.el) {
                  syncCanvasWithPlot();
                }
              }, 50);
            } else {
              // Just sync the canvas
              syncCanvasWithPlot();
            }
          }}
          clearCanvas={clearCanvas}
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
                  // onInitialized={handlePlotInitialized}
                  // onRelayout={handlePlotRelayout}
                  // onResize={handlePlotResize}
                  // onAfterPlot={syncCanvasWithPlot}
                  // onUpdate={handlePlotZoom}
                  // useResizeHandler
                  onInitialized={handlePlotInitialized}
                  onRelayout={handlePlotRelayout}
                  onResize={handlePlotResize}
                  onAfterPlot={syncCanvasWithPlot}
                  onUpdate={handlePlotZoom}
                  useResizeHandler
                  onClick={handleClick}
                  // onClick={() => console.log("click")}
                  // onMouseMove={handleMouseMove}
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
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 z-10"
                  style={{
                    pointerEvents: currentTool === "cursor" ? "none" : "all",
                    cursor: currentTool === "cursor" ? "default" : "crosshair",
                  }}
                />
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
