import type { DataPoint } from "../../../types/chart-types";

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
  yaxis?: string; // Add support for subplot axis
  text?: (string | number)[]; // Add support for hover text
  textposition?: string;
  textfont?: {
    size?: number;
    color?: string;
  };
  marker?: {
    symbol?: "circle";
    size?: number;
    color?: string;
  };
}

export interface IndicatorConfig {
  subplot?: boolean; // Whether this indicator should be plotted in a subplot
  height?: number; // Relative height of the subplot (0 to 1)
  // Add new configuration options
  options?: any;
  period?: number; // Add period configuration option
}

export abstract class Indicator {
  protected data: DataPoint[];
  static config: IndicatorConfig = { subplot: false };

  constructor(data: DataPoint[]) {
    this.data = data;
  }

  abstract calculate(): void;
  abstract generateTraces(): Trace[];

  static getConfig(): IndicatorConfig {
    return this.config;
  }
}
