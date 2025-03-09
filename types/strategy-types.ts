import type { DataPoint } from "./chart-types"
import type { Order, OrderSide } from "./trading-types"

export interface Signal {
  id: string
  time: string
  price: number
  side: OrderSide
  reason: string
  executed: boolean
  timestamp: string
}

export interface Strategy {
  name: string
  description: string
  parameters: Record<string, any>

  // Initialize the strategy with data
  initialize(data: DataPoint[]): void

  // Update the strategy with new data
  update(newData: DataPoint[]): void

  // Generate signals based on the strategy
  generateSignals(): Signal[]

  // Convert signals to orders
  generateOrders(signals: Signal[]): Order[]

  // Get the strategy parameters for configuration
  getParameters(): StrategyParameter[]

  // Set the strategy parameters
  setParameters(params: Record<string, any>): void
}

export interface StrategyParameter {
  name: string
  type: string
  label: string
  value: any
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[]
}

