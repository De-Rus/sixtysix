import type { DataPoint } from "@/types/chart-types"
import type { Order, OrderSide } from "@/types/trading-types"
import type { Signal, Strategy, StrategyParameter } from "@/types/strategy-types"
import { v4 as uuidv4 } from "uuid"

export abstract class BaseStrategy implements Strategy {
  name: string
  description: string
  parameters: Record<string, any>
  protected data: DataPoint[] = []

  constructor(name: string, description: string, parameters: Record<string, any> = {}) {
    this.name = name
    this.description = description
    this.parameters = parameters
  }

  initialize(data: DataPoint[]): void {
    this.data = [...data]
  }

  update(newData: DataPoint[]): void {
    this.data = [...newData]
  }

  abstract generateSignals(): Signal[]

  generateOrders(signals: Signal[]): Order[] {
    return signals
      .filter((signal) => !signal.executed)
      .map((signal) => ({
        id: uuidv4(),
        symbol: "AAPL", // Default symbol, should be configurable
        side: signal.side,
        type: "limit",
        price: signal.price,
        quantity: 100, // Default quantity, should be configurable
        status: "pending",
        timestamp: signal.time,
      }))
  }

  abstract getParameters(): StrategyParameter[]

  abstract setParameters(params: Record<string, any>): void

  // Helper method to create a signal
  protected createSignal(time: string, price: number, side: OrderSide, reason: string): Signal {
    return {
      id: uuidv4(),
      time,
      price,
      side,
      reason,
      executed: false,
      timestamp: new Date().toISOString(),
    }
  }
}

