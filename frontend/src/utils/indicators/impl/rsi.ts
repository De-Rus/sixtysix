import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface RSIResult {
  values: number[];
}

export class RSIIndicator extends Indicator {
  static readonly indicatorName = "RSI";
  static readonly config = {
    subplot: true,
    height: 0.3,
  };
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "period",
      type: "number",
      label: "Period",
      value: 14,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "overbought",
      type: "number",
      label: "Overbought Level",
      value: 70,
      min: 50,
      max: 90,
      step: 1,
    },
    {
      name: "oversold",
      type: "number",
      label: "Oversold Level",
      value: 30,
      min: 10,
      max: 50,
      step: 1,
    },
    {
      name: "lineColor",
      type: "string",
      label: "Line Color",
      value: "rgb(59, 130, 246)",
    }, // Blue
    {
      name: "overboughtColor",
      type: "string",
      label: "Overbought Color",
      value: "rgb(239, 68, 68)",
    }, // Red
    {
      name: "oversoldColor",
      type: "string",
      label: "Oversold Color",
      value: "rgb(34, 197, 94)",
    }, // Green
  ];

  private result: RSIResult | null = null;
  private period: number;
  private overbought: number;
  private oversold: number;
  private lineColor: string;
  private overboughtColor: string;
  private oversoldColor: string;

  constructor(
    data: DataPoint[],
    period = 14,
    overbought = 70,
    oversold = 30,
    lineColor = "rgb(59, 130, 246)",
    overboughtColor = "rgb(239, 68, 68)",
    oversoldColor = "rgb(34, 197, 94)"
  ) {
    super(data);
    this.period = period;
    this.overbought = overbought;
    this.oversold = oversold;
    this.lineColor = lineColor;
    this.overboughtColor = overboughtColor;
    this.oversoldColor = oversoldColor;
  }

  getParameters(): IndicatorParameter[] {
    return RSIIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period;
    if (params.overbought) this.overbought = params.overbought;
    if (params.oversold) this.oversold = params.oversold;
    if (params.lineColor) this.lineColor = params.lineColor;
    if (params.overboughtColor) this.overboughtColor = params.overboughtColor;
    if (params.oversoldColor) this.oversoldColor = params.oversoldColor;
    this.calculate();
  }

  calculate(): void {
    const closes = this.data.map((d) => d.close);
    const gains: number[] = [];
    const losses: number[] = [];
    const rsi: number[] = [];

    // Calculate price changes
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(Math.max(0, change));
      losses.push(Math.max(0, -change));
    }

    // Calculate initial averages
    let avgGain =
      gains.slice(0, this.period).reduce((sum, gain) => sum + gain, 0) /
      this.period;
    let avgLoss =
      losses.slice(0, this.period).reduce((sum, loss) => sum + loss, 0) /
      this.period;

    // Calculate initial RSI
    for (let i = 0; i < this.period; i++) {
      rsi.push(0);
    }

    // First RSI value
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    // Calculate subsequent values
    for (let i = this.period; i < gains.length; i++) {
      avgGain = (avgGain * (this.period - 1) + gains[i]) / this.period;
      avgLoss = (avgLoss * (this.period - 1) + losses[i]) / this.period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    this.result = { values: rsi };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    return [
      // RSI Line
      {
        x: times,
        y: this.result!.values,
        type: "scatter",
        mode: "lines",
        name: `RSI (${this.period})`,
        line: { color: this.lineColor, width: 1.5 },
        yaxis: "y2",
      },
      // Overbought line
      {
        x: [times[0], times[times.length - 1]],
        y: [this.overbought, this.overbought],
        type: "scatter",
        mode: "lines",
        name: "Overbought",
        line: { color: this.overboughtColor, width: 1, dash: "dash" },
        yaxis: "y2",
      },
      // Oversold line
      {
        x: [times[0], times[times.length - 1]],
        y: [this.oversold, this.oversold],
        type: "scatter",
        mode: "lines",
        name: "Oversold",
        line: { color: this.oversoldColor, width: 1, dash: "dash" },
        yaxis: "y2",
      },
      // Center line (50)
      {
        x: [times[0], times[times.length - 1]],
        y: [50, 50],
        type: "scatter",
        mode: "lines",
        name: "Centerline",
        line: { color: "rgba(150, 150, 150, 0.3)", width: 1, dash: "dot" },
        yaxis: "y2",
        showlegend: false,
      },
    ];
  }
}
