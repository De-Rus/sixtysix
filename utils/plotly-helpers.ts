export function triggerPlotlyHover(chartDiv: HTMLDivElement, event: MouseEvent) {
  if (!window.Plotly) return

  const rect = chartDiv.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  window.Plotly.Fx.hover(chartDiv, {
    xval: x,
    yval: y,
  })
}

export function updateHoverPosition(hoverDiv: HTMLDivElement | null, event: MouseEvent, offset = { x: 10, y: 10 }) {
  if (!hoverDiv) return

  hoverDiv.style.left = `${event.pageX + offset.x}px`
  hoverDiv.style.top = `${event.pageY - offset.y}px`
}

