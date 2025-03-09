# Implementing Custom Indicators

This guide explains how to implement custom indicators for the trading chart library.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating a Basic Indicator](#creating-a-basic-indicator)
- [Implementing a Configurable Indicator](#implementing-a-configurable-indicator)
- [Creating a Subplot Indicator](#creating-a-subplot-indicator)
- [Registering Your Indicator](#registering-your-indicator)
- [Advanced Techniques](#advanced-techniques)

## Architecture Overview

The indicator system is built around a few key concepts:

1. **Base Indicator Class**: All indicators extend the `Indicator` abstract class
2. **Configurable Indicators**: Indicators that can be configured implement the `ConfigurableIndicator` interface
3. **Indicator Calculations**: Reusable calculation functions in the `calculations` folder
4. **Traces**: Visual representation of indicator data on the chart

### Key Files

- `utils/indicators/base-indicator.ts` - Base classes and interfaces
- `utils/indicators/configurable-indicator.ts` - Configuration interfaces
- `utils/chart-indicators.ts` - Registration and rendering logic
- `components/chart-toolbar.tsx` - UI for selecting indicators

## Creating a Basic Indicator

To create a new indicator, follow these steps:

1. Create a new file in `utils/indicators/` (e.g., `my-indicator.ts`)
2. Extend the `Indicator` class
3. Implement the required methods

### Example: Simple Moving Average (SMA)

```typescript
import { Indicator, type Trace } from "./base-indicator";
import type { DataPoint } from "../types/chart-types";
import { calculateSMA } from "./calculations/sma";

export class SMAIndicator extends Indicator {
  static readonly name = "SMA";
  private result: (number | null)[] = [];
  private period: number;
  private color: string;

  constructor(data: DataPoint[], period = 14, color = "rgb(249, 115, 22)") {
    super(data);
    this.period = period;
    this.color = color;
  }

  calculate(): void {
    this.result = calculateSMA(this.data, this.period);
  }

  generateTraces(): Trace[] {
    if (this.result.length === 0) {
      this.calculate();
    }

    return [
      {
        x: this.data.map((d) => d.time),
        y: this.result,
        type: "scatter",
        mode: "lines",
        name: `SMA (${this.period})`,
        line: { color: this.color, width: 1.5 },
      },
    ];
  }
}

