import { Indicator, type Trace } from "./base-indicator"
import type { DataPoint } from "../../types/chart-types"
import type { ConfigurableIndicator, IndicatorParameter } from "./configurable-indicator"

interface Point {
  index: number
  time: string
  price: number
}

interface Channel {
  upperLine: {
    start: Point
    end: Point
  }
  lowerLine: {
    start: Point
    end: Point
  }
  slope: number
  width: number
  futurePoints: {
    upper: { time: string; price: number }[]
    lower: { time: string; price: number }[]
  }
}

interface ChannelsResult {
  channels: Channel[]
}

export class ChannelsIndicator extends Indicator implements ConfigurableIndicator {
  static readonly name = "Trend Channels"
  static readonly defaultParams: IndicatorParameter[] = [
    { name: "lookback", type: "number", label: "Lookback Period", value: 5, min: 2, max: 20, step: 1 },
    { name: "minSwings", type: "number", label: "Minimum Swings", value: 3, min: 2, max: 10, step: 1 },
    { name: "maxChannels", type: "number", label: "Maximum Channels", value: 3, min: 1, max: 5, step: 1 },
    { name: "futurePoints", type: "number", label: "Future Points", value: 15, min: 0, max: 50, step: 1 },
    { name: "channelColor", type: "string", label: "Channel Color", value: "rgb(234, 179, 8)" },
    { name: "fillOpacity", type: "number", label: "Fill Opacity", value: 0.1, min: 0, max: 1, step: 0.1 },
  ]

  private result: ChannelsResult | null = null
  private lookback: number
  private minSwings: number
  private maxChannels: number
  private futurePoints: number
  private channelColor: string
  private fillOpacity: number

  constructor(
    data: DataPoint[],
    lookback = 5,
    minSwings = 3,
    maxChannels = 3,
    futurePoints = 15,
    channelColor = "rgb(234, 179, 8)",
    fillOpacity = 0.1,
  ) {
    super(data)
    this.lookback = lookback
    this.minSwings = minSwings
    this.maxChannels = maxChannels
    this.futurePoints = futurePoints
    this.channelColor = channelColor
    this.fillOpacity = fillOpacity
  }

  getParameters(): IndicatorParameter[] {
    return ChannelsIndicator.defaultParams
  }

  setParameters(params: Record<string, any>): void {
    if (params.lookback) this.lookback = params.lookback
    if (params.minSwings) this.minSwings = params.minSwings
    if (params.maxChannels) this.maxChannels = params.maxChannels
    if (params.futurePoints) this.futurePoints = params.futurePoints
    if (params.channelColor) this.channelColor = params.channelColor
    if (params.fillOpacity !== undefined) this.fillOpacity = params.fillOpacity
    this.calculate()
  }

  private findSwingPoints(): { highs: Point[]; lows: Point[] } {
    const highs: Point[] = []
    const lows: Point[] = []

    for (let i = this.lookback; i < this.data.length - this.lookback; i++) {
      let isHigh = true
      let isLow = true

      for (let j = i - this.lookback; j <= i + this.lookback; j++) {
        if (j !== i) {
          if (this.data[j].high > this.data[i].high) isHigh = false
          if (this.data[j].low < this.data[i].low) isLow = false
        }
      }

      if (isHigh) {
        highs.push({
          index: i,
          time: this.data[i].time,
          price: this.data[i].high,
        })
      }
      if (isLow) {
        lows.push({
          index: i,
          time: this.data[i].time,
          price: this.data[i].low,
        })
      }
    }

    return { highs, lows }
  }

  private findTrendChannel(points: Point[], isUpper: boolean): Channel[] {
    const channels: Channel[] = []

    // Need at least minSwings points to form a channel
    if (points.length < this.minSwings) return channels

    // Try all possible combinations of start and end points
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const start = points[i]
        const end = points[j]

        // Calculate slope and intercept of the line
        const dx = end.index - start.index
        const dy = end.price - start.price
        const slope = dy / dx

        // Skip if slope is too steep (more than 45 degrees)
        if (Math.abs(slope) > 1) continue

        // Find parallel line
        let maxDistance = Number.NEGATIVE_INFINITY
        let minDistance = Number.POSITIVE_INFINITY
        let upperStart = start
        let upperEnd = end
        let lowerStart = start
        let lowerEnd = end

        // Check all points against this line
        for (const point of points) {
          // Calculate perpendicular distance from point to line
          const distance =
            (slope * point.index - point.price + (start.price - slope * start.index)) / Math.sqrt(1 + slope * slope)

          if (distance > maxDistance) {
            maxDistance = distance
            if (!isUpper) {
              upperStart = { ...point, price: point.price }
              upperEnd = { ...point, price: point.price }
            }
          }
          if (distance < minDistance) {
            minDistance = distance
            if (isUpper) {
              lowerStart = { ...point, price: point.price }
              lowerEnd = { ...point, price: point.price }
            }
          }
        }

        const width = Math.abs(maxDistance - minDistance)
        const channelSlope = (slope * 100).toFixed(2)

        // Generate future points
        const futurePoints = {
          upper: this.generateFuturePoints(upperEnd, slope, this.futurePoints),
          lower: this.generateFuturePoints(lowerEnd, slope, this.futurePoints),
        }

        channels.push({
          upperLine: {
            start: upperStart,
            end: upperEnd,
          },
          lowerLine: {
            start: lowerStart,
            end: lowerEnd,
          },
          slope: Number.parseFloat(channelSlope),
          width,
          futurePoints,
        })
      }
    }

    return channels
  }

  private generateFuturePoints(endPoint: Point, slope: number, numPoints: number): { time: string; price: number }[] {
    const points: { time: string; price: number }[] = []
    const timeInterval = new Date(this.data[1].time).getTime() - new Date(this.data[0].time).getTime()
    const endTime = new Date(endPoint.time).getTime()

    for (let i = 1; i <= numPoints; i++) {
      const futureTime = new Date(endTime + timeInterval * i).toISOString()
      const futurePrice = endPoint.price + slope * i
      points.push({ time: futureTime, price: futurePrice })
    }

    return points
  }

  calculate(): void {
    const { highs, lows } = this.findSwingPoints()

    // Find channels using both highs and lows
    const upperChannels = this.findTrendChannel(highs, true)
    const lowerChannels = this.findTrendChannel(lows, false)

    // Combine and sort channels by width
    const allChannels = [...upperChannels, ...lowerChannels]
      .sort((a, b) => b.width - a.width)
      .slice(0, this.maxChannels)

    this.result = { channels: allChannels }
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

    this.result!.channels.forEach((channel, index) => {
      // Upper channel line
      traces.push({
        x: [channel.upperLine.start.time, channel.upperLine.end.time, ...channel.futurePoints.upper.map((p) => p.time)],
        y: [
          channel.upperLine.start.price,
          channel.upperLine.end.price,
          ...channel.futurePoints.upper.map((p) => p.price),
        ],
        type: "scatter",
        mode: "lines",
        name: `Channel ${index + 1} (${channel.slope}%)`,
        line: {
          color: this.channelColor,
          width: 2,
        },
      })

      // Lower channel line with fill
      traces.push({
        x: [channel.lowerLine.start.time, channel.lowerLine.end.time, ...channel.futurePoints.lower.map((p) => p.time)],
        y: [
          channel.lowerLine.start.price,
          channel.lowerLine.end.price,
          ...channel.futurePoints.lower.map((p) => p.price),
        ],
        type: "scatter",
        mode: "lines",
        name: `Channel ${index + 1}`,
        line: {
          color: this.channelColor,
          width: 2,
        },
        fill: "tonexty",
        fillcolor: adjustOpacity(this.channelColor, this.fillOpacity),
        showlegend: false,
      })
    })

    return traces
  }
}

