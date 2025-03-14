import {
  Indicator,
  IndicatorConfig,
  IndicatorParameter,
  type Trace,
} from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface SqueezeResult {
  momentum: number[];
  sma20: number[]; // Add SMA lines
  sma50: number[];
  squeeze: boolean[];
  direction: ("up" | "down")[];
}

export class SqueezeMomentumIndicator extends Indicator {
  static readonly indicatorName = "Squeeze Momentum";
  static readonly config: IndicatorConfig = {
    subplot: true,
    height: 0.3,
  };
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "bbPeriod",
      type: "number",
      label: "BB Period",
      value: 20,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "bbMultiplier",
      type: "number",
      label: "BB Multiplier",
      value: 2,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
    {
      name: "kcPeriod",
      type: "number",
      label: "KC Period",
      value: 20,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "kcMultiplier",
      type: "number",
      label: "KC Multiplier",
      value: 1.5,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
    {
      name: "momentumPeriod",
      type: "number",
      label: "Momentum Period",
      value: 12,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "sma20Period",
      type: "number",
      label: "Fast MA Period",
      value: 20,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "sma50Period",
      type: "number",
      label: "Slow MA Period",
      value: 50,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "squeezeColor",
      type: "string",
      label: "Squeeze Color",
      value: "rgb(234, 179, 8)",
    }, // Amber
    {
      name: "upColor",
      type: "string",
      label: "Up Color",
      value: "rgb(34, 197, 94)",
    }, // Green
    {
      name: "downColor",
      type: "string",
      label: "Down Color",
      value: "rgb(239, 68, 68)",
    }, // Red
    {
      name: "sma20Color",
      type: "string",
      label: "Fast MA Color",
      value: "rgb(59, 130, 246)",
    }, // Blue
    {
      name: "sma50Color",
      type: "string",
      label: "Slow MA Color",
      value: "rgb(147, 51, 234)",
    }, // Purple
  ];

  private result: SqueezeResult | null = null;
  private bbPeriod: number;
  private bbMultiplier: number;
  private kcPeriod: number;
  private kcMultiplier: number;
  private momentumPeriod: number;
  private sma20Period: number;
  private sma50Period: number;
  private squeezeColor: string;
  private upColor: string;
  private downColor: string;
  private sma20Color: string;
  private sma50Color: string;

  constructor(
    data: DataPoint[],
    bbPeriod = 20,
    bbMultiplier = 2,
    kcPeriod = 20,
    kcMultiplier = 1.5,
    momentumPeriod = 12,
    sma20Period = 20,
    sma50Period = 50,
    squeezeColor = "rgb(234, 179, 8)",
    upColor = "rgb(34, 197, 94)",
    downColor = "rgb(239, 68, 68)",
    sma20Color = "rgb(59, 130, 246)",
    sma50Color = "rgb(147, 51, 234)"
  ) {
    super(data);
    this.bbPeriod = bbPeriod;
    this.bbMultiplier = bbMultiplier;
    this.kcPeriod = kcPeriod;
    this.kcMultiplier = kcMultiplier;
    this.momentumPeriod = momentumPeriod;
    this.sma20Period = sma20Period;
    this.sma50Period = sma50Period;
    this.squeezeColor = squeezeColor;
    this.upColor = upColor;
    this.downColor = downColor;
    this.sma20Color = sma20Color;
    this.sma50Color = sma50Color;
  }

  getParameters(): IndicatorParameter[] {
    return SqueezeMomentumIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.bbPeriod) this.bbPeriod = params.bbPeriod;
    if (params.bbMultiplier) this.bbMultiplier = params.bbMultiplier;
    if (params.kcPeriod) this.kcPeriod = params.kcPeriod;
    if (params.kcMultiplier) this.kcMultiplier = params.kcMultiplier;
    if (params.momentumPeriod) this.momentumPeriod = params.momentumPeriod;
    if (params.sma20Period) this.sma20Period = params.sma20Period;
    if (params.sma50Period) this.sma50Period = params.sma50Period;
    if (params.squeezeColor) this.squeezeColor = params.squeezeColor;
    if (params.upColor) this.upColor = params.upColor;
    if (params.downColor) this.downColor = params.downColor;
    if (params.sma20Color) this.sma20Color = params.sma20Color;
    if (params.sma50Color) this.sma50Color = params.sma50Color;
    this.calculate();
  }

  private calculateSMA(values: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        sma.push(0);
        continue;
      }

      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += values[j];
      }
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateStdDev(
    values: number[],
    sma: number[],
    period: number
  ): number[] {
    const stdDev: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        stdDev.push(0);
        continue;
      }

      let sumSquaredDiff = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSquaredDiff += Math.pow(values[j] - sma[i], 2);
      }
      stdDev.push(Math.sqrt(sumSquaredDiff / period));
    }
    return stdDev;
  }

  private calculateTR(
    high: number,
    low: number,
    prevClose: number | null
  ): number {
    if (prevClose === null) return high - low;
    return Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }

  private calculateATR(period: number): number[] {
    const tr: number[] = [];
    const atr: number[] = [];

    // Calculate True Range
    for (let i = 0; i < this.data.length; i++) {
      const prevClose = i > 0 ? this.data[i - 1].close : null;
      tr.push(this.calculateTR(this.data[i].high, this.data[i].low, prevClose));
    }

    // Calculate first ATR
    const sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push(sum / period);

    // Calculate remaining ATRs
    for (let i = period; i < tr.length; i++) {
      atr.push((atr[i - period] * (period - 1) + tr[i]) / period);
    }

    return atr;
  }

  private calculateMomentum(period: number): number[] {
    const momentum: number[] = [];
    const closes = this.data.map((d) => d.close);
    const highest = this.calculateHighest(closes, period);
    const lowest = this.calculateLowest(closes, period);

    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        momentum.push(0);
        continue;
      }

      const avgHigh = highest[i];
      const avgLow = lowest[i];
      const mean = (avgHigh + avgLow) / 2;
      const diff = closes[i] - mean;
      momentum.push(diff);
    }

    return momentum;
  }

  private calculateHighest(values: number[], period: number): number[] {
    const highest: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        highest.push(values[i]);
        continue;
      }

      let max = values[i];
      for (let j = i - period + 1; j <= i; j++) {
        max = Math.max(max, values[j]);
      }
      highest.push(max);
    }
    return highest;
  }

  private calculateLowest(values: number[], period: number): number[] {
    const lowest: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        lowest.push(values[i]);
        continue;
      }

      let min = values[i];
      for (let j = i - period + 1; j <= i; j++) {
        min = Math.min(min, values[j]);
      }
      lowest.push(min);
    }
    return lowest;
  }

  calculate(): void {
    const closes = this.data.map((d) => d.close);
    const highs = this.data.map((d) => d.high);
    const lows = this.data.map((d) => d.low);

    // Calculate Bollinger Bands
    const bbSMA = this.calculateSMA(closes, this.bbPeriod);
    const bbStdDev = this.calculateStdDev(closes, bbSMA, this.bbPeriod);
    const bbUpper = bbSMA.map(
      (sma, i) => sma + this.bbMultiplier * bbStdDev[i]
    );
    const bbLower = bbSMA.map(
      (sma, i) => sma - this.bbMultiplier * bbStdDev[i]
    );

    // Calculate Keltner Channels
    const kcSMA = this.calculateSMA(closes, this.kcPeriod);
    const atr = this.calculateATR(this.kcPeriod);
    const kcUpper = kcSMA.map((sma, i) => sma + this.kcMultiplier * atr[i]);
    const kcLower = kcSMA.map((sma, i) => sma - this.kcMultiplier * atr[i]);

    // Calculate Momentum
    const momentum = this.calculateMomentum(this.momentumPeriod);

    // Calculate Moving Averages of the momentum
    const sma20 = this.calculateSMA(momentum, this.sma20Period);
    const sma50 = this.calculateSMA(momentum, this.sma50Period);

    // Determine squeeze and direction
    const squeeze: boolean[] = [];
    const direction: ("up" | "down")[] = [];

    for (let i = 0; i < closes.length; i++) {
      // Check if BB is inside KC (squeeze)
      squeeze.push(bbUpper[i] < kcUpper[i] && bbLower[i] > kcLower[i]);

      // Determine momentum direction
      direction.push(momentum[i] >= 0 ? "up" : "down");
    }

    this.result = {
      momentum,
      sma20,
      sma50,
      squeeze,
      direction,
    };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    // Split momentum into positive and negative values
    const positiveMomentum: (number | null)[] = [];
    const negativeMomentum: (number | null)[] = [];

    this.result!.momentum.forEach((value, i) => {
      const isInSqueeze = this.result!.squeeze[i];
      if (value >= 0) {
        positiveMomentum.push(value);
        negativeMomentum.push(null);
      } else {
        positiveMomentum.push(null);
        negativeMomentum.push(value);
      }
    });

    // All traces use yaxis2 since this is a subplot indicator
    return [
      // Moving Averages (add these first so they appear behind the bars)
      {
        x: times,
        y: this.result!.sma20,
        type: "scatter",
        mode: "lines",
        name: `Momentum SMA (${this.sma20Period})`,
        line: { color: this.sma20Color, width: 1.5 },
        yaxis: "y2",
      },
      {
        x: times,
        y: this.result!.sma50,
        type: "scatter",
        mode: "lines",
        name: `Momentum SMA (${this.sma50Period})`,
        line: { color: this.sma50Color, width: 1.5 },
        yaxis: "y2",
      },
      // Positive momentum bars
      {
        x: times,
        y: positiveMomentum,
        type: "bar",
        name: "Squeeze Momentum +",
        marker: {
          color: this.result!.squeeze.map((sq) =>
            sq ? this.squeezeColor : this.upColor
          ),
        },
        yaxis: "y2",
        showlegend: false,
      },
      // Negative momentum bars
      {
        x: times,
        y: negativeMomentum,
        type: "bar",
        name: "Squeeze Momentum -",
        marker: {
          color: this.result!.squeeze.map((sq) =>
            sq ? this.squeezeColor : this.downColor
          ),
        },
        yaxis: "y2",
        showlegend: false,
      },
    ];
  }
}
