import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  BarChart2,
  Edit3,
  GitBranch,
  GitMerge,
  Hand,
  Move,
  Pencil,
  Percent,
  Ruler,
  Search,
  Square,
  TrendingUp,
  Waves,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

// Update the ToolbarProps interface to include a new prop for toggling advanced tools
interface ToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onToggleAdvancedTools?: () => void; // Add this new prop
}

// Update the Toolbar component to accept and use the new prop
export const DrawingToolbar = ({ activeTool, onToolChange }: ToolbarProps) => {
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  const onToggleAdvancedTools = () => {
    setShowAdvancedTools(!showAdvancedTools);
  };

  return (
    <>
      <div className="h-full border bg-background overflow-y-auto flex flex-col items-center py-4 px-2">
        <DrawingTool
          icon={Search}
          isActive={activeTool === "zoom"}
          tooltip="Zoom Tool"
          onClick={() => onToolChange("zoom")}
        />
        <DrawingTool
          icon={Move}
          isActive={activeTool === "move"}
          tooltip="Move Chart"
          onClick={() => onToolChange("move")}
        />
        <DrawingTool
          icon={Hand}
          isActive={activeTool === "hand"}
          tooltip="Pointer"
          onClick={() => onToolChange("hand")}
        />
        <DrawingTool
          icon={Pencil}
          isActive={activeTool === "pencil"}
          tooltip="Freehand Drawing"
          onClick={() => onToolChange("pencil")}
        />
        <DrawingTool
          icon={BarChart2}
          isActive={
            activeTool === "chart" ||
            activeTool.startsWith("fibonacci-") ||
            activeTool.startsWith("gann-") ||
            activeTool.startsWith("elliott-") ||
            activeTool.startsWith("harmonic-") ||
            activeTool.startsWith("andrews-") ||
            activeTool.startsWith("percent-")
          }
          tooltip="Advanced Chart Tools"
          onClick={(e) => {
            // Add the event parameter
            e.stopPropagation(); // Ensure the event doesn't bubble
            console.log("Toggle advanced tools clicked");
            if (onToggleAdvancedTools) {
              onToggleAdvancedTools();
            }
          }}
        />
        <DrawingTool
          icon={TrendingUp}
          isActive={activeTool === "trend"}
          tooltip="Trend Line"
          onClick={() => onToolChange("trend")}
        />
        <DrawingTool
          icon={ArrowUp}
          isActive={activeTool === "long-position"}
          tooltip="Long Position"
          onClick={() => onToolChange("long-position")}
        />
        <DrawingTool
          icon={ArrowDown}
          isActive={activeTool === "short-position"}
          tooltip="Short Position"
          onClick={() => onToolChange("short-position")}
        />
        <DrawingTool
          icon={Edit3}
          isActive={activeTool === "annotate"}
          tooltip="Annotation"
          onClick={() => onToolChange("annotate")}
        />
        <DrawingTool
          icon={Square}
          isActive={activeTool === "rectangle"}
          tooltip="Rectangle"
          onClick={() => onToolChange("rectangle")}
        />
        <DrawingTool
          icon={Ruler}
          isActive={activeTool === "measure"}
          tooltip="Measure Tool"
          onClick={() => onToolChange("measure")}
        />
      </div>

      {showAdvancedTools && (
        <AdvancedChartTools
          onToolSelect={onToolChange}
          activeTool={activeTool}
          isVisible={showAdvancedTools}
        />
      )}
    </>
  );
};

function DrawingTool({
  icon: Icon,
  isActive,
  tooltip,
  onClick,
}: {
  icon: React.ElementType;
  isActive: boolean;
  tooltip: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative group my-1">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Tool clicked:", tooltip);
          if (onClick) {
            onClick(e);
            console.log("Tool change callback executed");
          }
        }}
        className={cn(
          "p-2 rounded-md hover:bg-accent/80 transition-colors",
          isActive && "bg-accent border border-border"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="sr-only">{tooltip}</span>
      </button>

      {/* Tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
        <div className="bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-md whitespace-nowrap">
          {tooltip}
        </div>
      </div>
    </div>
  );
}

interface AdvancedChartToolsProps {
  onToolSelect: (tool: string) => void;
  activeTool: string;
  isVisible: boolean;
}

export default function AdvancedChartTools({
  onToolSelect,
  activeTool,
  isVisible,
}: AdvancedChartToolsProps) {
  const tools = [
    {
      id: "fibonacci-retracement",
      name: "Fibonacci Retracement",
      icon: GitBranch,
    },
    { id: "fibonacci-extension", name: "Fibonacci Extension", icon: GitMerge },
    { id: "andrews-pitchfork", name: "Andrews Pitchfork", icon: TrendingUp },
    { id: "gann-fan", name: "Gann Fan", icon: Ruler },
    { id: "elliott-wave", name: "Elliott Wave", icon: Waves },
    { id: "harmonic-pattern", name: "Harmonic Pattern", icon: ArrowRightLeft },
    { id: "percent-retracement", name: "Percent Retracement", icon: Percent },
  ];

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
    // No need to explicitly close the menu here as it will be handled in the parent component
  };

  return (
    <div
      className={`fixed left-16 top-0 mt-12 ml-2 bg-background border rounded-md shadow-lg p-2 w-64 z-[100] transition-all duration-200 ${
        isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-4 pointer-events-none"
      }`}
      style={{
        boxShadow: isVisible
          ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          : "none",
      }}
    >
      <h3 className="text-sm font-medium mb-2 px-2">Advanced Chart Tools</h3>
      <div className="space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <Button
              key={tool.id}
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start text-sm h-9"
              onClick={() => {
                console.log("Selected advanced tool:", tool.id);
                handleToolSelect(tool.id);
              }}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tool.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
