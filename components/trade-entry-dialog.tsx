"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { OrderSide, OrderType } from "@/types/trading-types"

interface TradeEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (trade: {
    side: OrderSide
    type: OrderType
    price: number
    quantity: number
  }) => void
  defaultPrice?: number
  symbol: string
}

export function TradeEntryDialog({ isOpen, onClose, onSubmit, defaultPrice, symbol }: TradeEntryDialogProps) {
  const [side, setSide] = useState<OrderSide>("buy")
  const [type, setType] = useState<OrderType>("limit")
  const [price, setPrice] = useState<string>(defaultPrice?.toString() || "")
  const [quantity, setQuantity] = useState<string>("100")

  const handleSubmit = () => {
    onSubmit({
      side,
      type,
      price: Number(price),
      quantity: Number(quantity),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Trade - {symbol}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Side</Label>
            <RadioGroup
              defaultValue={side}
              onValueChange={(value) => setSide(value as OrderSide)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy" className="text-blue-500 font-semibold">
                  Buy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell" className="text-red-500 font-semibold">
                  Sell
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Order Type</Label>
            <RadioGroup
              defaultValue={type}
              onValueChange={(value) => setType(value as OrderType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="market" id="market" />
                <Label htmlFor="market">Market</Label>
              </div>
              <div className="flex items-center space-x-2">
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={type === "market"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Place Order</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

