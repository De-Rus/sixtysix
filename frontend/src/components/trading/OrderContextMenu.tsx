"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import type { Order } from "@/types/trading-types"

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleNewBuyOrder = useCallback(() => {
    if (!pointData.price || !onNewOrder) return

    onNewOrder({
      id: `order-${Date.now()}`,
      symbol,
      side: "buy",
      type: "limit",
      price: pointData.price,
      quantity: 1,
      timestamp: new Date().toISOString(),
      status: "pending",
    })
  }, [onNewOrder, pointData.price, symbol])

  const handleNewSellOrder = useCallback(() => {
    if (!pointData.price || !onNewOrder) return

    onNewOrder({
      id: `order-${Date.now()}`,
      symbol,
      side: "sell",
      type: "limit",
      price: pointData.price,
      quantity: 1,
      timestamp: new Date().toISOString(),
      status: "pending",
    })
  }, [onNewOrder, pointData.price, symbol])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {pointData.price && (
          <>
            <ContextMenuItem onClick={handleNewBuyOrder} className="text-green-600">
              Buy at ${pointData.price.toFixed(2)}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleNewSellOrder} className="text-red-600">
              Sell at ${pointData.price.toFixed(2)}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

