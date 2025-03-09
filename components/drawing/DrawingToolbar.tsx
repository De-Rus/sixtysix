"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MousePointer, LineChartIcon as LineIcon, ArrowRightIcon, Square, Trash } from "lucide-react"
import type { DrawingTool } from "@/types/drawing-types"

interface DrawingToolbarProps {
  selectedTool: DrawingTool
  onToolSelect: (tool: DrawingTool) => void
  onClearDrawings?: () => void
}

export function DrawingToolbar({ selectedTool, onToolSelect, onClearDrawings }: DrawingToolbarProps) {
  const tools = [
    { id: "cursor", icon: MousePointer, label: "Cursor" },
    { id: "line", icon: LineIcon, label: "Line" },
    { id: "horizontal", icon: ArrowRightIcon, label: "Horizontal Line" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
  ]

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-md shadow-md">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolSelect(tool.id as DrawingTool)}
                className={`h-8 w-8 ${selectedTool === tool.id ? "bg-primary text-primary-foreground" : ""}`}
              >
                <tool.icon className="h-4 w-4" />
                <span className="sr-only">{tool.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        {onClearDrawings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearDrawings}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Clear Drawings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Clear All Drawings</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

