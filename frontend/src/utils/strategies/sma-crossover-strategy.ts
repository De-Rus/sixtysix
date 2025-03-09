import { BaseStrategy } from "./base-strategy"
import { SMACrossoverIndicator } from "../indicators/sma-crossover"
import type { DataPoint } from "@/types/chart-types"
import type { Signal, StrategyParameter } from "@/types/strategy-types"

export class SMACrossoverStrategy extends BaseStrategy {
  private fastPeriod: number
  private slowPeriod: number
  private indicator: SMACrossoverIndicator | null = null

  constructor(fastPeriod = 20, slowPeriod = 50) {
    super(
      "SMA Crossover",
      "Generates buy signals when fast SMA crosses above slow SMA, and sell signals when fast SMA crosses below slow SMA",
      { fastPeriod, slowPeriod },
    )

    this.fastPeriod = fastPeriod
    this.slowPeriod = slowPeriod
  }

  initialize(data: DataPoint[]): void {
    super.initialize(data)
    this.indicator = new SMACrossoverIndicator(data, this.fastPeriod, this.slowPeriod)
  }

  update(newData: DataPoint[]): void {
    super.update(newData)
    this.indicator = new SMACrossoverIndicator(newData, this.fastPeriod, this.slowPeriod)
  }

  generateSignals(): Signal[] {
    if (!this.indicator) {
      return []
    }

    const result = this.indicator.calculate()

    return result.crossovers.map((crossover) => {
      const side = crossover.type === "bullish" ? "buy" : "sell"
      const reason =
        crossover.type === "bullish"
          ? `Fast SMA (${this.fastPeriod}) crossed above Slow SMA (${this.slowPeriod})`
          : `Fast SMA (${this.fastPeriod}) crossed below Slow SMA (${this.slowPeriod})`

      return this.createSignal(crossover.time, crossover.price, side, reason)
    })
  }

  getParameters(): StrategyParameter[] {
    return [
      {
        name: "fastPeriod",
        type: "number",
        label: "Fast SMA Period",
        value: this.fastPeriod,
        min: 1,
        max: 200,
        step: 1,
      },
      {
        name: "slowPeriod",
        type: "number",
        label: "Slow SMA Period",
        value: this.slowPeriod,
        min: 1,
        max: 200,
        step: 1,
      },
    ]
  }

  setParameters(params: Record<string, any>): void {
    if (params.fastPeriod !== undefined) {
      this.fastPeriod = params.fastPeriod
    }

    if (params.slowPeriod !== undefined) {
      this.slowPeriod = params.slowPeriod
    }

    // Reinitialize the indicator with new parameters
    if (this.data.length > 0) {
      this.indicator = new SMACrossoverIndicator(this.data, this.fastPeriod, this.slowPeriod)
    }
  }
}

