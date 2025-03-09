import { Indicator, type Trace } from "./base-indicator"
import type { DataPoint } from "../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "./configurable-indicator"

interface TrendPoint {
  index: number
  time: string
  price: number
  type: "high" | "low"
}

interface Trendline {
  startPoint: TrendPoint
  endPoint: TrendPoint
  futurePoints: { time: string; price: number }[]
  type: "uptrend" | "downtrend"
}

interface TrendlineResult {
  trendlines: Trendline[]
  pivotPoints: TrendPoint[]
}

export class TrendlineIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Trendlines"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "lookback", type: "number", label: "Lookback Period", value: 5, min: 1, max: 20, step: 1 },
    { name: "threshold", type: "number", label: "Trend Threshold", value: 0.02, min: 0.001, max: 0.1, step: 0.001 },
    { name: "futurePoints", type: "number", label: "Future Points", value: 20, min: 5, max: 50, step: 1 },
    { name: "maxFutureLines", type: "number", label: "Max Future Lines", value: 5, min: 1, max: 10, step: 1 },
    { name: "uptrendColor", type: "string", label: "Uptrend Color", value: "rgb(59, 130, 246)" }, // Blue
    { name: "downtrendColor", type: "string", label: "Downtrend Color", value: "rgb(239, 68, 68)" }, // Red
    { name: "pivotOpacity", type: "number", label: "Pivot Point Opacity", value: 0.5, min: 0, max: 1, step: 0.1 },
    { name: "projectionOpacity", type: "number", label: "Projection Opacity", value: 0.5, min: 0, max: 1, step: 0.1 },
  ]

  private result: TrendlineResult | null = null
  private lookback: number
  private threshold: number
  private futurePoints: number
  private maxFutureLines: number
  private uptrendColor: string
  private downtrendColor: string
  private pivotOpacity: number
  private projectionOpacity: number

  constructor(
    data: DataPoint[],
    lookback = 5,
    threshold = 0.02,
    futurePoints = 20,
    maxFutureLines = 5,
    uptrendColor = "rgb(59, 130, 246)", // Blue
    downtrendColor = "rgb(239, 68, 68)", // Red
    pivotOpacity = 0.5,
    projectionOpacity = 0.5,
  ) {
    super(data)
    this.lookback = lookback
    this.threshold = threshold
    this.futurePoints = futurePoints
    this.maxFutureLines = maxFutureLines
    this.uptrendColor = uptrendColor
    this.downtrendColor = downtrendColor
    this.pivotOpacity = pivotOpacity
    this.projectionOpacity = projectionOpacity
  }

  getParameters(): IndicatorParameter[] {
    return [
      {
        name: "lookback",
        type: "number",
        label: "Lookback Period",
        value: this.lookback,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        name: "threshold",
        type: "number",
        label: "Trend Threshold",
        value: this.threshold,
        min: 0.001,
        max: 0.1,
        step: 0.001,
      },
      {
        name: "futurePoints",
        type: "number",
        label: "Future Points",
        value: this.futurePoints,
        min: 5,
        max: 50,
        step: 1,
      },
      {
        name: "maxFutureLines",
        type: "number",
        label: "Max Future Lines",
        value: this.maxFutureLines,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        name: "uptrendColor",
        type: "string",
        label: "Uptrend Color",
        value: this.uptrendColor,
      },
      {
        name: "downtrendColor",
        type: "string",
        label: "Downtrend Color",
        value: this.downtrendColor,
      },
      {
        name: "pivotOpacity",
        type: "number",
        label: "Pivot Point Opacity",
        value: this.pivotOpacity,
        min: 0,
        max: 1,
        step: 0.1,
      },
      {
        name: "projectionOpacity",
        type: "number",
        label: "Projection Opacity",
        value: this.projectionOpacity,
        min: 0,
        max: 1,
        step: 0.1,
      },
    ]
  }

  setParameters(params: Record<string, any>): void {
    if (params.lookback) this.lookback = params.lookback
    if (params.threshold) this.threshold = params.threshold
    if (params.futurePoints) this.futurePoints = params.futurePoints
    if (params.maxFutureLines) this.maxFutureLines = params.maxFutureLines
    if (params.uptrendColor) this.uptrendColor = params.uptrendColor
    if (params.downtrendColor) this.downtrendColor = params.downtrendColor
    if (params.pivotOpacity !== undefined) this.pivotOpacity = params.pivotOpacity
    if (params.projectionOpacity !== undefined) this.projectionOpacity = params.projectionOpacity
    this.calculate()
  }

  private isPivotHigh(index: number): boolean {
    const prices = this.data.map((d) => d.high)
    const start = Math.max(0, index - this.lookback)
    const end = Math.min(prices.length - 1, index + this.lookback)

    const currentPrice = prices[index]
    for (let i = start; i <= end; i++) {
      if (i !== index && prices[i] > currentPrice) {
        return false
      }
    }
    return true
  }

  private isPivotLow(index: number): boolean {
    const prices = this.data.map((d) => d.low)
    const start = Math.max(0, index - this.lookback)
    const end = Math.min(prices.length - 1, index + this.lookback)

    const currentPrice = prices[index]
    for (let i = start; i <= end; i++) {
      if (i !== index && prices[i] < currentPrice) {
        return false
      }
    }
    return true
  }

  private findPivotPoints(): TrendPoint[] {
    const pivotPoints: TrendPoint[] = []

    // Skip first and last few points based on lookback
    for (let i = this.lookback; i < this.data.length - this.lookback; i++) {
      if (this.isPivotHigh(i)) {
        pivotPoints.push({
          index: i,
          time: this.data[i].time,
          price: this.data[i].high,
          type: "high",
        })
      }
      if (this.isPivotLow(i)) {
        pivotPoints.push({
          index: i,
          time: this.data[i].time,
          price: this.data[i].low,
          type: "low",
        })
      }
    }

    return pivotPoints
  }

  private generateFuturePoints(startPoint: TrendPoint, endPoint: TrendPoint): { time: string; price: number }[] {
    const futurePoints: { time: string; price: number }[] = []

    // Calculate slope (price change per bar)
    const slope = (endPoint.price - startPoint.price) / (endPoint.index - startPoint.index)

    // Get the time difference between bars
    const lastDate = new Date(this.data[this.data.length - 1].time)
    const secondLastDate = new Date(this.data[this.data.length - 2].time)
    const timeDiffMs = lastDate.getTime() - secondLastDate.getTime()

    // Generate future points
    for (let i = 1; i <= this.futurePoints; i++) {
      const futureIndex = endPoint.index + i
      const futurePrice = endPoint.price + slope * i

      // Calculate future time
      const futureDate = new Date(lastDate.getTime() + timeDiffMs * i)

      futurePoints.push({
        time: futureDate.toISOString(),
        price: futurePrice,
      })
    }

    return futurePoints
  }

  private findTrendlines(pivotPoints: TrendPoint[]): Trendline[] {
    const trendlines: Trendline[] = []
    const highs = pivotPoints.filter((p) => p.type === "high")
    const lows = pivotPoints.filter((p) => p.type === "low")

    // Find downtrend lines (connecting highs)
    for (let i = 0; i < highs.length - 1; i++) {
      const start = highs[i]
      const end = highs[i + 1]

      // Calculate slope
      const slope = (end.price - start.price) / (end.index - start.index)

      // Only add significant downtrends
      if (slope < -this.threshold) {
        const futurePoints = this.generateFuturePoints(start, end)
        trendlines.push({
          startPoint: start,
          endPoint: end,
          futurePoints,
          type: "downtrend",
        })
      }
    }

    // Find uptrend lines (connecting lows)
    for (let i = 0; i < lows.length - 1; i++) {
      const start = lows[i]
      const end = lows[i + 1]

      // Calculate slope
      const slope = (end.price - start.price) / (end.index - start.index)

      // Only add significant uptrends
      if (slope > this.threshold) {
        const futurePoints = this.generateFuturePoints(start, end)
        trendlines.push({
          startPoint: start,
          endPoint: end,
          futurePoints,
          type: "uptrend",
        })
      }
    }

    // Sort trendlines by end time (most recent first)
    return trendlines.sort((a, b) => new Date(b.endPoint.time).getTime() - new Date(a.endPoint.time).getTime())
  }

  calculate(): void {
    const pivotPoints = this.findPivotPoints()
    const trendlines = this.findTrendlines(pivotPoints)

    this.result = {
      trendlines,
      pivotPoints,
    }
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate()
    }

    const traces: Trace[] = []

    // Helper function to adjust color opacity
    const adjustOpacity = (color: string, opacity: number) => {
      if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`)
      }
      return color
    }

    // Add all trendlines but only show future projections for the most recent ones
    this.result!.trendlines.forEach((trendline, index) => {
      const color = trendline.type === "uptrend" ? this.uptrendColor : this.downtrendColor

      // Current trendline
      traces.push({
        x: [trendline.startPoint.time, trendline.endPoint.time],
        y: [trendline.startPoint.price, trendline.endPoint.price],
        type: "scatter",
        mode: "lines",
        name: `${trendline.type === "uptrend" ? "Uptrend" : "Downtrend"} ${index + 1}`,
        line: {
          color,
          width: 2,
          dash: "solid",
        },
        showlegend: false,
      })

      // Future projection only for the most recent lines
      if (index < this.maxFutureLines && trendline.futurePoints.length > 0) {
        traces.push({
          x: [trendline.endPoint.time, ...trendline.futurePoints.map((p) => p.time)],
          y: [trendline.endPoint.price, ...trendline.futurePoints.map((p) => p.price)],
          type: "scatter",
          mode: "lines",
          name: `${trendline.type === "uptrend" ? "Uptrend" : "Downtrend"} Projection ${index + 1}`,
          line: {
            color: adjustOpacity(color, this.projectionOpacity),
            width: 2,
            dash: "dot",
          },
          showlegend: false,
        })
      }
    })

    // Add pivot points
    const highPivots = this.result!.pivotPoints.filter((p) => p.type === "high")
    const lowPivots = this.result!.pivotPoints.filter((p) => p.type === "low")

    // Add high pivot points
    if (highPivots.length > 0) {
      traces.push({
        x: highPivots.map((p) => p.time),
        y: highPivots.map((p) => p.price),
        type: "scatter",
        mode: "markers",
        name: "Pivot Highs",
        marker: {
          symbol: "circle",
          size: 6,
          color: adjustOpacity(this.downtrendColor, this.pivotOpacity),
        },
        showlegend: false,
      })
    }

    // Add low pivot points
    if (lowPivots.length > 0) {
      traces.push({
        x: lowPivots.map((p) => p.time),
        y: lowPivots.map((p) => p.price),
        type: "scatter",
        mode: "markers",
        name: "Pivot Lows",
        marker: {
          symbol: "circle",
          size: 6,
          color: adjustOpacity(this.uptrendColor, this.pivotOpacity),
        },
        showlegend: false,
      })
    }

    return traces
  }
}

