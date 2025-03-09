// Debug utility functions for the trading library
import type { DrawingTool } from "@/types/drawing-types"
import eventBus from "./event-bus"

// Add global debug helpers
if (typeof window !== "undefined") {
  // Function to set the drawing tool
  ;(window as any).setDrawingTool = (tool: DrawingTool) => {
    console.log("Debug: Setting drawing tool to:", tool)

    // Find the TradingChart component
    const tradingChart = document.querySelector('[data-component="trading-chart"]')
    if (!tradingChart) {
      console.warn("Debug: No TradingChart component found")
      return
    }

    // Update the data attribute
    tradingChart.setAttribute("data-selected-tool", tool)

    // Find all instances of DrawingToolbar and simulate a click on the tool button
    const toolbars = document.querySelectorAll('[data-component="drawing-toolbar"]')
    if (toolbars.length === 0) {
      console.warn("Debug: No DrawingToolbar components found")
      return
    }

    console.log(`Debug: Found ${toolbars.length} DrawingToolbar components`)

    toolbars.forEach((toolbar, index) => {
      const toolButton = toolbar.querySelector(`[data-tool="${tool}"]`)
      if (toolButton) {
        console.log(`Debug: Found tool button for ${tool} in toolbar ${index}`)
        // Simulate a click on the button
        ;(toolButton as HTMLElement).click()
      } else {
        console.warn(`Debug: Tool button for ${tool} not found in toolbar ${index}`)
      }
    })
  }

  // Function to test circle drawing
  export function testCircleDrawing() {
    console.log("Debug: Testing circle drawing");
    
    // First, set the tool to circle
    eventBus.publish('toolSelected', 'circle' as DrawingTool);
    
    // Find the candlestick chart
    const candlestickChart = document.querySelector('[data-component="candlestick-chart"]');
    if (!candlestickChart) {
      console.warn("Debug: Candlestick chart not found");
      return;
    }
    
    // Get the chart's dimensions
    const rect = candlestickChart.getBoundingClientRect();
    
    // Create synthetic click events
    setTimeout(() => {
      console.log("Debug: Simulating first click");
      
      // First click - start drawing
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 3,
        clientY: rect.top + rect.height / 3
      });
      
      candlestickChart.dispatchEvent(clickEvent);
      
      // Second click - finish drawing
      setTimeout(() => {
        console.log("Debug: Simulating second click");
        
        const clickEvent2 = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width * 2/3,
          clientY: rect.top + rect.height * 2/3
        });
        
        candlestickChart.dispatchEvent(clickEvent2);
      }, 500);
    }, 100);
  }
  // Add to window for debugging
  ;(window as any).testCircleDrawing = testCircleDrawing
  // Function to log the current state of all components
  ;(window as any).logDrawingState = () => {
    console.log("Debug: Logging drawing state")

    const tradingChart = document.querySelector('[data-component="trading-chart"]')
    const chartToolbar = document.querySelector('[data-component="chart-toolbar"]')
    const candlestickChart = document.querySelector('[data-component="candlestick-chart"]')
    const drawingToolbar = document.querySelector('[data-component="drawing-toolbar"]')

    console.log("TradingChart:", {
      element: tradingChart,
      selectedTool: tradingChart?.getAttribute("data-selected-tool"),
    })

    console.log("ChartToolbar:", {
      element: chartToolbar,
      selectedTool: chartToolbar?.getAttribute("data-selected-tool"),
    })

    console.log("CandlestickChart:", {
      element: candlestickChart,
      selectedTool: candlestickChart?.getAttribute("data-active-tool"),
      isDrawing: candlestickChart?.getAttribute("data-is-drawing"),
    })

    console.log("DrawingToolbar:", {
      element: drawingToolbar,
      selectedTool: drawingToolbar?.getAttribute("data-selected-tool"),
    })
  }
}

