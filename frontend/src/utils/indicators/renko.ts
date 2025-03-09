import { Indicator, type Trace } from "./base-indicator";
import type { DataPoint } from "../../types/chart-types";
import type {
  ConfigurableIndicator,
  IndicatorParameter,
} from "./configurable-indicator";

interface RenkoLevel {
  time: string;
  value: number;
}

interface RenkoState {
  top: RenkoLevel[];
  bottom: RenkoLevel[];
  trend: ("up" | "down")[];
}

export class RenkoIndicator extends Indicator implements ConfigurableIndicator {
  static readonly indicatorName = "Renko";
  static readonly config = { subplot: false };
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "blockSize",
      type: "number",
      label: "Block Size",
      value: 0.5,
      min: 0.1,
      max: 10,
      step: 0.1,
    },
    {
      name: "upColor",
      type: "string",
      label: "Bullish Color",
      value: "rgba(34, 197, 94, 0.2)",
    },
    {
      name: "downColor",
      type: "string",
      label: "Bearish Color",
      value: "rgba(239, 68, 68, 0.2)",
    },
    {
      name: "lineWidth",
      type: "number",
      label: "Line Width",
      value: 2,
      min: 1,
      max: 5,
      step: 1,
    },
  ];

  private result: RenkoState | null = null;
  private blockSize: number;
  private upColor: string;
  private downColor: string;
  private lineWidth: number;

  constructor(
    data: DataPoint[],
    blockSize = 0.5,
    upColor = "rgba(34, 197, 94, 0.2)",
    downColor = "rgba(239, 68, 68, 0.2)",
    lineWidth = 2
  ) {
    super(data);
    this.blockSize = blockSize;
    this.upColor = upColor;
    this.downColor = downColor;
    this.lineWidth = lineWidth;
  }

  getParameters(): IndicatorParameter[] {
    return RenkoIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.blockSize) this.blockSize = params.blockSize;
    if (params.upColor) this.upColor = params.upColor;
    if (params.downColor) this.downColor = params.downColor;
    if (params.lineWidth) this.lineWidth = params.lineWidth;
    this.calculate();
  }

  private calculateRenko(): RenkoState {
    const state: RenkoState = {
      top: [],
      bottom: [],
      trend: [],
    };

    if (this.data.length === 0) return state;

    // Initialize with first price
    let currentTop = this.data[0].close;
    let currentBottom = currentTop - this.blockSize;
    let currentTrend: "up" | "down" = "up";

    // Add initial state
    state.top.push({ time: this.data[0].time, value: currentTop });
    state.bottom.push({ time: this.data[0].time, value: currentBottom });
    state.trend.push(currentTrend);

    // Process each price point
    for (let i = 1; i < this.data.length; i++) {
      const price = this.data[i].close;
      const time = this.data[i].time;

      // Check if price moved enough to create new blocks
      if (price >= currentTop + this.blockSize) {
        // Upward movement
        const blocks = Math.floor((price - currentTop) / this.blockSize);
        currentTop += blocks * this.blockSize;
        currentBottom += blocks * this.blockSize;
        currentTrend = "up";

        // Add new levels
        state.top.push({ time, value: currentTop });
        state.bottom.push({ time, value: currentBottom });
        state.trend.push(currentTrend);
      } else if (price <= currentBottom - this.blockSize) {
        // Downward movement
        const blocks = Math.floor((currentBottom - price) / this.blockSize);
        currentTop -= blocks * this.blockSize;
        currentBottom -= blocks * this.blockSize;
        currentTrend = "down";

        // Add new levels
        state.top.push({ time, value: currentTop });
        state.bottom.push({ time, value: currentBottom });
        state.trend.push(currentTrend);
      } else {
        // No significant movement, maintain current levels
        state.top.push({ time, value: currentTop });
        state.bottom.push({ time, value: currentBottom });
        state.trend.push(currentTrend);
      }
    }

    return state;
  }

  calculate(): void {
    this.result = this.calculateRenko();
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const traces: Trace[] = [];
    const { top, bottom, trend } = this.result!;

    if (top.length === 0) return traces;

    // Split data into segments based on trend changes
    const segments: { start: number; end: number; trend: "up" | "down" }[] = [];
    let currentSegmentStart = 0;

    for (let i = 1; i < trend.length; i++) {
      if (trend[i] !== trend[i - 1]) {
        segments.push({
          start: currentSegmentStart,
          end: i - 1,
          trend: trend[currentSegmentStart],
        });
        currentSegmentStart = i;
      }
    }

    // Add the last segment
    segments.push({
      start: currentSegmentStart,
      end: trend.length - 1,
      trend: trend[currentSegmentStart],
    });

    // Create traces for each segment
    segments.forEach((segment, index) => {
      const segmentTimes = top
        .slice(segment.start, segment.end + 1)
        .map((t) => t.time);
      const segmentTop = top
        .slice(segment.start, segment.end + 1)
        .map((t) => t.value);
      const segmentBottom = bottom
        .slice(segment.start, segment.end + 1)
        .map((t) => t.value);

      // Add filled area for the segment
      traces.push({
        x: [...segmentTimes, ...segmentTimes.reverse()],
        y: [...segmentTop, ...segmentBottom.reverse()],
        fill: "toself",
        fillcolor: segment.trend === "up" ? this.upColor : this.downColor,
        type: "scatter",
        mode: "none",
        name: `Renko ${segment.trend === "up" ? "Bullish" : "Bearish"} ${
          index + 1
        }`,
        showlegend: false,
        hoverinfo: "none",
      });
    });

    // Add top line trace
    traces.push({
      x: top.map((t) => t.time),
      y: top.map((t) => t.value),
      type: "scatter",
      mode: "lines",
      line: {
        color: "rgba(0, 0, 0, 0.8)",
        width: this.lineWidth,
      },
      name: "Renko Top",
      showlegend: true,
    });

    // Add bottom line trace
    traces.push({
      x: bottom.map((t) => t.time),
      y: bottom.map((t) => t.value),
      type: "scatter",
      mode: "lines",
      line: {
        color: "rgba(0, 0, 0, 0.8)",
        width: this.lineWidth,
      },
      name: "Renko Bottom",
      showlegend: true,
    });

    return traces;
  }
}
