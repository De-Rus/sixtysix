import { Indicator, type Trace } from "../base/base-indicator";
import type { DataPoint } from "../../../types/chart-types";
import type {
  ConfigurableIndicator,
  IndicatorParameter,
} from "../base/configurable-indicator";

interface BollingerBandsResult {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

export class BollingerBandsIndicator
  extends Indicator
  implements ConfigurableIndicator
{
  static readonly indicatorName = "Bollinger Bands";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "period",
      type: "number",
      label: "Period",
      value: 20,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "stdDev",
      type: "number",
      label: "Standard Deviations",
      value: 2,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
    {
      name: "middleColor",
      type: "string",
      label: "Middle Band Color",
      value: "rgb(59, 130, 246)",
    }, // Blue
    {
      name: "bandColor",
      type: "string",
      label: "Bands Color",
      value: "rgb(147, 51, 234)",
    }, // Purple
    {
      name: "bandOpacity",
      type: "number",
      label: "Bands Opacity",
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.1,
    },
  ];

  private result: BollingerBandsResult | null = null;
  private period: number;
  private stdDev: number;
  private middleColor: string;
  private bandColor: string;
  private bandOpacity: number;

  constructor(
    data: DataPoint[],
    period = 20,
    stdDev = 2,
    middleColor = "rgb(59, 130, 246)",
    bandColor = "rgb(147, 51, 234)",
    bandOpacity = 0.1
  ) {
    super(data);
    this.period = period;
    this.stdDev = stdDev;
    this.middleColor = middleColor;
    this.bandColor = bandColor;
    this.bandOpacity = bandOpacity;
  }

  getParameters(): IndicatorParameter[] {
    return [
      {
        name: "period",
        type: "number",
        label: "Period",
        value: this.period,
        min: 1,
        max: 100,
        step: 1,
      },
      {
        name: "stdDev",
        type: "number",
        label: "Standard Deviations",
        value: this.stdDev,
        min: 0.1,
        max: 5,
        step: 0.1,
      },
      {
        name: "middleColor",
        type: "string",
        label: "Middle Band Color",
        value: this.middleColor,
      },
      {
        name: "bandColor",
        type: "string",
        label: "Bands Color",
        value: this.bandColor,
      },
      {
        name: "bandOpacity",
        type: "number",
        label: "Bands Opacity",
        value: this.bandOpacity,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ];
  }

  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period;
    if (params.stdDev) this.stdDev = params.stdDev;
    if (params.middleColor) this.middleColor = params.middleColor;
    if (params.bandColor) this.bandColor = params.bandColor;
    if (params.bandOpacity !== undefined) this.bandOpacity = params.bandOpacity;
    this.calculate();
  }

  private calculateSMA(prices: number[]): (number | null)[] {
    const sma: (number | null)[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < this.period - 1) {
        sma.push(null);
      } else {
        let sum = 0;
        for (let j = i - this.period + 1; j <= i; j++) {
          sum += prices[j];
        }
        sma.push(sum / this.period);
      }
    }

    return sma;
  }

  private calculateStandardDeviation(
    prices: number[],
    sma: (number | null)[]
  ): (number | null)[] {
    const stdDev: (number | null)[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < this.period - 1 || sma[i] === null) {
        stdDev.push(null);
      } else {
        let sumSquaredDiff = 0;
        for (let j = i - this.period + 1; j <= i; j++) {
          sumSquaredDiff += Math.pow(prices[j] - sma[i]!, 2);
        }
        stdDev.push(Math.sqrt(sumSquaredDiff / this.period));
      }
    }

    return stdDev;
  }

  calculate(): void {
    const prices = this.data.map((d) => d.close);
    const middle = this.calculateSMA(prices);
    const stdDev = this.calculateStandardDeviation(prices, middle);

    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (middle[i] === null || stdDev[i] === null) {
        upper.push(null);
        lower.push(null);
      } else {
        upper.push(middle[i]! + this.stdDev * stdDev[i]!);
        lower.push(middle[i]! - this.stdDev * stdDev[i]!);
      }
    }

    this.result = { middle, upper, lower };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    // Helper function to adjust color opacity
    const adjustOpacity = (color: string, opacity: number) => {
      if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
      }
      return color;
    };

    return [
      // Middle band (SMA)
      {
        x: times,
        y: this.result!.middle,
        type: "scatter",
        mode: "lines",
        name: `BB (${this.period}, ${this.stdDev})`,
        line: { color: this.middleColor, width: 1.5 },
      },
      // Upper band
      {
        x: times,
        y: this.result!.upper,
        type: "scatter",
        mode: "lines",
        name: "Upper Band",
        line: { color: this.bandColor, width: 1 },
        showlegend: false,
      },
      // Lower band
      {
        x: times,
        y: this.result!.lower,
        type: "scatter",
        mode: "lines",
        name: "Lower Band",
        line: { color: this.bandColor, width: 1 },
        fill: "tonexty",
        fillcolor: adjustOpacity(this.bandColor, this.bandOpacity),
        showlegend: false,
      },
    ];
  }
}
