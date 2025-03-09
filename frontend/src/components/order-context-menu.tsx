"use client"

import * as React from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { v4 as uuidv4 } from "uuid"
import type { Order, OrderSide, OrderType } from "@/types/trading-types"
import { useCallback } from "react"

interface OrderContextMenuProps {
  children: React.ReactNode
  onNewOrder?: (order: Order) => void
  symbol: string
  pointData: {
    price: number | null
    time: string | null
  }
}

export function OrderContextMenu({ children, onNewOrder, symbol, pointData }: OrderContextMenuProps) {
  const createOrder = useCallback(
    (side: OrderSide, type: OrderType = "limit") => {
      if (!pointData.price || !pointData.time || !onNewOrder) {
        return
      }

      const order: Order = {
        id: uuidv4(),
        symbol,
        side,
        type,
        price: pointData.price,
        quantity: 100,
        status: "pending",
        timestamp: pointData.time,
      }

      onNewOrder(order)
    },
    [pointData, onNewOrder, symbol],
  )

  const formattedPrice = React.useMemo(() => {
    if (pointData.price === null || isNaN(pointData.price)) return "N/A"
    return pointData.price.toFixed(2)
  }, [pointData.price])

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => createOrder("buy", "limit")}
          className="text-blue-500"
          disabled={!pointData.price}
        >
          Buy Limit @ {formattedPrice}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => createOrder("sell", "limit")}
          className="text-red-500"
          disabled={!pointData.price}
        >
          Sell Limit @ {formattedPrice}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => createOrder("buy", "market")}
          className="text-blue-500"
          disabled={!pointData.price}
        >
          Buy Market @ {formattedPrice}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => createOrder("sell", "market")}
          className="text-red-500"
          disabled={!pointData.price}
        >
          Sell Market @ {formattedPrice}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

