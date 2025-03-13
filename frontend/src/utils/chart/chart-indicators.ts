import { SMAIndicator } from "../indicators/impl/sma-indicator";
import { EMAIndicator } from "../indicators/impl/ema";
import { BollingerBandsIndicator } from "../indicators/impl/bollinger-bands";
import { MACDIndicator } from "../indicators/impl/macd";
import { RSIIndicator } from "../indicators/impl/rsi";
import { IchimokuIndicator } from "../indicators/impl/ichimoku";
import { INDICATOR_CONFIGS } from "../chart-config";

/**
 * Generates plot data for Plotly based on selected indicators and configurations
 * @param options Options for generating plot data
 * @returns Array of Plotly trace objects
 */
export function generatePlotData({
  data,
  selectedIndicators,
  indicatorConfigs,
  darkMode,
  orders,
  positions,
}: {
  data: any[];
  selectedIndicators: string[];
  indicatorConfigs: Record<string, any>;
  darkMode: boolean;
  orders: any[];
  positions: any[];
}) {
  if (!data || data.length === 0) {
    return [];
  }

  // Base candlestick trace
  const traces: any[] = [
    {
      type: "candlestick",
      x: data.map((d) => d.time),
      open: data.map((d) => d.open),
      high: data.map((d) => d.high),
      low: data.map((d) => d.low),
      close: data.map((d) => d.close),
      increasing: { line: { color: darkMode ? "#26a69a" : "#26a69a" } },
      decreasing: { line: { color: darkMode ? "#ef5350" : "#ef5350" } },
      name: "Price",
      yaxis: "y",
      xaxis: "x",
    },
  ];

  // Add volume trace
  traces.push({
    type: "bar",
    x: data.map((d) => d.time),
    y: data.map((d) => d.volume),
    name: "Volume",
    marker: {
      color: data.map((d, i) => {
        // Color based on price change
        if (i > 0) {
          return d.close > data[i - 1].close
            ? "rgba(38, 166, 154, 0.3)"
            : "rgba(239, 83, 80, 0.3)";
        }
        return "rgba(38, 166, 154, 0.3)";
      }),
    },
    yaxis: "y",
    xaxis: "x",
  });

  // Add indicators based on selection
  if (selectedIndicators?.includes("sma")) {
    // Get config or use defaults
    const config = indicatorConfigs?.sma || {};
    const period =
      config.period ||
      INDICATOR_CONFIGS.sma.defaultParams.find((p) => p.name === "period")
        ?.value;
    const color =
      config.color ||
      INDICATOR_CONFIGS.sma.defaultParams.find((p) => p.name === "color")
        ?.value;

    // Create indicator instance with proper parameters
    const smaIndicator = new SMAIndicator(data, period, color);
    const smaTraces = smaIndicator.generateTraces();
    traces.push(...smaTraces);
  }

  if (selectedIndicators?.includes("ema")) {
    // Get config or use defaults
    const config = indicatorConfigs?.ema || {};
    const period =
      config.period ||
      INDICATOR_CONFIGS.ema.defaultParams.find((p) => p.name === "period")
        ?.value;
    const color =
      config.color ||
      INDICATOR_CONFIGS.ema.defaultParams.find((p) => p.name === "color")
        ?.value;

    // Create indicator instance with proper parameters
    const emaIndicator = new EMAIndicator(data, period, color);
    const emaTraces = emaIndicator.generateTraces();
    traces.push(...emaTraces);
  }

  if (selectedIndicators?.includes("bollinger")) {
    // Get config or use defaults
    const config = indicatorConfigs?.bollinger || {};
    const period =
      config.period ||
      INDICATOR_CONFIGS.bollinger.defaultParams.find((p) => p.name === "period")
        ?.value;
    const stdDev =
      config.stdDev ||
      INDICATOR_CONFIGS.bollinger.defaultParams.find((p) => p.name === "stdDev")
        ?.value;
    const middleColor =
      config.middleColor ||
      INDICATOR_CONFIGS.bollinger.defaultParams.find(
        (p) => p.name === "middleColor"
      )?.value;
    const bandColor =
      config.bandColor ||
      INDICATOR_CONFIGS.bollinger.defaultParams.find(
        (p) => p.name === "bandColor"
      )?.value;
    const bandOpacity =
      config.bandOpacity ||
      INDICATOR_CONFIGS.bollinger.defaultParams.find(
        (p) => p.name === "bandOpacity"
      )?.value;

    // Create indicator instance with proper parameters
    const bollingerIndicator = new BollingerBandsIndicator(
      data,
      period,
      stdDev,
      middleColor,
      bandColor,
      bandOpacity
    );
    const bollingerTraces = bollingerIndicator.generateTraces();
    traces.push(...bollingerTraces);
  }

  // Add MACD indicator in a separate subplot
  if (selectedIndicators?.includes("macd")) {
    // Get config or use defaults
    const config = indicatorConfigs?.macd || {};
    const fastPeriod =
      config.fastPeriod ||
      INDICATOR_CONFIGS.macd.defaultParams.find((p) => p.name === "fastPeriod")
        ?.value;
    const slowPeriod =
      config.slowPeriod ||
      INDICATOR_CONFIGS.macd.defaultParams.find((p) => p.name === "slowPeriod")
        ?.value;
    const signalPeriod =
      config.signalPeriod ||
      INDICATOR_CONFIGS.macd.defaultParams.find(
        (p) => p.name === "signalPeriod"
      )?.value;
    const macdColor =
      config.macdColor ||
      INDICATOR_CONFIGS.macd.defaultParams.find((p) => p.name === "macdColor")
        ?.value;
    const signalColor =
      config.signalColor ||
      INDICATOR_CONFIGS.macd.defaultParams.find((p) => p.name === "signalColor")
        ?.value;
    const histPositiveColor =
      config.histPositiveColor ||
      INDICATOR_CONFIGS.macd.defaultParams.find(
        (p) => p.name === "histPositiveColor"
      )?.value;
    const histNegativeColor =
      config.histNegativeColor ||
      INDICATOR_CONFIGS.macd.defaultParams.find(
        (p) => p.name === "histNegativeColor"
      )?.value;

    // Create indicator instance with proper parameters
    const macdIndicator = new MACDIndicator(
      data,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      macdColor,
      signalColor,
      histPositiveColor,
      histNegativeColor
    );
    const macdTraces = macdIndicator.generateTraces();
    traces.push(...macdTraces);
  }

  // Add RSI indicator in a separate subplot
  if (selectedIndicators?.includes("rsi")) {
    // Get config or use defaults
    const config = indicatorConfigs?.rsi || {};
    const period =
      config.period ||
      INDICATOR_CONFIGS.rsi.defaultParams.find((p) => p.name === "period")
        ?.value;
    const overbought =
      config.overbought ||
      INDICATOR_CONFIGS.rsi.defaultParams.find((p) => p.name === "overbought")
        ?.value;
    const oversold =
      config.oversold ||
      INDICATOR_CONFIGS.rsi.defaultParams.find((p) => p.name === "oversold")
        ?.value;
    const lineColor =
      config.lineColor ||
      INDICATOR_CONFIGS.rsi.defaultParams.find((p) => p.name === "lineColor")
        ?.value;
    const overboughtColor =
      config.overboughtColor ||
      INDICATOR_CONFIGS.rsi.defaultParams.find(
        (p) => p.name === "overboughtColor"
      )?.value;
    const oversoldColor =
      config.oversoldColor ||
      INDICATOR_CONFIGS.rsi.defaultParams.find(
        (p) => p.name === "oversoldColor"
      )?.value;

    // Create indicator instance with proper parameters
    const rsiIndicator = new RSIIndicator(
      data,
      period,
      overbought,
      oversold,
      lineColor,
      overboughtColor,
      oversoldColor
    );
    const rsiTraces = rsiIndicator.generateTraces();
    traces.push(...rsiTraces);
  }

  // Add Ichimoku indicator
  if (selectedIndicators?.includes("ichimoku")) {
    // Get config or use defaults
    const config = indicatorConfigs?.ichimoku || {};
    const tenkanPeriod =
      config.tenkanPeriod ||
      INDICATOR_CONFIGS.ichimoku.defaultParams.find(
        (p) => p.name === "tenkanPeriod"
      )?.value;
    const kijunPeriod =
      config.kijunPeriod ||
      INDICATOR_CONFIGS.ichimoku.defaultParams.find(
        (p) => p.name === "kijunPeriod"
      )?.value;
    const senkouPeriod =
      config.senkouPeriod ||
      INDICATOR_CONFIGS.ichimoku.defaultParams.find(
        (p) => p.name === "senkouPeriod"
      )?.value;
    const chikouOffset =
      config.chikouOffset ||
      INDICATOR_CONFIGS.ichimoku.defaultParams.find(
        (p) => p.name === "chikouOffset"
      )?.value;

    // Colors
    const colors = {
      tenkan:
        config.tenkanColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "tenkanColor"
        )?.value,
      kijun:
        config.kijunColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "kijunColor"
        )?.value,
      senkouA:
        config.senkouAColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "senkouAColor"
        )?.value,
      senkouB:
        config.senkouBColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "senkouBColor"
        )?.value,
      chikou:
        config.chikouColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "chikouColor"
        )?.value,
      cloud:
        config.cloudColor ||
        INDICATOR_CONFIGS.ichimoku.defaultParams.find(
          (p) => p.name === "cloudColor"
        )?.value,
    };

    // Create indicator instance with proper parameters
    const ichimokuIndicator = new IchimokuIndicator(
      data,
      tenkanPeriod,
      kijunPeriod,
      senkouPeriod,
      chikouOffset,
      colors
    );
    const ichimokuTraces = ichimokuIndicator.generateTraces();
    traces.push(...ichimokuTraces);
  }

  // Add order markers
  if (orders && orders.length > 0) {
    const buyOrders = orders.filter((order) => order.side === "buy");
    const sellOrders = orders.filter((order) => order.side === "sell");

    // Buy orders
    if (buyOrders.length > 0) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: buyOrders.map((order) => order.timestamp),
        y: buyOrders.map((order) => order.price),
        marker: {
          symbol: "triangle-up",
          size: 10,
          color: "rgba(38, 166, 154, 0.9)",
          line: { width: 1, color: "white" },
        },
        name: "Buy Orders",
        yaxis: "y",
        xaxis: "x",
      });
    }

    // Sell orders
    if (sellOrders.length > 0) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: sellOrders.map((order) => order.timestamp),
        y: sellOrders.map((order) => order.price),
        marker: {
          symbol: "triangle-down",
          size: 10,
          color: "rgba(239, 83, 80, 0.9)",
          line: { width: 1, color: "white" },
        },
        name: "Sell Orders",
        yaxis: "y",
        xaxis: "x",
      });
    }
  }

  // Add position markers
  if (positions && positions.length > 0) {
    traces.push({
      type: "scatter",
      mode: "markers",
      x: positions.map((position) => position.timestamp),
      y: positions.map((position) => position.price),
      marker: {
        symbol: "circle",
        size: 8,
        color: positions.map((position) =>
          position.side === "buy"
            ? "rgba(38, 166, 154, 0.9)"
            : "rgba(239, 83, 80, 0.9)"
        ),
        line: { width: 1, color: "white" },
      },
      name: "Positions",
      yaxis: "y",
      xaxis: "x",
    });
  }

  return traces;
}
