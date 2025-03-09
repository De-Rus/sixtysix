export type OrderSide = "buy" | "sell"
export type OrderType = "market" | "limit" | "stop" | "stop_limit"
export type OrderStatus = "pending" | "filled" | "cancelled" | "rejected"
export type PositionSide = "long" | "short"

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  price: number
  quantity: number
  status: OrderStatus
  timestamp: string
}

export interface Trade {
  id: string
  orderId: string
  symbol: string
  side: OrderSide
  price: number
  quantity: number
  timestamp: string
  pnl?: number
}

export interface Position {
  symbol: string
  side: PositionSide
  quantity: number
  averagePrice: number
  unrealizedPnl: number
  realizedPnl: number
  timestamp: string
}

