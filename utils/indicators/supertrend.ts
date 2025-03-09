import { Indicator, type Trace } from "./base-indicator"
import type { DataPoint } from "../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "./configurable-indicator"

interface SupertrendResult {
  trend: (1 | -1 | null)[] // 1 for uptrend, -1 for downtrend
  trendLine: (number | null)[] // The actual supertrend line values
  upperBand: (number | null)[]
  lowerBand: (number | null)[]
}

export class SupertrendIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Supertrend"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "period", type: "number", label: "ATR Period", value: 10, min: 1, max: 100, step: 1 },
    { name: "multiplier", type: "number", label: "ATR Multiplier", value: 3, min: 0.1, max: 10, step: 0.1 },
    { name: "upColor", type: "string", label: "Uptrend Color", value: "rgb(34, 197, 94)" }, // Green
    { name: "downColor", type: "string", label: "Downtrend Color", value: "rgb(239, 68, 68)" }, // Red
  ]

  private result: SupertrendResult | null = null
  private period: number
  private multiplier: number
  private upColor: string
  private downColor: string

  constructor(
    data: DataPoint[],
    period = 10,
    multiplier = 3,
    upColor = "rgb(34, 197, 94)",
    downColor = "rgb(239, 68, 68)",
  ) {
    super(data)
    this.period = period
    this.multiplier = multiplier
    this.upColor = upColor
    this.downColor = downColor
  }

  getParameters(): IndicatorParameter[] {
    return SupertrendIndicator.defaultParams
  }

  setParameters(params: Record<string, any>): void {
    if (params.period) this.period = params.period
    if (params.multiplier) this.multiplier = params.multiplier
    if (params.upColor) this.upColor = params.upColor
    if (params.downColor) this.downColor = params.downColor
    this.calculate()
  }

  private calculateTR(high: number, low: number, prevClose: number | null): number {
    if (prevClose === null) return high - low

    return Math.max(
      high - low, // Current high - low
      Math.abs(high - prevClose), // Current high - previous close
      Math.abs(low - prevClose), // Current low - previous close
    )
  }

  private calculateATR(): number[] {
    const tr: number[] = []
    const atr: number[] = []

    // Calculate True Range
    for (let i = 0; i < this.data.length; i++) {
      const prevClose = i > 0 ? this.data[i - 1].close : null
      tr.push(this.calculateTR(this.data[i].high, this.data[i].low, prevClose))
    }

    // Calculate initial ATR (Simple Moving Average of TR)
    let sum = 0
    for (let i = 0; i < this.period; i++) {
      sum += tr[i]
    }
    atr.push(sum / this.period)

    // Calculate subsequent ATR values using smoothing
    for (let i = this.period; i < tr.length; i++) {
      atr.push((atr[atr.length - 1] * (this.period - 1) + tr[i]) / this.period)
    }

    return atr
  }

  calculate(): void {
    const atr = this.calculateATR()
    const upperBand: (number | null)[] = []
    const lowerBand: (number | null)[] = []
    const trend: (1 | -1 | null)[] = []
    const trendLine: (number | null)[] = []

    // Initialize arrays with nulls for the first 'period' elements
    for (let i = 0; i < this.period - 1; i++) {
      upperBand.push(null)
      lowerBand.push(null)
      trend.push(null)
      trendLine.push(null)
    }

    // Calculate initial bands and trend
    for (let i = this.period - 1; i < this.data.length; i++) {
      const hl2 = (this.data[i].high + this.data[i].low) / 2
      const currentATR = atr[i - this.period + 1]

      const basicUpperBand = hl2 + this.multiplier * currentATR
      const basicLowerBand = hl2 - this.multiplier * currentATR

      // Calculate final upper band
      const finalUpperBand =
        i === this.period - 1
          ? basicUpperBand
          : basicUpperBand < upperBand[i - 1]! && this.data[i - 1].close > upperBand[i - 1]!
            ? upperBand[i - 1]!
            : basicUpperBand

      // Calculate final lower band
      const finalLowerBand =
        i === this.period - 1
          ? basicLowerBand
          : basicLowerBand > lowerBand[i - 1]! && this.data[i - 1].close < lowerBand[i - 1]!
            ? lowerBand[i - 1]!
            : basicLowerBand

      upperBand.push(finalUpperBand)
      lowerBand.push(finalLowerBand)

      // Determine trend
      if (i === this.period - 1) {
        // Initial trend
        const initialTrend = this.data[i].close > (finalUpperBand + finalLowerBand) / 2 ? 1 : -1
        trend.push(initialTrend)
        trendLine.push(initialTrend === 1 ? finalLowerBand : finalUpperBand)
      } else {
        const prevTrend = trend[i - 1]!
        const prevTrendLine = trendLine[i - 1]!

        if (prevTrend === 1) {
          // Previous trend was up
          if (this.data[i].close < finalLowerBand) {
            // Price closed below lower band - trend changes to down
            trend.push(-1)
            trendLine.push(finalUpperBand)
          } else {
            // Trend remains up
            trend.push(1)
            trendLine.push(Math.max(finalLowerBand, prevTrendLine))
          }
        } else {
          // Previous trend was down
          if (this.data[i].close > finalUpperBand) {
            // Price closed above upper band - trend changes to up
            trend.push(1)
            trendLine.push(finalLowerBand)
          } else {
            // Trend remains down
            trend.push(-1)
            trendLine.push(Math.min(finalUpperBand, prevTrendLine))
          }
        }
      }
    }

    this.result = {
      trend,
      trendLine,
      upperBand,
      lowerBand,
    }
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate()
    }

    const times = this.data.map((d) => d.time)
    const { trend, trendLine } = this.result!

    // Split the trend line into uptrend and downtrend segments
    const upTrendSegments: { x: string[]; y: number[] }[] = []
    const downTrendSegments: { x: string[]; y: number[] }[] = []

    let currentSegment: { x: string[]; y: number[] } = { x: [], y: [] }
    let currentTrend: 1 | -1 | null = null

    for (let i = 0; i < trend.length; i++) {
      if (trend[i] === null || trendLine[i] === null) continue

      if (trend[i] !== currentTrend) {
        // Start a new segment
        if (currentSegment.x.length > 0) {
          // Store the previous segment
          if (currentTrend === 1) {
            upTrendSegments.push(currentSegment)
          } else if (currentTrend === -1) {
            downTrendSegments.push(currentSegment)
          }
        }
        currentSegment = { x: [times[i]], y: [trendLine[i]!] }
        currentTrend = trend[i]
      } else {
        // Continue current segment
        currentSegment.x.push(times[i])
        currentSegment.y.push(trendLine[i]!)
      }
    }

    // Add the last segment
    if (currentSegment.x.length > 0 && currentTrend !== null) {
      if (currentTrend === 1) {
        upTrendSegments.push(currentSegment)
      } else {
        downTrendSegments.push(currentSegment)
      }
    }

    const traces: Trace[] = []

    // Add uptrend segments
    upTrendSegments.forEach((segment, index) => {
      traces.push({
        x: segment.x,
        y: segment.y,
        type: "scatter",
        mode: "lines",
        name: index === 0 ? "Supertrend (Buy)" : "Supertrend (Buy) cont.",
        line: { color: this.upColor, width: 2 },
        showlegend: index === 0,
      })
    })

    // Add downtrend segments
    downTrendSegments.forEach((segment, index) => {
      traces.push({
        x: segment.x,
        y: segment.y,
        type: "scatter",
        mode: "lines",
        name: index === 0 ? "Supertrend (Sell)" : "Supertrend (Sell) cont.",
        line: { color: this.downColor, width: 2 },
        showlegend: index === 0,
      })
    })

    return traces
  }
}

