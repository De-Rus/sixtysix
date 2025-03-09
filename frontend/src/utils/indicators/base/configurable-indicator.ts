export interface IndicatorParameter {
  name: string
  type: "number" | "boolean" | "string" | "select" | "color"
  label: string
  value: any
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
}

export interface ConfigurableIndicator {
  getParameters(): IndicatorParameter[]
  setParameters(params: Record<string, any>): void
}

