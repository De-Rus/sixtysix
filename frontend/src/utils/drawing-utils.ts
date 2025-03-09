import type { SimpleShape } from "@/types/chart-types";

export interface DrawingState {
  isDrawing: boolean;
  startPoint: { x: string; y: number } | null;
  currentShape: SimpleShape | null;
}

export const initDrawingState = (): DrawingState => ({
  isDrawing: false,
  startPoint: null,
  currentShape: null,
});

export const createLine = (
  x0: string,
  y0: number,
  x1: string,
  y1: number,
  color: string = "rgb(59, 130, 246)",
  width: number = 2
): SimpleShape => ({
  type: "line",
  x0,
  y0,
  x1,
  y1,
  color,
  width,
});

export const updateLine = (
  line: SimpleShape,
  endPoint: { x: string; y: number }
): SimpleShape => {
  if (line.type !== "line") return line;
  return {
    ...line,
    x1: endPoint.x,
    y1: endPoint.y,
  };
};

export const isValidLine = (shape: SimpleShape): boolean => {
  if (shape.type !== "line") return false;
  return (
    shape.x0 !== shape.x1 || Math.abs(shape.y0 - shape.y1) > 0.00001
  );
};