import type { Indicator } from "./base-indicator";

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

export interface ConfigurableIndicator extends Indicator {
  getParameters(): IndicatorParameter[];
  setParameters(params: Record<string, any>): void;
  getDefaultParameters(): Record<string, any>;
  validateParameters(params: Record<string, any>): void;
}

export function isConfigurableIndicator(
  indicator: Indicator
): indicator is ConfigurableIndicator {
  return (indicator as ConfigurableIndicator).getParameters !== undefined;
}
