"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Square,
  LineChart,
  Eraser,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Move,
  Pointer,
  Trash2,
  AlertTriangle,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Drawing tools configuration
const drawingTools = [
  { name: "zoom", icon: <ZoomIn size={16} />, mode: "zoom", label: "Zoom" },
  { name: "move", icon: <Move size={16} />, mode: "pan", label: "Move" },
  {
    name: "select",
    icon: <Pointer size={16} />,
    mode: "select",
    label: "Select",
  },
  {
    name: "measure",
    icon: <Ruler size={16} />,
    mode: "measure",
    label: "Measure",
  },
  {
    name: "line",
    icon: <LineChart size={16} />,
    mode: "drawline",
    label: "Line",
  },
  {
    name: "fibonacci",
    icon: <TrendingUp size={16} />,
    mode: "fibonacci",
    label: "Fibonacci Retracement",
  },
  {
    name: "freeDraw",
    icon: <Pencil size={16} />,
    mode: "drawopenpath",
    label: "Free Draw (cannot be moved)",
  },
  {
    name: "rectangle",
    icon: <Square size={16} />,
    mode: "drawrect",
    label: "Rectangle",
  },
  {
    name: "eraser",
    icon: <Eraser size={16} />,
    mode: "eraseshape",
    label: "Erase All",
  },
];

// Get cursor style based on active tool
const getCursorStyle = (
  tool: string,
  isDragging = false,
  hasSelectedShape: boolean
) => {
  if (isDragging && tool === "pan") {
    return "grabbing";
  }

  switch (tool) {
    case "drawline":
      return "crosshair";
    case "fibonacci":
      return "crosshair";
    case "drawopenpath":
      return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' strokeWidth='2'><path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/></svg>\") 0 24, auto";
    case "drawrect":
      return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' strokeWidth='2'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/></svg>\") 12 12, crosshair";
    case "eraseshape":
      return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' strokeWidth='2'><path d='M20 20H7L3 16a1 1 0 0 1 0-1.41l9.71-9.71a1 1 0 0 1 1.41 0l6.88 6.88a1 1 0 0 1 0 1.41L12.7 20'/></svg>\") 0 24, auto";
    case "select":
      return hasSelectedShape ? "move" : "pointer";
    case "measure":
      return "crosshair";
    case "zoom":
      return "zoom-in";
    case "pan":
      return "grab";
    default:
      return "default";
  }
};

interface DrawingToolbarProps {
  activeTool: string;
  onToolChange: (toolMode: string) => void;
  onDeleteSelected: () => void;
  className?: string;
  isDragging?: boolean;
  hasSelectedShape?: boolean;
  showPathWarning?: boolean;
}

export function DrawingToolbar({
  activeTool,
  onToolChange,
  onDeleteSelected,
  className = "",
  isDragging = false,
  hasSelectedShape = false,
  showPathWarning = false,
}: DrawingToolbarProps) {
  const [internalHasSelectedShape, setInternalHasSelectedShape] =
    useState(false);

  // Sync the internal state with the prop
  useEffect(() => {
    console.log("DrawingToolbar received hasSelectedShape:", hasSelectedShape);
    setInternalHasSelectedShape(hasSelectedShape);
  }, [hasSelectedShape]);

  // Function to activate a drawing tool
  const activateDrawingTool = (toolMode: string) => {
    // Special handling for delete selected
    if (toolMode === "deleteselected") {
      onDeleteSelected();
      return;
    }

    // Change the active tool without affecting chart data
    onToolChange(toolMode);

    // Show a helper message
    const messageDiv = document.createElement("div");
    messageDiv.id = "drawing-helper";
    messageDiv.className =
      "fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md z-50";

    // Customize message based on tool
    if (toolMode === "drawline") {
      messageDiv.textContent = "Click and drag to draw a line";
    } else if (toolMode === "drawopenpath") {
      messageDiv.textContent =
        "Click and drag to draw freely. Note: Free-drawn shapes cannot be moved reliably.";
    } else if (toolMode === "drawrect") {
      messageDiv.textContent = "Click and drag to draw a rectangle";
    } else if (toolMode === "eraseshape") {
      messageDiv.textContent = "Click on shapes to erase them all";
    } else if (toolMode === "select") {
      messageDiv.textContent =
        "Click on a shape to select it. Drag selected shapes to move them.";
    } else if (toolMode === "measure") {
      messageDiv.textContent =
        "Click and drag to measure distance between two points";
    } else if (toolMode === "fibonacci") {
      messageDiv.textContent =
        "Click and drag from high to low price to draw Fibonacci retracement levels. Drag far enough to create a meaningful price range.";
    } else if (toolMode === "zoom") {
      messageDiv.textContent = "Click and drag to zoom in";
    } else if (toolMode === "pan") {
      messageDiv.textContent = "Click and drag to move around the chart";
    } else {
      messageDiv.textContent = "Drawing mode active";
    }

    // Remove any existing helper
    const existingHelper = document.getElementById("drawing-helper");
    if (existingHelper) {
      existingHelper.remove();
    }

    document.body.appendChild(messageDiv);

    // Remove the message after 5 seconds for Fibonacci tool, 3 seconds for others
    setTimeout(
      () => {
        const helperToRemove = document.getElementById("drawing-helper");
        if (helperToRemove) {
          helperToRemove.remove();
        }
      },
      toolMode === "fibonacci" ? 5000 : 3000
    );
  };

  return (
    <div
      className={`bg-background w-[50px] border rounded-lg shadow-lg p-2 transition-all duration-300 ${className} "w-[52px]"`}
    >
      <div className="space-y-2">
        <TooltipProvider>
          {drawingTools.map((tool) => (
            <Tooltip key={tool.name} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.mode ? "secondary" : "ghost"}
                  size="icon"
                  className={`w-full h-8`}
                  onClick={() => activateDrawingTool(tool.mode)}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground"
              >
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {internalHasSelectedShape && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-full h-8`}
                  onClick={() => activateDrawingTool("deleteselected")}
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground"
              >
                <p>Delete Selected</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        {showPathWarning && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Free-drawn paths cannot be moved reliably. Use shapes for movable
              elements.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <style jsx global>{`
        .chart-container {
          cursor: ${getCursorStyle(activeTool, isDragging, hasSelectedShape)};
        }
      `}</style>
    </div>
  );
}
