import type { DataPoint } from "../types/chart-types"
import type { Trace } from "../utils/indicators/base-indicator"
import type { Indicator, ConfigurableIndicator } from "../utils/indicators/base-indicator"
import { IchimokuIndicator } from "../utils/indicators/ichimoku"
import { SMAIndicator, EMAIndicator } from "../utils/indicators/moving-averages"
import { SupertrendIndicator } from "../utils/indicators/supertrend"
import { SMACrossoverIndicator } from "../utils/indicators/sma-crossover"
import { TrendlineIndicator } from "../utils/indicators/trendlines"
import { SupportResistanceIndicator } from "../utils/indicators/support-resistance"
import { BollingerBandsIndicator } from "../utils/indicators/bollinger-bands"
import { ChannelsIndicator } from "../utils/indicators/channels"
import { MACDIndicator } from "../utils/indicators/macd"
import { RenkoIndicator } from "../utils/indicators/renko"
import { FibonacciIndicator } from "../utils/indicators/fibonacci"
import { ADXIndicator } from "../utils/indicators/adx"
import { ElliottWaveIndicator } from "../utils/indicators/elliott-wave"
import { SqueezeMomentumIndicator } from "../utils/indicators/squeeze-momentum"
import { ParabolicSARIndicator } from "../utils/indicators/parabolic-sar"
import { DonchianChannelsIndicator } from "../utils/indicators/donchian"
import { RSIIndicator } from "../utils/indicators/rsi"
import { generateOrderTraces } from "./order-traces"
import { generatePositionTraces } from "./position-traces"
import type { Order, Position } from "../types/trading-types"

/**
 * Generate all plot data for the chart
 */
export function generatePlotData({
  data,
  selectedIndicators,
  indicatorConfigs,
  darkMode,
  orders,
  positions,
}: {
  data: DataPoint[]
  selectedIndicators: string[]
  indicatorConfigs: Record<string, Record<string, any>>
  darkMode: boolean
  orders?: Order[]
  positions?: Position[]
}): any[] {
  console.log("Generating plot data with configs:", indicatorConfigs)
  if (!data.length) return []

  // Check if we have subplots
  const subplotIndicators = selectedIndicators.filter((indicatorId) => {
    switch (indicatorId) {
      case "macd":
      case "adx":
      case "squeezeMomentum":
      case "rsi":
        return true
      default:
        return false
    }
  })
  const hasSubplots = subplotIndicators.length > 0

  // Always add candlesticks first
  const mainPaneTraces: Trace[] = [
    {
      type: "candlestick",
      x: data.map((d) => d.time),
      open: data.map((d) => d.open),
      high: data.map((d) => d.high),
      low: data.map((d) => d.low),
      close: data.map((d) => d.close),
      name: "Candlesticks",
      increasing: {
        line: { color: darkMode ? "rgb(74, 222, 128)" : "rgb(34, 197, 94)" },
        fillcolor: darkMode ? "rgb(74, 222, 128)" : "rgb(34, 197, 94)",
      },
      decreasing: {
        line: { color: darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)" },
        fillcolor: darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)",
      },
      yaxis: "y",
      xaxis: hasSubplots ? "x" : undefined,
      hovertext: data.map(
        (d) =>
          `${new Date(d.time).toLocaleString()}<br>` +
          `O: ${d.open.toFixed(2)}<br>` +
          `H: ${d.high.toFixed(2)}<br>` +
          `L: ${d.low.toFixed(2)}<br>` +
          `C: ${d.close.toFixed(2)}`,
      ),
      hoverinfo: "text",
    } as unknown as Trace,
  ]

  // Add position traces first (so they appear behind orders)
  mainPaneTraces.push(...generatePositionTraces(positions, data))

  // Add order traces
  mainPaneTraces.push(...generateOrderTraces(orders, data))

  const subplotTraces: Trace[] = []

  // Process all selected indicators
  selectedIndicators.forEach((indicatorId) => {
    let indicator: Indicator | null = null
    const config = indicatorConfigs[indicatorId] || {}

    // Create the appropriate indicator instance
    switch (indicatorId) {
      case "renko":
        indicator = new RenkoIndicator(data)
        break
      case "macd":
        indicator = new MACDIndicator(data)
        break
      case "ichimoku":
        indicator = new IchimokuIndicator(data)
        break
      case "sma":
        indicator = new SMAIndicator(data)
        break
      case "ema":
        indicator = new EMAIndicator(data)
        break
      case "supertrend":
        indicator = new SupertrendIndicator(data)
        break
      case "smaCrossover":
        indicator = new SMACrossoverIndicator(data)
        break
      case "trendlines":
        indicator = new TrendlineIndicator(data)
        break
      case "supportResistance":
        indicator = new SupportResistanceIndicator(data)
        break
      case "bollingerBands":
        indicator = new BollingerBandsIndicator(data)
        break
      case "channels":
        indicator = new ChannelsIndicator(data)
        break
      case "fibonacci":
        indicator = new FibonacciIndicator(data)
        break
      case "adx":
        indicator = new ADXIndicator(data)
        break
      case "elliottWave":
        indicator = new ElliottWaveIndicator(data)
        break
      case "squeezeMomentum":
        indicator = new SqueezeMomentumIndicator(data)
        break
      case "parabolicSar":
        indicator = new ParabolicSARIndicator(data)
        break
      case "donchian":
        indicator = new DonchianChannelsIndicator(data)
        break
      case "rsi":
        indicator = new RSIIndicator(data)
        break
      default:
        break
    }

    if (indicator) {
      // Set any custom configuration
      if ("setParameters" in indicator) {
        ;(indicator as ConfigurableIndicator).setParameters(config)
      }

      // Get the indicator's traces
      const traces = indicator.generateTraces()

      // Add hoverinfo: "none" to all indicator traces
      traces.forEach((trace) => {
        trace.hoverinfo = "none"
      })

      // Add traces to appropriate array based on indicator config
      const indicatorConfig = (indicator.constructor as typeof Indicator).getConfig()
      if (indicatorConfig.subplot) {
        // For subplot traces, use corresponding axis number
        const subplotIndex = subplotIndicators.indexOf(indicatorId)
        if (subplotIndex !== -1) {
          const axisNumber = subplotIndex + 2 // yaxis2, yaxis3, etc.
          traces.forEach((trace) => {
            trace.xaxis = `x${axisNumber}`
            trace.yaxis = `y${axisNumber}`
            // Ensure the trace knows it belongs to a subplot
            trace.subplot = true
          })
          subplotTraces.push(...traces)
        }
      } else {
        // For main pane traces, explicitly set to main axes
        traces.forEach((trace) => {
          trace.xaxis = "x"
          trace.yaxis = "y"
          trace.subplot = false
        })
        mainPaneTraces.push(...traces)
      }
    }
  })

  return [...mainPaneTraces, ...subplotTraces]
}

