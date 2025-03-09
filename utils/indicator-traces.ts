import type { DataPoint } from "../types/chart-types"
import { calculateIchimoku, calculateSMA, calculateEMA, calculateSupertrend } from "./indicator-calculations"

export interface Trace {
  type: string
  x: string[]
  y: (number | null)[]
  name: string
  mode?: string
  line?: {
    color: string
    width?: number
    dash?: string
  }
  fill?: string
  fillcolor?: string
  showlegend?: boolean
}

export function generateIchimokuTraces(data: DataPoint[]): Trace[] {
  const ichimoku = calculateIchimoku(data)
  const times = data.map((d) => d.time)

  // Future dates for cloud projection
  const futureDates = data.slice(-26).map((d, i) => {
    const futureDate = new Date(data[data.length - 1].time)
    futureDate.setDate(futureDate.getDate() + i + 1)
    return futureDate.toISOString().split("T")[0]
  })

  return [
    {
      x: times,
      y: ichimoku.tenkan,
      type: "scatter",
      mode: "lines",
      name: "Tenkan-sen (9)",
      line: { color: "rgb(59, 130, 246)" },
    },
    {
      x: times,
      y: ichimoku.kijun,
      type: "scatter",
      mode: "lines",
      name: "Kijun-sen (26)",
      line: { color: "rgb(239, 68, 68)" },
    },
    {
      x: times.concat(futureDates),
      y: ichimoku.senkouA.concat(ichimoku.futureSenkouA),
      type: "scatter",
      mode: "lines",
      name: "Senkou Span A",
      line: { color: "rgb(34, 197, 94)", dash: "dot" },
    },
    {
      x: times.concat(futureDates),
      y: ichimoku.senkouB.concat(ichimoku.futureSenkouB),
      type: "scatter",
      mode: "lines",
      name: "Senkou Span B",
      line: { color: "rgb(180, 83, 9)", dash: "dot" },
    },
    {
      x: times,
      y: ichimoku.chikou,
      type: "scatter",
      mode: "lines",
      name: "Chikou Span (26)",
      line: { color: "rgb(147, 51, 234)" },
    },
    {
      x: times.concat(futureDates).concat(data[data.length - 1].time),
      y: ichimoku.senkouA.concat(ichimoku.futureSenkouA).concat(ichimoku.senkouB[data.length - 1]),
      fill: "tonexty",
      type: "scatter",
      mode: "none",
      name: "Cloud",
      fillcolor: "rgba(255, 165, 0, 0.2)",
    },
  ]
}

export function generateSMATrace(data: DataPoint[]): Trace[] {
  const sma = calculateSMA(data, 14)
  return [
    {
      x: data.map((d) => d.time),
      y: sma,
      type: "scatter",
      mode: "lines",
      name: "SMA (14)",
      line: { color: "rgb(249, 115, 22)" },
    },
  ]
}

export function generateEMATrace(data: DataPoint[]): Trace[] {
  const ema = calculateEMA(data, 14)
  return [
    {
      x: data.map((d) => d.time),
      y: ema,
      type: "scatter",
      mode: "lines",
      name: "EMA (14)",
      line: { color: "rgb(6, 182, 212)" },
    },
  ]
}

export function generateSupertrendTraces(data: DataPoint[]): Trace[] {
  const supertrend = calculateSupertrend(data)
  const times = data.map((d) => d.time)

  // Split the data into uptrend and downtrend segments
  const greenSegments: [number, number][] = []
  const redSegments: [number, number][] = []

  for (let i = 0; i < supertrend.direction.length; i++) {
    if (supertrend.direction[i] === 1) {
      greenSegments.push([i, supertrend.supertrend[i]!])
    } else if (supertrend.direction[i] === -1) {
      redSegments.push([i, supertrend.supertrend[i]!])
    }
  }

  return [
    {
      x: times,
      y: supertrend.upperBand,
      type: "scatter",
      mode: "lines",
      name: "Supertrend Upper",
      line: {
        color: "rgba(239, 68, 68, 0.5)",
        width: 1,
        dash: "dot",
      },
      showlegend: false,
    },
    {
      x: times,
      y: supertrend.lowerBand,
      type: "scatter",
      mode: "lines",
      name: "Supertrend Lower",
      line: {
        color: "rgba(34, 197, 94, 0.5)",
        width: 1,
        dash: "dot",
      },
      showlegend: false,
    },
    ...(greenSegments.length > 0
      ? [
          {
            x: greenSegments.map(([i]) => times[i]),
            y: greenSegments.map(([, y]) => y),
            type: "scatter",
            mode: "lines",
            name: "Supertrend (Buy)",
            line: { color: "rgb(34, 197, 94)", width: 2 },
          },
        ]
      : []),
    ...(redSegments.length > 0
      ? [
          {
            x: redSegments.map(([i]) => times[i]),
            y: redSegments.map(([, y]) => y),
            type: "scatter",
            mode: "lines",
            name: "Supertrend (Sell)",
            line: { color: "rgb(239, 68, 68)", width: 2 },
          },
        ]
      : []),
  ]
}

export function generateCandlestickTrace(data: DataPoint[], darkMode = false): Trace {
  return {
    type: "candlestick",
    x: data.map((d) => d.time),
    open: data.map((d) => d.open),
    high: data.map((d) => d.high),
    low: data.map((d) => d.low),
    close: data.map((d) => d.close),
    name: "Candlesticks",
    increasing: { line: { color: darkMode ? "rgb(74, 222, 128)" : "rgb(34, 197, 94)" } },
    decreasing: { line: { color: darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)" } },
  } as unknown as Trace // Type assertion needed because Plotly types don't match exactly
}

