import type { DataPoint } from "../../types/chart-types"

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
  yaxis?: string // Add support for subplot axis
  text?: (string | number)[] // Add support for hover text
}

export interface IndicatorConfig {
  subplot?: boolean // Whether this indicator should be plotted in a subplot
  height?: number // Relative height of the subplot (0 to 1)
  // Add new configuration options
  options?: any
  period?: number // Add period configuration option
}

export abstract class Indicator {
  protected data: DataPoint[]
  static config: IndicatorConfig = { subplot: false }

  constructor(data: DataPoint[]) {
    this.data = data
  }

  abstract calculate(): void
  abstract generateTraces(): Trace[]

  // Method to get indicator configuration
  static getConfig(): IndicatorConfig {
    return this.config
  }

  // Method to get data
  getData(): DataPoint[] {
    return this.data
  }

  // Method to set options
  setOptions(options: any): void {
    // Set options for the indicator
    this.constructor.config.options = options
  }

  // Method to get options
  getOptions(): any {
    return this.constructor.config.options
  }

  // Method to set period
  setPeriod(period: number): void {
    this.constructor.config.period = period
  }

  // Method to get period
  getPeriod(): number | undefined {
    return this.constructor.config.period
  }
}

