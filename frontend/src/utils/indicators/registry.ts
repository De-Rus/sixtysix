import type { DataPoint } from "../../types/chart-types";
import type { Indicator } from "./base/indicator";
import {
  ADXIndicator,
  BollingerBandsIndicator,
  ChannelsIndicator,
  DonchianChannelsIndicator,
  ElliottWaveIndicator,
  EMAIndicator,
  FibonacciIndicator,
  IchimokuIndicator,
  MACDIndicator,
  ParabolicSARIndicator,
  RenkoIndicator,
  RSIIndicator,
  SMACrossoverIndicator,
  SMAIndicator,
  SqueezeMomentumIndicator,
  SupertrendIndicator,
  SupportResistanceIndicator,
  TrendlineIndicator,
} from "./impl";

export type IndicatorConstructor = new (data: DataPoint[]) => Indicator;

class IndicatorRegistry {
  private static instance: IndicatorRegistry;
  private indicators: Map<string, IndicatorConstructor>;

  private constructor() {
    this.indicators = new Map();
    this.registerDefaultIndicators();
  }

  public static getInstance(): IndicatorRegistry {
    if (!IndicatorRegistry.instance) {
      IndicatorRegistry.instance = new IndicatorRegistry();
    }
    return IndicatorRegistry.instance;
  }

  private registerDefaultIndicators(): void {
    this.register("adx", ADXIndicator);
    this.register("bollinger", BollingerBandsIndicator);
    this.register("channels", ChannelsIndicator);
    this.register("donchian", DonchianChannelsIndicator);
    this.register("elliottWave", ElliottWaveIndicator);
    this.register("ema", EMAIndicator);
    this.register("fibonacci", FibonacciIndicator);
    this.register("ichimoku", IchimokuIndicator);
    this.register("macd", MACDIndicator);
    this.register("parabolicSar", ParabolicSARIndicator);
    this.register("renko", RenkoIndicator);
    this.register("rsi", RSIIndicator);
    this.register("smaCrossover", SMACrossoverIndicator);
    this.register("sma", SMAIndicator);
    this.register("squeezeMomentum", SqueezeMomentumIndicator);
    this.register("supertrend", SupertrendIndicator);
    this.register("supportResistance", SupportResistanceIndicator);
    this.register("trendlines", TrendlineIndicator);
  }

  public register(id: string, indicator: IndicatorConstructor): void {
    this.indicators.set(id, indicator);
  }

  public get(id: string): IndicatorConstructor | undefined {
    return this.indicators.get(id);
  }

  public createIndicator(id: string, data: DataPoint[]): Indicator | null {
    const IndicatorClass = this.get(id);
    if (!IndicatorClass) {
      console.warn(`Indicator ${id} not found in registry`);
      return null;
    }
    return new IndicatorClass(data);
  }

  public getRegisteredIndicators(): string[] {
    return Array.from(this.indicators.keys());
  }

  public hasIndicator(id: string): boolean {
    return this.indicators.has(id);
  }
}

export const indicatorRegistry = IndicatorRegistry.getInstance();