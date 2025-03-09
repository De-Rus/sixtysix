"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface IndicatorParameter {
  name: string
  type: string
  label: string
  value: any
  min?: number
  max?: number
  step?: number
  options?: {
    label: string
    value: string
  }[]
}

interface IndicatorConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  parameters: IndicatorParameter[]
  onSave: (params: Record<string, any>) => void
}

export function IndicatorConfigDialog({ isOpen, onClose, title, parameters, onSave }: IndicatorConfigDialogProps) {
  // Initialize state with the current parameter values
  const [paramValues, setParamValues] = useState<Record<string, any>>({})

  // Update paramValues when parameters change
  useEffect(() => {
    // Create an object with parameter names as keys and their values
    const initialValues = parameters.reduce(
      (acc, param) => {
        acc[param.name] = param.value
        return acc
      },
      {} as Record<string, any>,
    )

    setParamValues(initialValues)
    console.log("Initial parameter values:", initialValues)
  }, [parameters])

  const handleChange = (name: string, value: any) => {
    setParamValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    onSave(paramValues)
  }

  const renderInput = (param: IndicatorParameter) => {
    const handleParamChange = (name: string, value: any) => {
      handleChange(name, value)
    }

    switch (param.type) {
      case "number":
        return (
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id={param.name}
              type="number"
              value={paramValues[param.name] !== undefined ? paramValues[param.name] : param.value}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              onChange={(e) => handleParamChange(param.name, Number.parseFloat(e.target.value))}
              className="w-20"
            />
            {param.min !== undefined && param.max !== undefined && (
              <div className="flex-1">
                <Slider
                  value={[paramValues[param.name] !== undefined ? paramValues[param.name] : param.value]}
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  onValueChange={(value) => handleParamChange(param.name, value[0])}
                />
              </div>
            )}
          </div>
        )
      case "select":
        return (
          <select
            id={param.name}
            value={paramValues[param.name] !== undefined ? paramValues[param.name] : param.value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="col-span-3"
          >
            {param.options &&
              param.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        )
      case "color":
        return (
          <input
            type="color"
            id={param.name}
            value={paramValues[param.name] || param.value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full h-8 cursor-pointer"
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title} Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {parameters.map((param) => (
            <div key={param.name} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={param.name} className="text-right">
                {param.label}
              </Label>
              {renderInput(param)}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

