"use client"

import { useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Order, Trade, Position, OrderSide, OrderType } from "@/types/trading-types"
import { useChartContext } from "@/context/ChartContext"

export function useTradingOperations() {
  const {
    symbol,
    orders,
    trades,
    positions,
    addOrder,
    removeOrder,
    addTrade,
    removeTrade,
    addPosition,
    removePosition,
  } = useChartContext()

  // Create a new order
  const createOrder = useCallback(
    (orderDetails: {
      side: OrderSide
      type: OrderType
      price: number
      quantity: number
    }) => {
      const order: Order = {
        id: uuidv4(),
        symbol,
        timestamp: new Date().toISOString(),
        status: "pending",
        ...orderDetails,
      }

      addOrder(order)
      return order
    },
    [symbol, addOrder],
  )

  // Fill an order
  const fillOrder = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId)
      if (!order) return

      // Update order status
      const updatedOrder = { ...order, status: "filled" }
      removeOrder(orderId)
      addOrder(updatedOrder)

      // Create a trade
      const trade: Trade = {
        id: uuidv4(),
        orderId,
        symbol: order.symbol,
        side: order.side,
        price: order.price,
        quantity: order.quantity,
        timestamp: new Date().toISOString(),
      }

      addTrade(trade)

      // Update position
      const existingPosition = positions.find(
        (p) => p.symbol === order.symbol && p.side === (order.side === "buy" ? "long" : "short"),
      )

      if (existingPosition) {
        // Update existing position
        const totalQuantity = existingPosition.quantity + order.quantity
        const totalValue = existingPosition.averagePrice * existingPosition.quantity + order.price * order.quantity
        const averagePrice = totalValue / totalQuantity

        const updatedPosition: Position = {
          ...existingPosition,
          quantity: totalQuantity,
          averagePrice,
          timestamp: new Date().toISOString(),
        }

        removePosition(existingPosition)
        addPosition(updatedPosition)
      } else {
        // Create new position
        const position: Position = {
          symbol: order.symbol,
          side: order.side === "buy" ? "long" : "short",
          quantity: order.quantity,
          averagePrice: order.price,
          unrealizedPnl: 0,
          realizedPnl: 0,
          timestamp: new Date().toISOString(),
        }

        addPosition(position)
      }
    },
    [orders, positions, removeOrder, addOrder, addTrade, removePosition, addPosition],
  )

  // Cancel an order
  const cancelOrder = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId)
      if (!order) return

      // Update order status
      const updatedOrder = { ...order, status: "cancelled" }
      removeOrder(orderId)
      addOrder(updatedOrder)
    },
    [orders, removeOrder, addOrder],
  )

  // Close a position
  const closePosition = useCallback(
    (position: Position) => {
      // Create a closing order
      const order: Order = {
        id: uuidv4(),
        symbol: position.symbol,
        side: position.side === "long" ? "sell" : "buy",
        type: "market",
        price: position.averagePrice, // Use average price for simplicity
        quantity: position.quantity,
        status: "filled",
        timestamp: new Date().toISOString(),
      }

      addOrder(order)

      // Create a trade
      const trade: Trade = {
        id: uuidv4(),
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        price: order.price,
        quantity: order.quantity,
        timestamp: new Date().toISOString(),
        pnl: position.unrealizedPnl,
      }

      addTrade(trade)

      // Remove the position
      removePosition(position)
    },
    [addOrder, addTrade, removePosition],
  )

  return {
    createOrder,
    fillOrder,
    cancelOrder,
    closePosition,
  }
}

