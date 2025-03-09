import type { DataPoint } from "../types/chart-types"

/**
 * Base class for all indicators
 */
export abstract class Indicator {
  protected data: DataPoint[]

  constructor(data: DataPoint[]) {
    this.data = data
  }

  /**
   * Calculate the indicator values
   */
  abstract calculate(): void

  /**
   * Generate plotly traces for the indicator
   */
  abstract generateTraces(): Trace[]
}

/**
 * Interface for plotly trace objects
 */
export interface Trace {
  x: string[]
  y: (number | null)[]
  type: string
  mode?: string
  name: string
  line?: {
    color: string
    width: number
  }
  marker?: {
    color: string
  }
  fill?: string
  fillcolor?: string
}

