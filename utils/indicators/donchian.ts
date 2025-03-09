import { Indicator, type Trace } from "./base-indicator"
import type { DataPoint } from "../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "./configurable-indicator"

interface DonchianResult {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
}

export class DonchianChannelsIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Donchian Channels"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "period", type: "number", label: "Period", value: 20, min: 1, max: 100, step: 1 },
    { name: "upperColor", type: "string", label: "Upper Band Color", value: "rgb(34, 197, 94)" }, // Green
    { name: "middleColor", type: "string", label: "Middle Line Color", value: "rgb(234, 179, 8)" }, // Amber
    { name: "lowerColor", type: "string", label: "Lower Band Color", value: "rgb(239, 68, 68)" }, // Red
    { name: "fillOpacity", type: "number", label: "Fill Opacity", value: 0.1, min: 0, max: 1, step: 0.1 },
  ]

  private result: DonchianResult | null = null
  private period: number
  private upperColor: string
  private middleColor: string
  private lowerColor: string
  private fillOpacity: number

  constructor(
    data: DataPoint[],
    period = 20,
    upperColor = "rgb(34, 197, 94)",
    middleColor = "rgb(234, 179, 8)",
    lowerColor = "rgb(239, 68, 68)",
    fillOpacity = 0.1,
  ) {
    super(data)
    this.period = period
    this.upperColor = upperColor
    this.middleColor = middleColor
    this.lowerColor = lowerColor
    this.fillOpacity = fillOpacity
  }

  getParameters(): IndicatorParameter[] {
    return DonchianChannelsIndicator.defaultParams
  }

  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period
    if (params.upperColor) this.upperColor = params.upperColor
    if (params.middleColor) this.middleColor = params.middleColor
    if (params.lowerColor) this.lowerColor = params.lowerColor
    if (params.fillOpacity !== undefined) this.fillOpacity = params.fillOpacity
    this.calculate()
  }

  private calculateChannels(): DonchianResult {
    const upper: (number | null)[] = []
    const middle: (number | null)[] = []
    const lower: (number | null)[] = []

    // Calculate channels for each point
    for (let i = 0; i < this.data.length; i++) {
      if (i < this.period - 1) {
        // Not enough data for the period yet
        upper.push(null)
        middle.push(null)
        lower.push(null)
        continue
      }

      // Get the data window for the current period
      const window = this.data.slice(i - this.period + 1, i + 1)

      // Calculate highest high and lowest low in the window
      const highestHigh = Math.max(...window.map((d) => d.high))
      const lowestLow = Math.min(...window.map((d) => d.low))

      // Calculate middle line (average of highest high and lowest low)
      const middleLine = (highestHigh + lowestLow) / 2

      upper.push(highestHigh)
      middle.push(middleLine)
      lower.push(lowestLow)
    }

    return { upper, middle, lower }
  }

  calculate(): void {
    this.result = this.calculateChannels()
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate()
    }

    const times = this.data.map((d) => d.time)

    // Helper function to adjust color opacity
    const adjustOpacity = (color: string, opacity: number) => {
      if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`)
      }
      return color
    }

    return [
      // Upper channel line
      {
        x: times,
        y: this.result!.upper,
        type: "scatter",
        mode: "lines",
        name: `Upper Channel (${this.period})`,
        line: { color: this.upperColor, width: 1.5 },
      },
      // Middle line
      {
        x: times,
        y: this.result!.middle,
        type: "scatter",
        mode: "lines",
        name: "Middle Line",
        line: { color: this.middleColor, width: 1, dash: "dash" },
      },
      // Lower channel line with fill
      {
        x: times,
        y: this.result!.lower,
        type: "scatter",
        mode: "lines",
        name: `Lower Channel (${this.period})`,
        line: { color: this.lowerColor, width: 1.5 },
        fill: "tonexty",
        fillcolor: adjustOpacity(this.upperColor, this.fillOpacity),
      },
    ]
  }
}

