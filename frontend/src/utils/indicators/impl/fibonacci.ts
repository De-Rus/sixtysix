import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface FibonacciLevel {
  level: number;
  price: number;
  color: string;
  label: string;
}

interface FibonacciResult {
  levels: FibonacciLevel[];
  highPoint: { price: number; time: string };
  lowPoint: { price: number; time: string };
}

export class FibonacciIndicator extends Indicator {
  static readonly indicatorName = "Fibonacci Retracement";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "lookback",
      type: "number",
      label: "Lookback Period",
      value: 100,
      min: 10,
      max: 500,
      step: 10,
    },
    {
      name: "lineColor",
      type: "string",
      label: "Line Color",
      value: "rgb(234, 179, 8)",
    }, // Amber
    {
      name: "lineOpacity",
      type: "number",
      label: "Line Opacity",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
    },
    { name: "showLabels", type: "boolean", label: "Show Labels", value: true },
  ];

  private result: FibonacciResult | null = null;
  private lookback: number;
  private lineColor: string;
  private lineOpacity: number;
  private showLabels: boolean;

  // Standard Fibonacci levels
  private readonly fibLevels = [
    { level: 0, color: "rgb(34, 197, 94)" }, // Green
    { level: 0.236, color: "rgb(59, 130, 246)" }, // Blue
    { level: 0.382, color: "rgb(168, 85, 247)" }, // Purple
    { level: 0.5, color: "rgb(234, 179, 8)" }, // Amber
    { level: 0.618, color: "rgb(249, 115, 22)" }, // Orange
    { level: 0.786, color: "rgb(239, 68, 68)" }, // Red
    { level: 1, color: "rgb(239, 68, 68)" }, // Red
  ];

  constructor(
    data: DataPoint[],
    lookback = 100,
    lineColor = "rgb(234, 179, 8)",
    lineOpacity = 0.5,
    showLabels = true
  ) {
    super(data);
    this.lookback = lookback;
    this.lineColor = lineColor;
    this.lineOpacity = lineOpacity;
    this.showLabels = showLabels;
  }

  getParameters(): IndicatorParameter[] {
    return FibonacciIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.lookback) this.lookback = params.lookback;
    if (params.lineColor) this.lineColor = params.lineColor;
    if (params.lineOpacity !== undefined) this.lineOpacity = params.lineOpacity;
    if (params.showLabels !== undefined) this.showLabels = params.showLabels;
    this.calculate();
  }

  private findSwingHighLow(): {
    high: { price: number; time: string };
    low: { price: number; time: string };
  } {
    const period = Math.min(this.lookback, this.data.length);
    const recentData = this.data.slice(-period);

    let highPoint = { price: Number.NEGATIVE_INFINITY, time: "" };
    let lowPoint = { price: Number.POSITIVE_INFINITY, time: "" };

    recentData.forEach((point) => {
      if (point.high > highPoint.price) {
        highPoint = { price: point.high, time: point.time };
      }
      if (point.low < lowPoint.price) {
        lowPoint = { price: point.low, time: point.time };
      }
    });

    return { high: highPoint, low: lowPoint };
  }

  calculate(): void {
    const { high, low } = this.findSwingHighLow();
    const priceDiff = high.price - low.price;

    const levels = this.fibLevels.map((fib) => ({
      level: fib.level,
      price: high.price - priceDiff * fib.level,
      color: fib.color,
      label: `${(fib.level * 100).toFixed(1)}% - ${(
        high.price -
        priceDiff * fib.level
      ).toFixed(2)}`,
    }));

    this.result = {
      levels,
      highPoint: high,
      lowPoint: low,
    };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const traces: Trace[] = [];
    const { levels, highPoint, lowPoint } = this.result!;

    // Helper function to adjust color opacity
    const adjustOpacity = (color: string, opacity: number) => {
      if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
      }
      return color;
    };

    // Add the vertical line connecting high and low points
    traces.push({
      x: [highPoint.time, lowPoint.time],
      y: [highPoint.price, lowPoint.price],
      type: "scatter",
      mode: "lines",
      name: "Fibonacci Range",
      line: {
        color: adjustOpacity(this.lineColor, this.lineOpacity),
        width: 2,
      },
      showlegend: false,
    });

    // Get the full time range for horizontal lines
    const startTime = this.data[0].time;
    const endTime = this.data[this.data.length - 1].time;

    // Add horizontal lines for each Fibonacci level
    levels.forEach((level) => {
      traces.push({
        x: [startTime, endTime],
        y: [level.price, level.price],
        type: "scatter",
        mode: "lines",
        name: `Fib ${(level.level * 100).toFixed(1)}%`,
        line: {
          color: adjustOpacity(level.color, this.lineOpacity),
          width: 1,
          dash: "dot",
        },
        showlegend: false,
      });

      // Add labels if enabled
      if (this.showLabels) {
        traces.push({
          name: `Fib ${(level.level * 100).toFixed(1)}%`,
          x: [endTime],
          y: [level.price],
          type: "scatter",
          mode: "text",
          text: [level.label],
          textposition: "middle right",
          textfont: {
            size: 10,
            color: level.color,
          },
          showlegend: false,
          hoverinfo: "none",
        });
      }
    });

    return traces;
  }
}
