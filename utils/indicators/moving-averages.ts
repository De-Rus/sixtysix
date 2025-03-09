import { Indicator, type Trace } from "./base-indicator"
import type { DataPoint } from "../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "./configurable-indicator"

export class SMAIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Simple Moving Average"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "period", type: "number", label: "Period", value: 14, min: 1, max: 200, step: 1 },
    { name: "color", type: "color", label: "Line Color", value: "rgba(249, 115, 22, 1)" },
  ]

  private result: (number | null)[] = []
  private period: number
  private color: string

  constructor(data: DataPoint[], period = 14, color = "rgba(249, 115, 22, 1)") {
    super(data)
    this.period = period
    this.color = color
  }

  getParameters(): IndicatorParameter[] {
    return [
      { name: "period", type: "number", label: "Period", value: this.period, min: 1, max: 200, step: 1 },
      { name: "color", type: "color", label: "Line Color", value: this.color },
    ]
  }

  setParameters(params: Record<string, any>): void {
    if (params.period !== undefined) this.period = params.period
    if (params.color !== undefined) this.color = params.color
    this.calculate() // Recalculate with new parameters
  }

  calculate(): void {
    if (!this.data || this.data.length === 0) {
      this.result = []
      return
    }

    try {
      const result: (number | null)[] = []
      for (let i = 0; i < this.data.length; i++) {
        if (i < this.period - 1) {
          result.push(null)
        } else {
          let sum = 0
          for (let j = 0; j < this.period; j++) {
            sum += this.data[i - j].close
          }
          result.push(sum / this.period)
        }
      }
      this.result = result
    } catch (error) {
      console.error("Error calculating SMA:", error)
      this.result = []
    }
  }

  generateTraces(): Trace[] {
    if (this.result.length === 0) {
      this.calculate()
    }

    if (!this.data || this.data.length === 0 || this.result.length === 0) {
      return []
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
    ]
  }
}

export class EMAIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Exponential Moving Average"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "period", type: "number", label: "Period", value: 14, min: 1, max: 200, step: 1 },
    { name: "color", type: "color", label: "Line Color", value: "rgba(59, 130, 246, 1)" },
  ]

  private result: (number | null)[] = []
  private period: number
  private color: string

  constructor(data: DataPoint[], period = 14, color = "rgba(59, 130, 246, 1)") {
    super(data)
    this.period = period
    this.color = color
  }

  getParameters(): IndicatorParameter[] {
    return [
      { name: "period", type: "number", label: "Period", value: this.period, min: 1, max: 200, step: 1 },
      { name: "color", type: "color", label: "Line Color", value: this.color },
    ]
  }

  setParameters(params: Record<string, any>): void {
    if (params.period !== undefined) this.period = params.period
    if (params.color !== undefined) this.color = params.color
    this.calculate() // Recalculate with new parameters
  }

  calculate(): void {
    if (!this.data || this.data.length === 0) {
      this.result = []
      return
    }

    try {
      const result: (number | null)[] = []
      const multiplier = 2 / (this.period + 1)

      // Calculate SMA for the first EMA value
      let sum = 0
      for (let i = 0; i < this.period; i++) {
        sum += this.data[i].close
      }
      const sma = sum / this.period

      // Fill with nulls for the first period-1 values
      for (let i = 0; i < this.period - 1; i++) {
        result.push(null)
      }

      // Add the SMA as the first EMA value
      result.push(sma)

      // Calculate EMA for the rest of the values
      for (let i = this.period; i < this.data.length; i++) {
        const ema = (this.data[i].close - result[i - 1]!) * multiplier + result[i - 1]!
        result.push(ema)
      }

      this.result = result
    } catch (error) {
      console.error("Error calculating EMA:", error)
      this.result = []
    }
  }

  generateTraces(): Trace[] {
    if (this.result.length === 0) {
      this.calculate()
    }

    if (!this.data || this.data.length === 0 || this.result.length === 0) {
      return []
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

