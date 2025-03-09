import { SMAIndicator } from "./indicators/implementations/sma-indicator"
import { EMAIndicator } from "./indicators/implementations/ema-indicator"
import { RSIIndicator } from "./indicators/rsi"
import { MACDIndicator } from "./indicators/macd"
import { BollingerBandsIndicator } from "./indicators/bollinger-bands"
import { IchimokuIndicator } from "./indicators/ichimoku"

// Use the static defaultParams from each indicator class
export const INDICATOR_CONFIGS = {
  sma: {
    label: SMAIndicator.name,
    defaultParams: SMAIndicator.defaultParams,
  },
  ema: {
    label: EMAIndicator.name,
    defaultParams: EMAIndicator.defaultParams,
  },
  rsi: {
    label: RSIIndicator.name,
    defaultParams: RSIIndicator.defaultParams,
  },
  macd: {
    label: MACDIndicator.name,
    defaultParams: MACDIndicator.defaultParams,
  },
  bollinger: {
    label: BollingerBandsIndicator.name,
    defaultParams: BollingerBandsIndicator.defaultParams,
  },
  ichimoku: {
    label: IchimokuIndicator.name,
    defaultParams: IchimokuIndicator.defaultParams,
  },
}

// Export other chart configuration constants
export const DEFAULT_CHART_HEIGHT = 500
export const DEFAULT_SUBPLOT_HEIGHT = 150
export const DEFAULT_CHART_MARGIN = { l: 50, r: 50, t: 50, b: 50 }
export const DEFAULT_CHART_PADDING = { l: 10, r: 10, t: 10, b: 10 }

