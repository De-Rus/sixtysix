export interface SimpleLine {
  type: "line";
  x0: string;
  y0: number;
  x1: string;
  y1: number;
  color: string;
  width: number;
}

export interface SimpleRectangle {
  type: "rect";
  x0: string;
  y0: number;
  x1: string;
  y1: number;
  color: string;
  width: number;
  fillcolor?: string;
  opacity?: number;
}

export type SimpleShape = SimpleLine | SimpleRectangle;