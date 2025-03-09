"use client"

import type React from "react"
import Plot from "react-plotly.js"
import { useRef, useMemo, useCallback, useState, useEffect } from "react"
import { DrawingManager } from "../drawing/DrawingManager"
import type { DrawingTool, Point } from "@/types/drawing-types"
import "../../styles/cursor.css"
import { generateShapesForPlotly } from "@/utils/drawing/shape-generation"
import { DrawingDebugPanel } from "../debug/DrawingDebugPanel"
import eventBus from "@/utils/event-bus"

// ... other imports

interface Props {
  data: any[]
  selectedIndicators?: string[]
  indicatorConfigs?: any
  darkMode?: boolean
  orders?: any[]
  positions?: any[]
  height?: number
  yAxisRange?: number[]
  xAxisRange?: string[]
  subplotHeights?: number[]
  selectedTool?: DrawingTool // Make this optional with a default value
}

const CandlestickChart = ({
  data,
  selectedIndicators = [],
  indicatorConfigs = {},
  darkMode = false,
  orders = [],
  positions = [],
  height = 500,
  yAxisRange,
  xAxisRange,
  subplotHeights,
  selectedTool = "cursor", // Provide a default value
}: Props) => {
  const plotRef = useRef<any>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const drawingManagerRef = useRef<any>(null)
  const chartKey = useMemo(() => selectedIndicators.join(""), [selectedIndicators])

  const [activeTool, setActiveTool] = useState<DrawingTool>("cursor")
  const [isDrawing, setIsDrawing] = useState(false)
  const [mousePosition, setMousePosition] = useState<{ x: string | number; y: number } | null>(null)
  const [clickedPoints, setClickedPoints] = useState<Point[]>([])
  const [shapes, setShapes] = useState<any[]>([])
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)

  // Keep track of previous selectedTool for comparison
  const prevSelectedToolRef = useRef<DrawingTool>(selectedTool)

  // Add logging to track tool selection
  useEffect(() => {
    console.log(`CandlestickChart: selectedTool prop changed from ${prevSelectedToolRef.current} to ${selectedTool}`)
    prevSelectedToolRef.current = selectedTool

    // Update data attribute
    if (chartRef.current) {
      chartRef.current.setAttribute("data-active-tool", selectedTool)
      console.log(`CandlestickChart: Updated data-active-tool attribute to: ${selectedTool}`)

      // Update cursor style based on selected tool
      // First, remove all cursor classes
      chartRef.current.classList.remove("cursor-crosshair", "cursor-grab", "cursor-none")

      // Add appropriate cursor class based on selected tool
      if (["line", "horizontal", "rectangle"].includes(selectedTool)) {
        chartRef.current.classList.add("cursor-crosshair")
        console.log(`CandlestickChart: Set cursor to crosshair for tool: ${selectedTool}`)
      } else if (selectedTool === "cursor") {
        chartRef.current.classList.add("cursor-grab")
        console.log(`CandlestickChart: Set cursor to grab for tool: ${selectedTool}`)
      }
    }
  }, [selectedTool])

  // Log on mount
  useEffect(() => {
    console.log("CandlestickChart mounted with props:", {
      dataLength: data?.length || 0,
      selectedIndicators,
      darkMode,
      selectedTool,
    })
    return () => {
      console.log("CandlestickChart unmounting")
    }
  }, [data?.length, selectedIndicators, darkMode, selectedTool]) // Added dependencies

  // Add a useEffect to log when activeTool changes
  useEffect(() => {
    console.log("CandlestickChart: activeTool changed to:", activeTool, "isDrawing:", isDrawing)

    // Check if drawingManagerRef is defined
    if (drawingManagerRef.current) {
      console.log("CandlestickChart: drawingManagerRef is defined")
    } else {
      console.warn("CandlestickChart: drawingManagerRef is null when activeTool changed")
    }
  }, [activeTool, isDrawing])

  // Debug logging to check if the tool state is changing
  useEffect(() => {
    console.log("Active tool changed:", activeTool)
  }, [activeTool])

  // Add a useEffect to sync the selectedTool prop with the activeTool state
  useEffect(() => {
    if (selectedTool !== activeTool) {
      console.log("CandlestickChart: Syncing selectedTool prop to activeTool state:", selectedTool)
      setActiveTool(selectedTool)

      // Also update the DrawingManager
      if (drawingManagerRef.current) {
        console.log("CandlestickChart: Updating DrawingManager with new tool:", selectedTool)
        drawingManagerRef.current.handleToolChange(selectedTool)
      } else {
        console.warn("CandlestickChart: drawingManagerRef.current is null when trying to sync tool")
      }
    }
  }, [selectedTool, activeTool])

  useEffect(() => {
    console.log("CandlestickChart: Setting up event bus subscription")

    const unsubscribe = eventBus.subscribe("toolSelected", (tool: DrawingTool) => {
      console.log(`CandlestickChart: Received tool selection event for tool: ${tool}`)
      setActiveTool(tool)

      // Also update the DrawingManager
      if (drawingManagerRef.current) {
        console.log(`CandlestickChart: Updating DrawingManager with tool: ${tool}`)
        drawingManagerRef.current.handleToolChange(tool)
      }
    })

    return () => {
      console.log("CandlestickChart: Cleaning up event bus subscription")
      unsubscribe()
    }
  }, [])

  // Add more detailed logging to the handleDrawingStateChange function
  const handleDrawingStateChange = useCallback(
    (state: {
      activeTool: DrawingTool
      isDrawing: boolean
      mousePosition: { x: string | number; y: number } | null
    }) => {
      console.log("CandlestickChart: Drawing state changed", state)
      setActiveTool(state.activeTool)
      setIsDrawing(state.isDrawing)
      setMousePosition(state.mousePosition)
    },
    [],
  )

  // Add more detailed logging to the handlePointsChange function
  const handlePointsChange = useCallback((points: Point[]) => {
    console.log("CandlestickChart: Points changed", points)
    setClickedPoints(points)
    if (points.length > 0) {
      console.log("CandlestickChart: Setting start point", points[0])
      setStartPoint(points[0])
    }
  }, [])

  // Define generatePlotData as a regular function
  const generatePlotData = ({
    data,
    selectedIndicators,
    indicatorConfigs,
    darkMode,
    orders,
    positions,
  }: {
    data: any[]
    selectedIndicators: string[]
    indicatorConfigs: any
    darkMode: boolean
    orders: any[]
    positions: any[]
  }) => {
    // Implementation for generatePlotData
    return [] // Replace with actual implementation
  }

  // Memoize the result of calling generatePlotData
  const plotData = useMemo(() => {
    return generatePlotData({
      data,
      selectedIndicators,
      indicatorConfigs,
      darkMode,
      orders,
      positions,
    })
  }, [data, selectedIndicators, indicatorConfigs, darkMode, orders, positions])

  const generateChartLayout = ({
    darkMode,
    height,
    yAxisRange,
    xAxisRange,
    data,
    lines,
    activeLine,
    subplotHeights,
  }: any) => {
    //Implementation for generateChartLayout
    return {}
  }

  const generateChartConfig = () => {
    //Implementation for generateChartConfig
    return {}
  }

  // Add more detailed logging to the updatePlotlyShapes function
  const updatePlotlyShapes = useCallback((newShapes: any[]) => {
    console.log("CandlestickChart: Updating Plotly shapes", newShapes)
    setShapes(newShapes)
  }, [])

  // Generate Plotly shapes for rendering
  const plotlyShapes = useMemo(() => {
    return generateShapesForPlotly(shapes, isDrawing, startPoint, endPoint || mousePosition, activeTool)
  }, [shapes, isDrawing, startPoint, endPoint, mousePosition, activeTool])

  // Add more detailed logging to the handleDrawingManagerEvent function
  const handleDrawingManagerEvent = useCallback(
    (event: any, type: "click" | "mouseMove" | "rightClick") => {
      console.log(`CandlestickChart: Drawing manager event: ${type}`, {
        activeTool,
        isDrawing,
        eventPoints: event?.points?.length || 0,
      })

      if (drawingManagerRef.current) {
        // Always pass mouse move events to the drawing manager for cursor tracking
        if (type === "mouseMove") {
          drawingManagerRef.current.handleMouseMove(event)
          setEndPoint(mousePosition)

          //  {
          drawingManagerRef.current.handleMouseMove(event)
          setEndPoint(mousePosition)

          // Force update shapes on mouse move if we're in a drawing tool
          if (activeTool !== "cursor") {
            console.log("CandlestickChart: Updating shapes on mouse move for tool", activeTool)
            const shapes = drawingManagerRef.current.getPlotlyShapes()
            updatePlotlyShapes(shapes)
          }
        }

        // For drawing tools, route other events to the drawing manager
        if (activeTool !== "cursor") {
          console.log(`CandlestickChart: Handling ${type} event for tool ${activeTool}`)

          if (type === "click") {
            console.log("CandlestickChart: Forwarding click to DrawingManager")
            drawingManagerRef.current.handleClick(event)

            // Update shapes after click
            console.log("CandlestickChart: Updating shapes after click")
            const shapes = drawingManagerRef.current.getPlotlyShapes()
            updatePlotlyShapes(shapes)

            // Update clicked points
            if (drawingManagerRef.current.getClickedPoints) {
              console.log("CandlestickChart: Updating clicked points after click")
              setClickedPoints(drawingManagerRef.current.getClickedPoints())
            }

            // Check if we're still drawing
            const stillDrawing = drawingManagerRef.current.isCurrentlyDrawing?.() || false
            console.log("CandlestickChart: Still drawing?", stillDrawing)
            setIsDrawing(stillDrawing)

            // If we're done drawing, clear the points
            if (!stillDrawing) {
              console.log("CandlestickChart: Clearing points after finishing drawing")
              setStartPoint(null)
              setEndPoint(null)
            }
          } else if (type === "rightClick") {
            console.log("CandlestickChart: Forwarding right click to DrawingManager")
            drawingManagerRef.current.handleRightClick(event)

            // Update shapes after right click
            console.log("CandlestickChart: Updating shapes after right click")
            const shapes = drawingManagerRef.current.getPlotlyShapes()
            updatePlotlyShapes(shapes)

            // Clear points
            console.log("CandlestickChart: Clearing points after right click")
            setClickedPoints([])
            setStartPoint(null)
            setEndPoint(null)
            setIsDrawing(false)
          }
        }
      } else {
        console.warn("CandlestickChart: drawingManagerRef.current is null")
      }
    },
    [activeTool, updatePlotlyShapes, mousePosition, isDrawing],
  )

  // Add more detailed logging to the handleToolSelect function
  const handleToolSelect = (tool: DrawingTool) => {
    console.log("CandlestickChart: Tool selected:", tool, "Previous tool was:", activeTool)
    setActiveTool(tool)
    setIsDrawing(false)
    setClickedPoints([]) // Clear points when tool changes
    setStartPoint(null)
    setEndPoint(null)

    if (drawingManagerRef.current) {
      console.log("CandlestickChart: Forwarding tool change to DrawingManager")
      drawingManagerRef.current.handleToolChange(tool)
    } else {
      console.warn("CandlestickChart: drawingManagerRef.current is null when trying to change tool")
    }

    handleDrawingStateChange({
      activeTool: tool,
      isDrawing: false,
      mousePosition,
    })
  }

  const handleCursorPositionChange = useCallback(
    (position: { x: string | number; y: number } | null) => {
      setMousePosition(position)
      if (isDrawing && startPoint && position) {
        setEndPoint(position)
      }

      if (activeTool !== "cursor" && position) {
        // Force update shapes when cursor position changes and a drawing tool is active
        const shapes = drawingManagerRef.current?.getPlotlyShapes() || []
        updatePlotlyShapes(shapes)
      }
    },
    [activeTool, updatePlotlyShapes, isDrawing, startPoint],
  )

  const handleMouseEnter = () => {
    console.log("CandlestickChart: Mouse enter")
  }

  const handleMouseLeave = () => {
    console.log("CandlestickChart: Mouse leave")
  }

  // Add more detailed logging to the handleMouseDown function
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      console.log("CandlestickChart: Mouse down event", {
        activeTool,
        isDrawing,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    [activeTool, isDrawing],
  )

  // Add more detailed logging to the handleMouseUp function
  const handleMouseUp = useCallback(
    (event: React.MouseEvent) => {
      console.log("CandlestickChart: Mouse up event", {
        activeTool,
        isDrawing,
        startPoint,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    [activeTool, isDrawing, startPoint],
  )

  // Add a direct click handler for the chart
  const handleChartClick = useCallback(
    (event: React.MouseEvent) => {
      console.log("CandlestickChart: Direct chart click", {
        activeTool,
        isDrawing,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    [activeTool, isDrawing, updatePlotlyShapes],
  )

  return (
    <div
      className={`flex-1 bg-background border-t`}
      ref={chartRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleChartClick}
      style={activeTool !== "cursor" ? { cursor: "crosshair" } : { cursor: "grab" }}
      data-component="candlestick-chart"
      data-active-tool={activeTool}
      data-is-drawing={isDrawing ? "true" : "false"}
    >
      <Plot
        ref={plotRef}
        key={chartKey}
        data={plotData}
        layout={{
          ...generateChartLayout({
            darkMode,
            height,
            yAxisRange: yAxisRange || [0, 100],
            xAxisRange: xAxisRange || (data.length ? [data[0].time, data[data.length - 1].time] : ["", ""]),
            data,
            lines: [],
            activeLine: null,
            subplotHeights: subplotHeights || [],
          }),
          shapes: plotlyShapes,
          hovermode: "closest",
          dragmode: "none", // Disable Plotly's built-in drag mode
        }}
        config={{
          ...generateChartConfig(),
          scrollZoom: false, // Disable scroll zoom to avoid conflicts
          displayModeBar: false, // Hide the mode bar
          modeBarButtonsToAdd: [], // No additional buttons
          doubleClick: false, // Disable double-click zoom
          showAxisDragHandles: false, // Hide axis drag handles
          showAxisRangeEntryBoxes: false,
          staticPlot: false,
          editable: false,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        useResizeHandler
        onClick={(event) => {
          console.log("Plot onClick event:", event)
          handleDrawingManagerEvent(event, "click")
        }}
        onHover={(event) => {
          console.log("Plot onHover event:", event)
          handleDrawingManagerEvent(event, "mouseMove")
        }}
        onMouseMove={(event) => {
          // Track mouse position for the custom cursor
          if (chartRef.current && activeTool !== "cursor") {
            const rect = chartRef.current.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            setMousePosition({ x, y })
          }

          handleDrawingManagerEvent(event, "mouseMove")
        }}
        onRightClick={(event) => {
          event.preventDefault()
          handleDrawingManagerEvent(event, "rightClick")
        }}
        divId="plot-container"
      />
      <DrawingManager
        ref={drawingManagerRef}
        onDrawingToolChange={handleToolSelect}
        onShapesChange={updatePlotlyShapes}
        onCursorPositionChange={handleCursorPositionChange}
        onStateChange={handleDrawingStateChange}
        onPointsChange={handlePointsChange}
      />
      {process.env.NODE_ENV !== "production" && (
        <DrawingDebugPanel
          activeTool={activeTool}
          isDrawing={isDrawing}
          startPoint={startPoint}
          endPoint={endPoint}
          shapes={shapes}
        />
      )}
    </div>
  )
}

export default CandlestickChart

