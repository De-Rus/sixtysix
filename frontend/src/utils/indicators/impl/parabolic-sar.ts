import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface SARResult {
  values: (number | null)[];
  trends: ("up" | "down")[];
}

export class ParabolicSARIndicator extends Indicator {
  static readonly indicatorName = "Parabolic SAR";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "initialAF",
      type: "number",
      label: "Initial AF",
      value: 0.02,
      min: 0.01,
      max: 0.1,
      step: 0.01,
    },
    {
      name: "maxAF",
      type: "number",
      label: "Max AF",
      value: 0.2,
      min: 0.1,
      max: 1,
      step: 0.1,
    },
    {
      name: "increment",
      type: "number",
      label: "AF Increment",
      value: 0.02,
      min: 0.01,
      max: 0.1,
      step: 0.01,
    },
    {
      name: "upColor",
      type: "string",
      label: "Bullish Color",
      value: "rgb(34, 197, 94)",
    }, // Green
    {
      name: "downColor",
      type: "string",
      label: "Bearish Color",
      value: "rgb(239, 68, 68)",
    }, // Red
  ];

  private result: SARResult | null = null;
  private initialAF: number;
  private maxAF: number;
  private increment: number;
  private upColor: string;
  private downColor: string;

  constructor(
    data: DataPoint[],
    initialAF = 0.02,
    maxAF = 0.2,
    increment = 0.02,
    upColor = "rgb(34, 197, 94)",
    downColor = "rgb(239, 68, 68)"
  ) {
    super(data);
    this.initialAF = initialAF;
    this.maxAF = maxAF;
    this.increment = increment;
    this.upColor = upColor;
    this.downColor = downColor;
  }

  getParameters(): IndicatorParameter[] {
    return ParabolicSARIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.initialAF) this.initialAF = params.initialAF;
    if (params.maxAF) this.maxAF = params.maxAF;
    if (params.increment) this.increment = params.increment;
    if (params.upColor) this.upColor = params.upColor;
    if (params.downColor) this.downColor = params.downColor;
    this.calculate();
  }

  calculate(): void {
    if (this.data.length < 2) {
      this.result = { values: [], trends: [] };
      return;
    }

    const values: (number | null)[] = [];
    const trends: ("up" | "down")[] = [];

    // Initialize variables
    let isLong = this.data[1].close > this.data[0].close;
    let sar = isLong
      ? Math.min(this.data[0].low, this.data[1].low)
      : Math.max(this.data[0].high, this.data[1].high);
    let extremePoint = isLong
      ? Math.max(this.data[0].high, this.data[1].high)
      : Math.min(this.data[0].low, this.data[1].low);
    let accelerationFactor = this.initialAF;

    // Add initial values
    values.push(null);
    trends.push(isLong ? "up" : "down");

    // Calculate SAR values
    for (let i = 1; i < this.data.length; i++) {
      const high = this.data[i].high;
      const low = this.data[i].low;

      // Update SAR value
      sar = sar + accelerationFactor * (extremePoint - sar);

      // Check for trend reversal
      if (isLong) {
        if (low < sar) {
          // Trend reversal: long to short
          isLong = false;
          sar = extremePoint;
          extremePoint = low;
          accelerationFactor = this.initialAF;
        } else {
          // Continue long trend
          if (high > extremePoint) {
            extremePoint = high;
            accelerationFactor = Math.min(
              accelerationFactor + this.increment,
              this.maxAF
            );
          }
        }
        // Ensure SAR is below the recent lows
        if (i > 0) {
          sar = Math.min(sar, this.data[i - 1].low, this.data[i].low);
        }
      } else {
        if (high > sar) {
          // Trend reversal: short to long
          isLong = true;
          sar = extremePoint;
          extremePoint = high;
          accelerationFactor = this.initialAF;
        } else {
          // Continue short trend
          if (low < extremePoint) {
            extremePoint = low;
            accelerationFactor = Math.min(
              accelerationFactor + this.increment,
              this.maxAF
            );
          }
        }
        // Ensure SAR is above the recent highs
        if (i > 0) {
          sar = Math.max(sar, this.data[i - 1].high, this.data[i].high);
        }
      }

      values.push(sar);
      trends.push(isLong ? "up" : "down");
    }

    this.result = { values, trends };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    // Split data into uptrend and downtrend points
    const upTrendPoints = {
      x: [] as string[],
      y: [] as number[],
    };

    const downTrendPoints = {
      x: [] as string[],
      y: [] as number[],
    };

    this.result!.values.forEach((value, i) => {
      if (value === null) return;

      if (this.result!.trends[i] === "up") {
        upTrendPoints.x.push(times[i]);
        upTrendPoints.y.push(value);
      } else {
        downTrendPoints.x.push(times[i]);
        downTrendPoints.y.push(value);
      }
    });

    const traces: Trace[] = [];

    // Add uptrend points
    if (upTrendPoints.x.length > 0) {
      traces.push({
        x: upTrendPoints.x,
        y: upTrendPoints.y,
        type: "scatter",
        mode: "markers",
        name: "SAR (Buy)",
        marker: {
          symbol: "dot",
          size: 4,
          color: this.upColor,
        },
        showlegend: true,
      });
    }

    // Add downtrend points
    if (downTrendPoints.x.length > 0) {
      traces.push({
        x: downTrendPoints.x,
        y: downTrendPoints.y,
        type: "scatter",
        mode: "markers",
        name: "SAR (Sell)",
        marker: {
          symbol: "dot",
          size: 4,
          color: this.downColor,
        },
        showlegend: true,
      });
    }

    return traces;
  }
}
