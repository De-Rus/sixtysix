import { Indicator, type Trace } from "../base/base-indicator"
import type { DataPoint } from "../../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "../base/configurable-indicator"
import { calculateEMA } from "../calculations/ema"

export class EMAIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "EMA"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "period", type: "number", label: "Period", value: 14, min: 1, max: 200, step: 1 },
    { name: "color", type: "color", label: "Color", value: "rgba(16, 185, 129, 1)" },
  ]
  private result: (number | null)[] = []
  private period: number
  private color: string

  constructor(data: DataPoint[], period = 14, color = "rgba(16, 185, 129, 1)") {
    super(data)
    this.period = period
    this.color = color
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
    ]
  }

  setParameters(params: Record<string, any>): void {
    if (params.period !== undefined) this.period = params.period
    if (params.color !== undefined) this.color = params.color
    this.calculate() // Recalculate with new parameters
  }

  calculate(): void {
    this.result = calculateEMA(this.data, this.period)
  }

  generateTraces(): Trace[] {
    if (this.result.length === 0) {
      this.calculate()
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
    ]
  }
}

