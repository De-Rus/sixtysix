import { Indicator, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface PriceLevel {
  price: number;
  strength: number;
  type: "support" | "resistance";
}

interface SupportResistanceResult {
  levels: PriceLevel[];
}

export class SupportResistanceIndicator extends Indicator {
  private result: SupportResistanceResult | null = null;
  private numBins: number;
  private minStrength: number;
  private maxLevels: number;
  private lookback: number;

  constructor(
    data: DataPoint[],
    numBins = 100,
    minStrength = 0.05, // 5% of price touches minimum
    maxLevels = 6, // Maximum number of levels to show
    lookback = 20 // Number of bars to look back for testing level breaks
  ) {
    super(data);
    this.numBins = numBins;
    this.minStrength = minStrength;
    this.maxLevels = maxLevels;
    this.lookback = lookback;
  }

  private createPriceHistogram(): Map<number, number> {
    const prices = this.data.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const binSize = (maxPrice - minPrice) / this.numBins;

    // Create histogram
    const histogram = new Map<number, number>();

    // Initialize bins
    for (let i = 0; i < this.numBins; i++) {
      const binPrice = minPrice + i * binSize;
      histogram.set(binPrice, 0);
    }

    // Fill histogram
    prices.forEach((price) => {
      const bin = Math.floor((price - minPrice) / binSize) * binSize + minPrice;
      histogram.set(bin, (histogram.get(bin) || 0) + 1);
    });

    return histogram;
  }

  private findLocalMaxima(histogram: Map<number, number>): PriceLevel[] {
    const entries = Array.from(histogram.entries());
    const levels: PriceLevel[] = [];
    const totalTouches = Math.max(...Array.from(histogram.values()));

    for (let i = 1; i < entries.length - 1; i++) {
      const [price, count] = entries[i];
      const prevCount = entries[i - 1][1];
      const nextCount = entries[i + 1][1];

      // Check if this is a local maximum
      if (count > prevCount && count > nextCount) {
        const strength = count / totalTouches;
        if (strength >= this.minStrength) {
          // Determine if it's support or resistance
          const type = this.determineLevelType(price);
          levels.push({ price, strength, type });
        }
      }
    }

    // Sort by strength and take top maxLevels
    return levels
      .sort((a, b) => b.strength - a.strength)
      .slice(0, this.maxLevels);
  }

  private determineLevelType(price: number): "support" | "resistance" {
    let touchesAbove = 0;
    let touchesBelow = 0;

    // Look at recent price action to determine if price tends to bounce off this level from above or below
    for (
      let i = Math.max(0, this.data.length - this.lookback);
      i < this.data.length;
      i++
    ) {
      const bar = this.data[i];
      if (Math.abs(bar.low - price) / price < 0.001) touchesAbove++;
      if (Math.abs(bar.high - price) / price < 0.001) touchesBelow++;
    }

    return touchesAbove > touchesBelow ? "support" : "resistance";
  }

  calculate(): void {
    const histogram = this.createPriceHistogram();
    const levels = this.findLocalMaxima(histogram);

    this.result = {
      levels,
    };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const traces: Trace[] = [];
    const timeRange = [this.data[0].time, this.data[this.data.length - 1].time];

    // Add future projection time
    const lastDate = new Date(this.data[this.data.length - 1].time);
    const secondLastDate = new Date(this.data[this.data.length - 2].time);
    const timeDiffMs = lastDate.getTime() - secondLastDate.getTime();
    const futureDate = new Date(lastDate.getTime() + timeDiffMs * 20); // Project 20 bars into future
    const futureTime = futureDate.toISOString();

    // Generate support and resistance lines
    this.result!.levels.forEach((level) => {
      const color =
        level.type === "support"
          ? "rgba(59, 130, 246, 0.8)" // Blue for support
          : "rgba(236, 72, 153, 0.8)"; // Pink for resistance

      // Main line
      traces.push({
        x: [timeRange[0], timeRange[1], futureTime],
        y: [level.price, level.price, level.price],
        type: "scatter",
        mode: "lines",
        name: `${
          level.type === "support" ? "Support" : "Resistance"
        } ${level.price.toFixed(2)}`,
        line: {
          color,
          width: 1,
          dash: "solid",
        },
        showlegend: false,
      });

      // Price label on the right
      traces.push({
        name: `${
          level.type === "support" ? "Support" : "Resistance"
        } ${level.price.toFixed(2)}`,
        x: [timeRange[1]],
        y: [level.price],
        type: "scatter",
        mode: "text",
        text: [level.price.toFixed(2)],
        textposition: "middle right",
        textfont: {
          size: 11,
          color,
        },
        showlegend: false,
      });

      // Strength indicator (small rectangle on the left)
      const strengthWidth = level.strength * 20; // Scale the width based on strength
      traces.push({
        name: `${
          level.type === "support" ? "Support" : "Resistance"
        } ${level.price.toFixed(2)}`,
        x: [timeRange[0], timeRange[0]],
        y: [level.price - 0.1, level.price + 0.1],
        type: "scatter",
        mode: "lines",
        line: {
          color,
          width: strengthWidth,
        },
        showlegend: false,
      });
    });

    return traces;
  }
}
