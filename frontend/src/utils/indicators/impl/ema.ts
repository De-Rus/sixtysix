import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";
import { calculateEMA } from "../calculations/ema";

export class EMAIndicator extends Indicator {
  static readonly indicatorName = "EMA";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "period",
      type: "number",
      label: "Period",
      value: 14,
      min: 1,
      max: 200,
      step: 1,
    },
    {
      name: "color",
      type: "color",
      label: "Color",
      value: "rgba(16, 185, 129, 1)",
    },
  ];
  private result: (number | null)[] = [];
  private period: number;
  private color: string;

  constructor(data: DataPoint[], period = 14, color = "rgba(16, 185, 129, 1)") {
    super(data);
    this.period = period;
    this.color = color;
  }

  getParameters(): IndicatorParameter[] {
    return EMAIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    this.period = params.period;
    this.color = params.color;
    this.calculate();
  }

  calculate(): void {
    this.result = calculateEMA(this.data, this.period);
  }

  generateTraces(): Trace[] {
    if (this.result.length === 0) {
      this.calculate();
    }

    return [
      {
        x: this.data.map((d) => d.time),
        y: this.result,
        type: "scatter",
        mode: "lines",
        name: `EMA (${this.period})`,
        line: { color: this.color, width: 1.5 },
      },
    ];
  }
}
