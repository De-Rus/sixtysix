import {
  BollingerBandsIndicator,
  EMAIndicator,
  IchimokuIndicator,
  RSIIndicator,
  SMAIndicator,
} from "./indicators";
import { MACDIndicator } from "./indicators/impl/macd";

// Use the static defaultParams from each indicator class
export const INDICATOR_CONFIGS = {
  sma: {
    label: SMAIndicator.indicatorName,
    defaultParams: SMAIndicator.defaultParams,
  },
  ema: {
    label: EMAIndicator.indicatorName,
    defaultParams: EMAIndicator.defaultParams,
  },
  rsi: {
    label: RSIIndicator.indicatorName,
    defaultParams: RSIIndicator.defaultParams,
  },
  macd: {
    label: MACDIndicator.indicatorName,
    defaultParams: MACDIndicator.defaultParams,
  },
  bollinger: {
    label: BollingerBandsIndicator.indicatorName,
    defaultParams: BollingerBandsIndicator.defaultParams,
  },
  ichimoku: {
    label: IchimokuIndicator.indicatorName,
    defaultParams: IchimokuIndicator.defaultParams,
  },
};

// Export other chart configuration constants
export const DEFAULT_CHART_HEIGHT = 500;
export const DEFAULT_SUBPLOT_HEIGHT = 150;
export const DEFAULT_CHART_MARGIN = { l: 50, r: 50, t: 50, b: 50 };
export const DEFAULT_CHART_PADDING = { l: 10, r: 10, t: 10, b: 10 };
