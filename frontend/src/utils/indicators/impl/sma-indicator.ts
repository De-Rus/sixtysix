import { Indicator, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";
import type {
  ConfigurableIndicator,
  IndicatorParameter,
} from "../base/configurable-indicator";
import { calculateSMA } from "../calculations/sma";

export class SMAIndicator extends Indicator implements ConfigurableIndicator {
  static readonly indicatorName = "SMA";
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
      value: "rgba(249, 115, 22, 1)",
    },
  ];
  private result: (number | null)[] = [];
  private period: number;
  private color: string;

  constructor(data: DataPoint[], period = 14, color = "rgba(249, 115, 22, 1)") {
    super(data);
    this.period = period;
    this.color = color;
  }

  getParameters(): IndicatorParameter[] {
    return [
      {
        name: "period",
        type: "number",
        label: "Period",
        value: this.period,
        min: 1,
        max: 200,
        step: 1,
      },
      {
        name: "color",
        type: "color",
        label: "Color",
        value: this.color,
      },
    ];
  }

  setParameters(params: Record<string, any>): void {
    if (params.period !== undefined) this.period = params.period;
    if (params.color !== undefined) this.color = params.color;
    this.calculate(); // Recalculate with new parameters
  }

  calculate(): void {
    this.result = calculateSMA(this.data, this.period);
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
        name: `SMA (${this.period})`,
        line: { color: this.color, width: 1.5 },
      },
    ];
  }
}
