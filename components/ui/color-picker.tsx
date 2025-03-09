"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha = 1) {
  // Remove the # if present
  hex = hex.replace("#", "")

  // Parse the hex values
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  // Return the rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Helper function to convert rgb/rgba to hex and alpha
function colorToHexAndAlpha(color: string) {
  // Default values
  let hex = "#000000"
  let alpha = 1

  // Check if it's an rgba color
  const rgbaMatch = color.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?$$/)

  if (rgbaMatch) {
    const r = Number.parseInt(rgbaMatch[1])
    const g = Number.parseInt(rgbaMatch[2])
    const b = Number.parseInt(rgbaMatch[3])
    alpha = rgbaMatch[4] ? Number.parseFloat(rgbaMatch[4]) : 1

    // Convert to hex
    hex = "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0")
  }
  // Check if it's a hex color
  else if (color.startsWith("#")) {
    hex = color
  }

  return { hex, alpha }
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  // Parse the initial value
  const [color, setColor] = useState("#000000")
  const [alpha, setAlpha] = useState(1)
  const [open, setOpen] = useState(false)

  // Initialize with the provided value
  useEffect(() => {
    if (value) {
      console.log("ColorPicker initializing with value:", value)
      const { hex, alpha } = colorToHexAndAlpha(value)
      setColor(hex)
      setAlpha(alpha)
    }
  }, [value])

  // Get the output color in rgba format
  const getOutputColor = () => {
    return hexToRgba(color, alpha)
  }

  // Update the color and notify the parent
  const updateColor = (newColor: string, newAlpha: number) => {
    setColor(newColor)
    setAlpha(newAlpha)
    onChange(hexToRgba(newColor, newAlpha))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-10 p-1 ${className}`}
          style={{
            backgroundColor: getOutputColor(),
            border: "1px solid #ccc",
          }}
        >
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="w-full h-24 rounded-md border" style={{ backgroundColor: getOutputColor() }} />
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => updateColor(e.target.value, alpha)}
                className="col-span-2 h-8"
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-2">
              <Label htmlFor="alpha">Opacity</Label>
              <div className="col-span-2 flex items-center gap-2">
                <Slider
                  id="alpha"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[alpha]}
                  onValueChange={(values) => updateColor(color, values[0])}
                />
                <span className="w-12 text-right">{Math.round(alpha * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="rgba">RGBA</Label>
            <Input id="rgba" value={getOutputColor()} readOnly className="col-span-2 h-8" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

