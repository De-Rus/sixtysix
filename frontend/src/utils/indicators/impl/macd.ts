import {
  Indicator,
  IndicatorConfig,
  IndicatorParameter,
  type Trace,
} from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export class MACDIndicator extends Indicator {
  static readonly indicatorName = "MACD";
  static readonly config: IndicatorConfig = {
    subplot: true,
    height: 0.3, // 30% of the chart height
  };
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "fastPeriod",
      type: "number",
      label: "Fast Period",
      value: 12,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "slowPeriod",
      type: "number",
      label: "Slow Period",
      value: 26,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "signalPeriod",
      type: "number",
      label: "Signal Period",
      value: 9,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "macdColor",
      type: "string",
      label: "MACD Line Color",
      value: "rgb(59, 130, 246)",
    }, // Blue
    {
      name: "signalColor",
      type: "string",
      label: "Signal Line Color",
      value: "rgb(236, 72, 153)",
    }, // Pink
    {
      name: "histPositiveColor",
      type: "string",
      label: "Histogram Positive Color",
      value: "rgb(34, 197, 94)",
    }, // Green
    {
      name: "histNegativeColor",
      type: "string",
      label: "Histogram Negative Color",
      value: "rgb(239, 68, 68)",
    }, // Red
  ];

  private result: MACDResult | null = null;
  private fastPeriod: number;
  private slowPeriod: number;
  private signalPeriod: number;
  private macdColor: string;
  private signalColor: string;
  private histPositiveColor: string;
  private histNegativeColor: string;

  constructor(
    data: DataPoint[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
    macdColor = "rgb(59, 130, 246)",
    signalColor = "rgb(236, 72, 153)",
    histPositiveColor = "rgb(34, 197, 94)",
    histNegativeColor = "rgb(239, 68, 68)"
  ) {
    super(data);
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;
    this.macdColor = macdColor;
    this.signalColor = signalColor;
    this.histPositiveColor = histPositiveColor;
    this.histNegativeColor = histNegativeColor;
  }

  getParameters(): IndicatorParameter[] {
    // Return a deep copy to prevent accidental modification of the static property
    return JSON.parse(JSON.stringify(MACDIndicator.defaultParams));
  }

  setParameters(params: Record<string, any>): void {
    if (params.fastPeriod) this.fastPeriod = params.fastPeriod;
    if (params.slowPeriod) this.slowPeriod = params.slowPeriod;
    if (params.signalPeriod) this.signalPeriod = params.signalPeriod;
    if (params.macdColor) this.macdColor = params.macdColor;
    if (params.signalColor) this.signalColor = params.signalColor;
    if (params.histPositiveColor)
      this.histPositiveColor = params.histPositiveColor;
    if (params.histNegativeColor)
      this.histNegativeColor = params.histNegativeColor;
    this.calculate();
  }

  // Add missing methods required by ConfigurableIndicator interface
  getDefaultParameters(): Record<string, any> {
    return {
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      macdColor: this.macdColor,
      signalColor: this.signalColor,
      histPositiveColor: this.histPositiveColor,
      histNegativeColor: this.histNegativeColor,
    };
  }

  validateParameters(params: Record<string, any>): void {
    // Basic validation
    if (
      params.fastPeriod &&
      (params.fastPeriod < 1 || params.fastPeriod > 50)
    ) {
      throw new Error("Fast Period must be between 1 and 50");
    }
    if (
      params.slowPeriod &&
      (params.slowPeriod < 1 || params.slowPeriod > 100)
    ) {
      throw new Error("Slow Period must be between 1 and 100");
    }
    if (
      params.signalPeriod &&
      (params.signalPeriod < 1 || params.signalPeriod > 50)
    ) {
      throw new Error("Signal Period must be between 1 and 50");
    }
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for first EMA value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);

    // Calculate subsequent EMAs
    for (let i = period; i < prices.length; i++) {
      ema.push(prices[i] * multiplier + ema[ema.length - 1] * (1 - multiplier));
    }

    return ema;
  }

  calculate(): void {
    const prices = this.data.map((d) => d.close);
    const macd: number[] = [];
    const signal: number[] = [];
    const histogram: number[] = [];

    // Calculate fast and slow EMAs
    const fastEMA = this.calculateEMA(prices, this.fastPeriod);
    const slowEMA = this.calculateEMA(prices, this.slowPeriod);

    // Calculate MACD line
    const startIndex = this.slowPeriod - 1;
    for (let i = startIndex; i < prices.length; i++) {
      macd.push(
        fastEMA[i - startIndex + (this.slowPeriod - this.fastPeriod)] -
          slowEMA[i - startIndex]
      );
    }

    // Calculate signal line
    const signalEMA = this.calculateEMA(macd, this.signalPeriod);
    signal.push(...signalEMA);

    // Calculate histogram
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i] - signal[i]);
    }

    this.result = { macd, signal, histogram };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const startIndex = this.slowPeriod - 1;
    const times = this.data.slice(startIndex).map((d) => d.time);

    // Split histogram into positive and negative values
    const positiveHist: (number | null)[] = [];
    const negativeHist: (number | null)[] = [];

    this.result!.histogram.forEach((value) => {
      if (value >= 0) {
        positiveHist.push(value);
        negativeHist.push(null);
      } else {
        positiveHist.push(null);
        negativeHist.push(value);
      }
    });

    // All traces use yaxis2 since this is a subplot indicator
    return [
      {
        x: times,
        y: this.result!.macd,
        type: "scatter",
        mode: "lines",
        name: "MACD",
        line: { color: this.macdColor },
        yaxis: "y2",
      },
      {
        x: times,
        y: this.result!.signal,
        type: "scatter",
        mode: "lines",
        name: "Signal",
        line: { color: this.signalColor },
        yaxis: "y2",
      },
      {
        x: times,
        y: positiveHist,
        type: "bar",
        name: "Histogram",
        marker: { color: this.histPositiveColor },
        yaxis: "y2",
        showlegend: false,
      },
      {
        x: times,
        y: negativeHist,
        type: "bar",
        name: "Histogram",
        marker: { color: this.histNegativeColor },
        yaxis: "y2",
        showlegend: false,
      },
    ];
  }
}
