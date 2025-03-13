import { Indicator, type Trace } from "../base/base-indicator";
import type { DataPoint } from "../../../types/chart-types";
import type {
  ConfigurableIndicator,
  IndicatorParameter,
} from "../base/configurable-indicator";

interface ADXResult {
  adx: (number | null)[]; // Average Directional Index
  plusDI: (number | null)[]; // Positive Directional Indicator
  minusDI: (number | null)[]; // Negative Directional Indicator
}

export class ADXIndicator extends Indicator implements ConfigurableIndicator {
  static readonly indicatorName = "ADX/DI";
  static readonly config = {
    subplot: true,
    height: 0.3, // 30% of the chart height
  };
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "period",
      type: "number",
      label: "Period",
      value: 14,
      min: 1,
      max: 50,
      step: 1,
    },
    {
      name: "adxColor",
      type: "string",
      label: "ADX Line Color",
      value: "rgb(234, 179, 8)",
    }, // Amber
    {
      name: "plusDIColor",
      type: "string",
      label: "DI+ Color",
      value: "rgb(34, 197, 94)",
    }, // Green
    {
      name: "minusDIColor",
      type: "string",
      label: "DI- Color",
      value: "rgb(239, 68, 68)",
    }, // Red
    {
      name: "strongTrend",
      type: "number",
      label: "Strong Trend Level",
      value: 25,
      min: 0,
      max: 100,
      step: 1,
    },
  ];

  private result: ADXResult | null = null;
  private period: number;
  private adxColor: string;
  private plusDIColor: string;
  private minusDIColor: string;
  private strongTrend: number;

  constructor(
    data: DataPoint[],
    period = 14,
    adxColor = "rgb(234, 179, 8)",
    plusDIColor = "rgb(34, 197, 94)",
    minusDIColor = "rgb(239, 68, 68)",
    strongTrend = 25
  ) {
    super(data);
    this.period = period;
    this.adxColor = adxColor;
    this.plusDIColor = plusDIColor;
    this.minusDIColor = minusDIColor;
    this.strongTrend = strongTrend;
  }

  getParameters(): IndicatorParameter[] {
    return ADXIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period;
    if (params.adxColor) this.adxColor = params.adxColor;
    if (params.plusDIColor) this.plusDIColor = params.plusDIColor;
    if (params.minusDIColor) this.minusDIColor = params.minusDIColor;
    if (params.strongTrend) this.strongTrend = params.strongTrend;
    this.calculate();
  }

  private calculateTR(
    high: number,
    low: number,
    prevClose: number | null
  ): number {
    if (prevClose === null) return high - low;

    return Math.max(
      high - low, // Current high - low
      Math.abs(high - prevClose), // Current high - previous close
      Math.abs(low - prevClose) // Current low - previous close
    );
  }

  private calculateDirectionalMovement(
    high: number,
    low: number,
    prevHigh: number | null,
    prevLow: number | null
  ): { plusDM: number; minusDM: number } {
    if (prevHigh === null || prevLow === null) {
      return { plusDM: 0, minusDM: 0 };
    }

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    let plusDM = 0;
    let minusDM = 0;

    if (upMove > downMove && upMove > 0) {
      plusDM = upMove;
    }
    if (downMove > upMove && downMove > 0) {
      minusDM = downMove;
    }

    return { plusDM, minusDM };
  }

  private smoothen(data: number[], period: number): number[] {
    const smoothed: number[] = [];
    let sum = data.slice(0, period).reduce((a, b) => a + b, 0);
    smoothed.push(sum);

    for (let i = period; i < data.length; i++) {
      sum = (sum * (period - 1) + data[i]) / period;
      smoothed.push(sum);
    }

    return smoothed;
  }

  calculate(): void {
    const tr: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    // Calculate TR and directional movement
    for (let i = 0; i < this.data.length; i++) {
      const prevClose = i > 0 ? this.data[i - 1].close : null;
      const prevHigh = i > 0 ? this.data[i - 1].high : null;
      const prevLow = i > 0 ? this.data[i - 1].low : null;

      tr.push(this.calculateTR(this.data[i].high, this.data[i].low, prevClose));
      const { plusDM: pDM, minusDM: mDM } = this.calculateDirectionalMovement(
        this.data[i].high,
        this.data[i].low,
        prevHigh,
        prevLow
      );
      plusDM.push(pDM);
      minusDM.push(mDM);
    }

    // Smooth TR and DM values
    const smoothTR = this.smoothen(tr, this.period);
    const smoothPlusDM = this.smoothen(plusDM, this.period);
    const smoothMinusDM = this.smoothen(minusDM, this.period);

    // Calculate DI values
    const plusDI: number[] = [];
    const minusDI: number[] = [];
    const dx: number[] = [];

    for (let i = 0; i < smoothTR.length; i++) {
      const pDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
      const mDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
      plusDI.push(pDI);
      minusDI.push(mDI);

      // Calculate DX
      const diDiff = Math.abs(pDI - mDI);
      const diSum = pDI + mDI;
      dx.push((diDiff / diSum) * 100);
    }

    // Calculate ADX (smoothed DX)
    const adx = this.smoothen(dx, this.period);

    // Prepare final arrays with proper nulls for initial periods
    const nullPadding = new Array(this.data.length - adx.length).fill(null);
    this.result = {
      adx: [...nullPadding, ...adx],
      plusDI: [...nullPadding, ...plusDI],
      minusDI: [...nullPadding, ...minusDI],
    };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    return [
      // ADX Line
      {
        x: times,
        y: this.result!.adx,
        type: "scatter",
        mode: "lines",
        name: `ADX (${this.period})`,
        line: { color: this.adxColor, width: 2 },
        yaxis: "y2",
      },
      // DI+ Line
      {
        x: times,
        y: this.result!.plusDI,
        type: "scatter",
        mode: "lines",
        name: "DI+",
        line: { color: this.plusDIColor, width: 1.5 },
        yaxis: "y2",
      },
      // DI- Line
      {
        x: times,
        y: this.result!.minusDI,
        type: "scatter",
        mode: "lines",
        name: "DI-",
        line: { color: this.minusDIColor, width: 1.5 },
        yaxis: "y2",
      },
      // Strong trend level line
      {
        x: [times[0], times[times.length - 1]],
        y: [this.strongTrend, this.strongTrend],
        type: "scatter",
        mode: "lines",
        name: "Strong Trend",
        line: { color: "rgba(150, 150, 150, 0.3)", width: 1, dash: "dash" },
        yaxis: "y2",
        showlegend: false,
      },
    ];
  }
}
