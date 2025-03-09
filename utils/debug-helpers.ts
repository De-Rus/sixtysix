import type { DrawingTool } from "@/types/drawing-types"

// Add global debug helpers
if (typeof window !== "undefined") {
  // Function to set the drawing tool
  ;(window as any).setDrawingTool = (tool: DrawingTool) => {
    console.log("Debug: Setting drawing tool to:", tool)

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
  ;(window as any).testCircleDrawing = () => {
    console.log("Debug: Testing circle drawing")

    // First, set the tool to circle
    ;(window as any).setDrawingTool("circle")

    // Find the chart container
    const chartContainer = document.querySelector('[data-component="candlestick-chart"]')
    if (!chartContainer) {
      console.warn("Debug: Chart container not found")
      return
    }

    // Get the chart dimensions
    const rect = chartContainer.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Simulate a mouse down event at the center
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: centerX - 50,
      clientY: centerY - 50,
    })
    chartContainer.dispatchEvent(mouseDownEvent)

    // Simulate a mouse move event
    const mouseMoveEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: centerX + 50,
      clientY: centerY + 50,
    })
    chartContainer.dispatchEvent(mouseMoveEvent)

    // Simulate a mouse up event
    const mouseUpEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: centerX + 50,
      clientY: centerY + 50,
    })
    chartContainer.dispatchEvent(mouseUpEvent)

    console.log("Debug: Circle drawing test complete")
  }
}

