"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Order, Trade, Position } from "@/types/trading-types"

interface TradingPanelProps {
  orders: Order[]
  trades: Trade[]
  positions: Position[]
  onCancelPosition?: (position: Position) => void
  className?: string
}

export function TradingPanel({ orders, trades, positions, onCancelPosition, className = "" }: TradingPanelProps) {
  const [activeTab, setActiveTab] = useState("positions")

  const formatPrice = (price: number) => price.toFixed(2)
  const formatPnL = (pnl: number) => {
    const formatted = pnl.toFixed(2)
    return pnl >= 0 ? `+${formatted}` : formatted
  }

  const getOrderStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "filled":
        return "bg-green-500"
      case "cancelled":
        return "bg-yellow-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getSideColor = (side: "buy" | "sell" | "long" | "short") => {
    switch (side) {
      case "buy":
      case "long":
        return "bg-blue-500"
      case "sell":
      case "short":
        return "bg-red-500"
    }
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b rounded-none">
          <TabsTrigger value="positions" className="flex-1">
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex-1">
            Trades ({trades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Avg. Price</TableHead>
                <TableHead>Unrealized P/L</TableHead>
                <TableHead>Realized P/L</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={`${position.symbol}-${position.side}-${position.timestamp}`}>
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSideColor(position.side)}>
                      {position.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.quantity}</TableCell>
                  <TableCell>{formatPrice(position.averagePrice)}</TableCell>
                  <TableCell className={position.unrealizedPnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatPnL(position.unrealizedPnl)}
                  </TableCell>
                  <TableCell className={position.realizedPnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatPnL(position.realizedPnl)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover:bg-destructive hover:text-destructive-foreground ${
                        position.side === "long" ? "text-blue-500" : "text-red-500"
                      }`}
                      onClick={() => onCancelPosition?.(position)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {positions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No open positions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="orders" className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSideColor(order.side)}>
                      {order.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="uppercase">{order.type}</TableCell>
                  <TableCell>{formatPrice(order.price)}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getOrderStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No orders
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="trades" className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSideColor(trade.side)}>
                      {trade.side.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(trade.price)}</TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell className={trade.pnl && trade.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                    {trade.pnl ? formatPnL(trade.pnl) : "-"}
                  </TableCell>
                  <TableCell>{new Date(trade.timestamp).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No trades
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}

