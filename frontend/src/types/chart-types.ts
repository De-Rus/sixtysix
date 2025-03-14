export interface DataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface Line {
  id: string;
  color: string;
  data: DataPoint[];
  visible: boolean;
}

export interface ChartProps {
  data?: DataPoint[];
  height?: number;
  showIchimoku?: boolean;
  showSMA?: boolean;
  showEMA?: boolean;
  darkMode?: boolean;
}
