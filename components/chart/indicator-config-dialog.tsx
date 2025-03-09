"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { IndicatorParameter } from "@/utils/indicators/configurable-indicator"

interface IndicatorConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: Record<string, any>) => void
  parameters: IndicatorParameter[]
  title: string
}

export function IndicatorConfigDialog({ isOpen, onClose, onSave, parameters, title }: IndicatorConfigDialogProps) {
  const [config, setConfig] = useState<Record<string, any>>({})

  // Initialize config with parameter values
  useEffect(() => {
    const initialConfig: Record<string, any> = {}
    parameters.forEach((param) => {
      initialConfig[param.name] = param.value
    })
    setConfig(initialConfig)
    console.log("Initialized config with parameters:", initialConfig)
  }, [parameters])

  const handleInputChange = (name: string, value: any) => {
    console.log(`Input changed: ${name} = ${value}`)
    setConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    console.log("Saving config:", config)
    onSave(config)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title} Configuration</DialogTitle>
          <DialogDescription>Adjust the parameters for this indicator.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {parameters.map((param) => (
            <div key={param.name} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={param.name} className="text-right">
                {param.label}
              </Label>
              {param.type === "number" ? (
                <Input
                  id={param.name}
                  type="number"
                  value={config[param.name] || param.value || 0}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  onChange={(e) => handleInputChange(param.name, Number.parseFloat(e.target.value))}
                  className="col-span-3"
                />
              ) : param.type === "boolean" ? (
                <Checkbox
                  id={param.name}
                  checked={config[param.name] || param.value || false}
                  onCheckedChange={(checked) => handleInputChange(param.name, checked)}
                  className="col-span-3"
                />
              ) : param.type === "select" && param.options ? (
                <Select
                  value={config[param.name] || param.value || ""}
                  onValueChange={(value) => handleInputChange(param.name, value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {param.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : param.type === "color" || param.name.toLowerCase().includes("color") ? (
                <div className="col-span-3 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: config[param.name] || param.value || "#000000" }}
                  />
                  <Input
                    id={param.name}
                    type="color"
                    value={config[param.name] || param.value || "#000000"}
                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                    className="w-12 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={config[param.name] || param.value || "#000000"}
                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ) : (
                <Input
                  id={param.name}
                  type="text"
                  value={config[param.name] || param.value || ""}
                  onChange={(e) => handleInputChange(param.name, e.target.value)}
                  className="col-span-3"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

