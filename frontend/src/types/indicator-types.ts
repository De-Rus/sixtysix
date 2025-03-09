export interface Trace {
  type: string
  x: string[]
  y: (number | null)[]
  name: string
  mode?: string
  line?: {
    color: string
    width?: number
    dash?: string
  }
  fill?: string
  fillcolor?: string
  showlegend?: boolean
  yaxis?: string
  xaxis?: string
  subplot?: boolean
}

