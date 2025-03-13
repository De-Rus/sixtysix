import { Indicator, type Trace } from "../base/base-indicator";
import type { DataPoint } from "../../../types/chart-types";

interface CrossoverPoint {
  index: number;
  time: string;
  price: number;
  type: "bullish" | "bearish"; // bullish when fast crosses above slow, bearish when fast crosses below slow
}

interface SMACrossoverResult {
  fastSMA: (number | null)[];
  slowSMA: (number | null)[];
  crossovers: CrossoverPoint[];
}

export class SMACrossoverIndicator extends Indicator {
  private result: SMACrossoverResult | null = null;
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(data: DataPoint[], fastPeriod = 20, slowPeriod = 50) {
    super(data);
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
  }

  private calculateSMA(period: number): (number | null)[] {
    const sma: (number | null)[] = [];

    for (let i = 0; i < this.data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += this.data[j].close;
        }
        sma.push(sum / period);
      }
    }

    return sma;
  }

  private detectCrossovers(
    fastSMA: (number | null)[],
    slowSMA: (number | null)[]
  ): CrossoverPoint[] {
    const crossovers: CrossoverPoint[] = [];

    // Start checking from the point where both SMAs have values
    for (
      let i = Math.max(this.fastPeriod, this.slowPeriod);
      i < this.data.length;
      i++
    ) {
      const curr = {
        fast: fastSMA[i],
        slow: slowSMA[i],
      };
      const prev = {
        fast: fastSMA[i - 1],
        slow: slowSMA[i - 1],
      };

      // Check for valid values
      if (!curr.fast || !curr.slow || !prev.fast || !prev.slow) continue;

      // Detect bullish crossover (fast crosses above slow)
      if (prev.fast <= prev.slow && curr.fast > curr.slow) {
        crossovers.push({
          index: i,
          time: this.data[i].time,
          price: curr.fast,
          type: "bullish",
        });
      }
      // Detect bearish crossover (fast crosses below slow)
      else if (prev.fast >= prev.slow && curr.fast < curr.slow) {
        crossovers.push({
          index: i,
          time: this.data[i].time,
          price: curr.fast,
          type: "bearish",
        });
      }
    }

    return crossovers;
  }

  calculate(): SMACrossoverResult {
    const fastSMA = this.calculateSMA(this.fastPeriod);
    const slowSMA = this.calculateSMA(this.slowPeriod);
    const crossovers = this.detectCrossovers(fastSMA, slowSMA);

    this.result = {
      fastSMA,
      slowSMA,
      crossovers,
    };

    return this.result;
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const times = this.data.map((d) => d.time);

    const traces: Trace[] = [
      // Fast SMA line
      {
        x: times,
        y: this.result!.fastSMA,
        type: "scatter",
        mode: "lines",
        name: `SMA (${this.fastPeriod})`,
        line: { color: "rgb(59, 130, 246)", width: 1.5 }, // blue
      },
      // Slow SMA line
      {
        x: times,
        y: this.result!.slowSMA,
        type: "scatter",
        mode: "lines",
        name: `SMA (${this.slowPeriod})`,
        line: { color: "rgb(147, 51, 234)", width: 1.5 }, // purple
      },
    ];

    // Add crossover markers and annotations
    if (this.result!.crossovers.length > 0) {
      // Bullish crossovers
      const bullishCrossovers = this.result!.crossovers.filter(
        (c) => c.type === "bullish"
      );
      if (bullishCrossovers.length > 0) {
        traces.push({
          x: bullishCrossovers.map((c) => c.time),
          y: bullishCrossovers.map((c) => c.price),
          type: "scatter",
          mode: "markers+text",
          name: "Buy Signal",
          marker: {
            symbol: "triangle-up",
            size: 12,
            color: "rgb(59, 130, 246)", // Changed to blue
          },
          text: bullishCrossovers.map(() => "BUY"),
          textposition: "top center",
          textfont: {
            size: 13,
            color: "rgb(59, 130, 246)", // Changed to blue
            family: "Arial Black, sans-serif", // Made text bold
          },
          showlegend: true,
        } as any);
      }

      // Bearish crossovers
      const bearishCrossovers = this.result!.crossovers.filter(
        (c) => c.type === "bearish"
      );
      if (bearishCrossovers.length > 0) {
        traces.push({
          x: bearishCrossovers.map((c) => c.time),
          y: bearishCrossovers.map((c) => c.price),
          type: "scatter",
          mode: "markers+text",
          name: "Sell Signal",
          marker: {
            symbol: "triangle-down",
            size: 12,
            color: "rgb(236, 72, 153)", // Changed to pink
          },
          text: bearishCrossovers.map(() => "SELL"),
          textposition: "bottom center",
          textfont: {
            size: 13,
            color: "rgb(236, 72, 153)", // Changed to pink
            family: "Arial Black, sans-serif", // Made text bold
          },
          showlegend: true,
        } as any);
      }
    }

    return traces;
  }
}
