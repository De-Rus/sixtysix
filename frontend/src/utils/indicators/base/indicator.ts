import type { DataPoint } from "../../../types/chart-types";

export interface IndicatorParameter {
  name: string;
  type: string;
  label: string;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: {
    label: string;
    value: string;
  }[];
}
export interface Trace {
  type: string;
  x: string[];
  y: (number | null)[];
  name: string;
  mode?: string;
  line?: {
    color: string;
    width?: number;
    dash?: string;
  };
  fill?: string;
  fillcolor?: string;
  showlegend?: boolean;
  subplot?: boolean;
  yaxis?: string; // Add support for subplot axis
  xaxis?: string; // Add support for subplot axis
  text?: (string | number)[]; // Add support for hover text
  textposition?: string;
  textfont?: {
    family?: string;
    size?: number;
    color?: string;
    weight?: number;
  };
  marker?: {
    symbol?: "circle" | "triangle-up" | "triangle-down" | "dot";
    size?: number;
    color?: string | string[];
  };
  hoverinfo?: string;
  hoverlabel?: {
    bgcolor?: string;
    font?: {
      color?: string;
    };
  };
  hovertext?: string[];
}

export interface IndicatorConfig {
  subplot?: boolean;
  height?: number;
  options?: any;
  period?: number;
}

export abstract class Indicator {
  protected data: DataPoint[];
  static config: IndicatorConfig = { subplot: false };
  static defaultParams: IndicatorParameter[] = [];

  constructor(data: DataPoint[]) {
    this.data = data;
  }

  abstract calculate(): void;
  abstract generateTraces(): Trace[];

  getParameters(): IndicatorParameter[] {
    return Indicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {}

  validateParameters(params: Record<string, any>): void {
    const defaultParams = this.getParameters();

    for (const param of defaultParams) {
      const value = params[param.name];

      // Check if required parameter is present
      if (value === undefined) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      // Validate based on parameter type
      switch (param.type) {
        case "number":
          if (typeof value !== "number") {
            throw new Error(`Parameter ${param.name} must be a number`);
          }
          if (param.min !== undefined && value < param.min) {
            throw new Error(`Parameter ${param.name} must be >= ${param.min}`);
          }
          if (param.max !== undefined && value > param.max) {
            throw new Error(`Parameter ${param.name} must be <= ${param.max}`);
          }
          break;

        case "color":
          if (typeof value !== "string" || !value.match(/^(rgb|rgba|#)/)) {
            throw new Error(
              `Parameter ${param.name} must be a valid color value`
            );
          }
          break;
      }
    }
  }

  getDefaultParameters(): Record<string, any> {
    return Indicator.defaultParams;
  }

  static getConfig(): IndicatorConfig {
    return this.config;
  }
}
