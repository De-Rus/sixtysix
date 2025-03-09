export interface DataPoint {
  time: string
  open: number
  high: number
  low: number
  close: number
}

export interface IchimokuData {
  tenkan: (number | null)[]
  kijun: (number | null)[]
  senkouA: (number | null)[]
  senkouB: (number | null)[]
  chikou: (number | null)[]
  futureSenkouA: (number | null)[]
  futureSenkouB: (number | null)[]
}

export interface ChartProps {
  data?: DataPoint[]
  height?: number
  showIchimoku?: boolean
  showSMA?: boolean
  showEMA?: boolean
  darkMode?: boolean
}

