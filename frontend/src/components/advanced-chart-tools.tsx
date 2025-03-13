"use client";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  GitBranch,
  GitMerge,
  Ruler,
  Waves,
  ArrowRightLeft,
  Percent,
} from "lucide-react";
import { useEffect } from "react";

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
  // Use useEffect for logging instead of doing it during render
  useEffect(() => {
    // This will run after render and won't cause issues with DebugOverlay
    if (process.env.NODE_ENV === "development") {
      // Only log in development
      console.log("AdvancedChartTools visibility changed:", isVisible);
    }
  }, [isVisible]);

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
