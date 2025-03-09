"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-0">
        <Tabs defaultValue="positions" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="positions">Positions ({positions.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Side</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Avg. Price</th>
                    <th className="text-right p-2">P&L</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted-foreground">
                        No open positions
                      </td>
                    </tr>
                  ) : (
                    positions.map((position) => (
                      <tr key={position.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{position.symbol}</td>
                        <td className={`p-2 ${position.side === "buy" ? "text-green-600" : "text-red-600"}`}>
                          {position.side.toUpperCase()}
                        </td>
                        <td className="text-right p-2">{position.quantity}</td>
                        <td className="text-right p-2">${position.averagePrice.toFixed(2)}</td>
                        <td className="text-right p-2">$0.00</td>
                        <td className="text-center p-2">
                          <Button variant="destructive" size="sm" onClick={() => onCancelPosition?.(position)}>
                            Close
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Side</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-muted-foreground">
                        No orders
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{order.symbol}</td>
                        <td className={`p-2 ${order.side === "buy" ? "text-green-600" : "text-red-600"}`}>
                          {order.side.toUpperCase()}
                        </td>
                        <td className="p-2">{order.type.toUpperCase()}</td>
                        <td className="text-right p-2">{order.quantity}</td>
                        <td className="text-right p-2">${order.price.toFixed(2)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              order.status === "filled"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2">{new Date(order.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Side</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Value</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted-foreground">
                        No trades
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{trade.symbol}</td>
                        <td className={`p-2 ${trade.side === "buy" ? "text-green-600" : "text-red-600"}`}>
                          {trade.side.toUpperCase()}
                        </td>
                        <td className="text-right p-2">{trade.quantity}</td>
                        <td className="text-right p-2">${trade.price.toFixed(2)}</td>
                        <td className="text-right p-2">${(trade.price * trade.quantity).toFixed(2)}</td>
                        <td className="p-2">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

