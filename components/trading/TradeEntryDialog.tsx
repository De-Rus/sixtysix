"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { OrderSide, OrderType } from "@/types/trading-types"

interface TradeEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tradeDetails: {
    side: OrderSide
    type: OrderType
    price: number
    quantity: number
  }) => void
  defaultPrice?: number
  symbol: string
}

export function TradeEntryDialog({ isOpen, onClose, onSubmit, defaultPrice = 0, symbol }: TradeEntryDialogProps) {
  const [side, setSide] = useState<OrderSide>("buy")
  const [type, setType] = useState<OrderType>("limit")
  const [price, setPrice] = useState(defaultPrice)
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      side,
      type,
      price,
      quantity,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New {symbol} Order</DialogTitle>
          <DialogDescription>Enter the details for your trade order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="side">Side</Label>
              <RadioGroup
                id="side"
                value={side}
                onValueChange={(value) => setSide(value as OrderSide)}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buy" id="buy" />
                  <Label htmlFor="buy" className="text-green-600">
                    Buy
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="sell" id="sell" />
                  <Label htmlFor="sell" className="text-red-600">
                    Sell
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Order Type</Label>
              <RadioGroup
                id="type"
                value={type}
                onValueChange={(value) => setType(value as OrderType)}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="market" id="market" />
                  <Label htmlFor="market">Market</Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="limit" id="limit" />
                  <Label htmlFor="limit">Limit</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number.parseFloat(e.target.value))}
                disabled={type === "market"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

