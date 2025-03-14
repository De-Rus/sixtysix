import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface IchimokuData {
  tenkan: (number | null)[];
  kijun: (number | null)[];
  senkouA: (number | null)[];
  senkouB: (number | null)[];
  chikou: (number | null)[];
  futureSenkouA: (number | null)[];
  futureSenkouB: (number | null)[];
}

export class IchimokuIndicator extends Indicator {
  static readonly indicatorName = "Ichimoku Cloud";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "tenkanPeriod",
      type: "number",
      label: "Tenkan-sen Period",
      value: 9,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "kijunPeriod",
      type: "number",
      label: "Kijun-sen Period",
      value: 26,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "senkouPeriod",
      type: "number",
      label: "Senkou Span B Period",
      value: 52,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "chikouOffset",
      type: "number",
      label: "Chikou Span Offset",
      value: 26,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      name: "tenkanColor",
      type: "color",
      label: "Tenkan-sen Color",
      value: "rgba(59, 130, 246, 1)",
    },
    {
      name: "kijunColor",
      type: "color",
      label: "Kijun-sen Color",
      value: "rgba(239, 68, 68, 1)",
    },
    {
      name: "senkouAColor",
      type: "color",
      label: "Senkou Span A Color",
      value: "rgba(34, 197, 94, 1)",
    },
    {
      name: "senkouBColor",
      type: "color",
      label: "Senkou Span B Color",
      value: "rgba(180, 83, 9, 1)",
    },
    {
      name: "chikouColor",
      type: "color",
      label: "Chikou Span Color",
      value: "rgba(147, 51, 234, 1)",
    },
    {
      name: "cloudColor",
      type: "color",
      label: "Cloud Color",
      value: "rgba(255, 165, 0, 0.2)",
    },
  ];
  private result: IchimokuData | null = null;
  private tenkanPeriod: number;
  private kijunPeriod: number;
  private senkouPeriod: number;
  private chikouOffset: number;
  private colors: {
    tenkan: string;
    kijun: string;
    senkouA: string;
    senkouB: string;
    chikou: string;
    cloud: string;
  };

  constructor(
    data: DataPoint[],
    tenkanPeriod = 9,
    kijunPeriod = 26,
    senkouPeriod = 52,
    chikouOffset = 26,
    colors = {
      tenkan: "rgba(59, 130, 246, 1)", // blue
      kijun: "rgba(239, 68, 68, 1)", // red
      senkouA: "rgba(34, 197, 94, 1)", // green
      senkouB: "rgba(180, 83, 9, 1)", // brown
      chikou: "rgba(147, 51, 234, 1)", // purple
      cloud: "rgba(255, 165, 0, 0.2)", // orange with transparency
    }
  ) {
    super(data);
    this.tenkanPeriod = tenkanPeriod;
    this.kijunPeriod = kijunPeriod;
    this.senkouPeriod = senkouPeriod;
    this.chikouOffset = chikouOffset;
    this.colors = colors;
  }

  setParameters(params: Record<string, any>): void {
    if (params.tenkanPeriod !== undefined)
      this.tenkanPeriod = params.tenkanPeriod;
    if (params.kijunPeriod !== undefined) this.kijunPeriod = params.kijunPeriod;
    if (params.senkouPeriod !== undefined)
      this.senkouPeriod = params.senkouPeriod;
    if (params.chikouOffset !== undefined)
      this.chikouOffset = params.chikouOffset;

    this.colors = {
      tenkan: params.tenkanColor || this.colors.tenkan,
      kijun: params.kijunColor || this.colors.kijun,
      senkouA: params.senkouAColor || this.colors.senkouA,
      senkouB: params.senkouBColor || this.colors.senkouB,
      chikou: params.chikouColor || this.colors.chikou,
      cloud: params.cloudColor || this.colors.cloud,
    };

    this.calculate(); // Recalculate with new parameters
  }

  private calculateAverage(slice: DataPoint[]): number {
    if (!slice || slice.length === 0) {
      return 0;
    }
    const highMax = Math.max(...slice.map((d) => d.high));
    const lowMin = Math.min(...slice.map((d) => d.low));
    return (highMax + lowMin) / 2;
  }

  calculate(): void {
    // Check if we have enough data
    if (!this.data || this.data.length === 0) {
      console.warn("Ichimoku: No data available for calculation");
      this.result = {
        tenkan: [],
        kijun: [],
        senkouA: [],
        senkouB: [],
        chikou: [],
        futureSenkouA: [],
        futureSenkouB: [],
      };
      return;
    }

    const result: IchimokuData = {
      tenkan: [],
      kijun: [],
      senkouA: [],
      senkouB: [],
      chikou: [],
      futureSenkouA: [],
      futureSenkouB: [],
    };

    try {
      for (let i = 0; i < this.data.length; i++) {
        // Tenkan-sen
        result.tenkan.push(
          i >= this.tenkanPeriod - 1
            ? this.calculateAverage(
                this.data.slice(i - this.tenkanPeriod + 1, i + 1)
              )
            : null
        );

        // Kijun-sen
        result.kijun.push(
          i >= this.kijunPeriod - 1
            ? this.calculateAverage(
                this.data.slice(i - this.kijunPeriod + 1, i + 1)
              )
            : null
        );

        // Senkou Span A
        result.senkouA.push(
          i >= this.kijunPeriod - 1 &&
            result.tenkan[i] !== null &&
            result.kijun[i] !== null
            ? (result.tenkan[i]! + result.kijun[i]!) / 2
            : null
        );

        // Senkou Span B
        result.senkouB.push(
          i >= this.senkouPeriod - 1
            ? this.calculateAverage(
                this.data.slice(i - this.senkouPeriod + 1, i + 1)
              )
            : null
        );

        // Chikou Span
        result.chikou.push(
          i >= this.chikouOffset ? this.data[i - this.chikouOffset].close : null
        );
      }

      // Calculate future values for the cloud
      result.futureSenkouA = [];
      result.futureSenkouB = [];

      for (let i = 0; i < this.chikouOffset; i++) {
        const senkouAValue =
          result.senkouA[this.data.length - this.chikouOffset + i] || null;
        const senkouBValue =
          result.senkouB[this.data.length - this.chikouOffset + i] || null;

        result.futureSenkouA.push(senkouAValue);
        result.futureSenkouB.push(senkouBValue);
      }

      this.result = result;
    } catch (error) {
      console.error("Error calculating Ichimoku:", error);
      // Initialize with empty arrays to prevent errors
      this.result = {
        tenkan: [],
        kijun: [],
        senkouA: [],
        senkouB: [],
        chikou: [],
        futureSenkouA: [],
        futureSenkouB: [],
      };
    }
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    // Double-check that we have a valid result
    if (!this.result || !this.data || this.data.length === 0) {
      console.warn("Ichimoku: No valid result or data for generating traces");
      return [];
    }

    try {
      const times = this.data.map((d) => d.time);

      // Ensure we have future dates for the cloud
      const futureDates: string[] = [];
      if (this.data.length > 1) {
        const lastDate = new Date(this.data[this.data.length - 1].time);
        const dateStep =
          new Date(this.data[1].time).getTime() -
          new Date(this.data[0].time).getTime();

        for (let i = 0; i < this.chikouOffset; i++) {
          const futureDate = new Date(lastDate.getTime() + (i + 1) * dateStep);
          futureDates.push(futureDate.toISOString().split("T")[0]);
        }
      }

      // Ensure all arrays exist and are arrays
      const tenkan = Array.isArray(this.result.tenkan)
        ? this.result.tenkan
        : [];
      const kijun = Array.isArray(this.result.kijun) ? this.result.kijun : [];
      const senkouA = Array.isArray(this.result.senkouA)
        ? this.result.senkouA
        : [];
      const senkouB = Array.isArray(this.result.senkouB)
        ? this.result.senkouB
        : [];
      const chikou = Array.isArray(this.result.chikou)
        ? this.result.chikou
        : [];
      const futureSenkouA = Array.isArray(this.result.futureSenkouA)
        ? this.result.futureSenkouA
        : [];
      const futureSenkouB = Array.isArray(this.result.futureSenkouB)
        ? this.result.futureSenkouB
        : [];

      return [
        {
          x: times,
          y: tenkan,
          type: "scatter",
          mode: "lines",
          name: `Tenkan-sen (${this.tenkanPeriod})`,
          line: { color: this.colors.tenkan },
        },
        {
          x: times,
          y: kijun,
          type: "scatter",
          mode: "lines",
          name: `Kijun-sen (${this.kijunPeriod})`,
          line: { color: this.colors.kijun },
        },
        {
          x: times.concat(futureDates),
          y: senkouA.concat(futureSenkouA),
          type: "scatter",
          mode: "lines",
          name: "Senkou Span A",
          line: { color: this.colors.senkouA, dash: "dot" },
        },
        {
          x: times.concat(futureDates),
          y: senkouB.concat(futureSenkouB),
          type: "scatter",
          mode: "lines",
          name: "Senkou Span B",
          line: { color: this.colors.senkouB, dash: "dot" },
        },
        {
          x: times,
          y: chikou,
          type: "scatter",
          mode: "lines",
          name: `Chikou Span (${this.chikouOffset})`,
          line: { color: this.colors.chikou },
        },
        {
          x: times
            .concat(futureDates)
            .concat(times.length > 0 ? times[times.length - 1] : ""),
          y: senkouA
            .concat(futureSenkouA)
            .concat(senkouB.length > 0 ? senkouB[senkouB.length - 1] : null),
          fill: "tonexty",
          type: "scatter",
          mode: "none",
          name: "Cloud",
          fillcolor: this.colors.cloud,
        },
      ];
    } catch (error) {
      console.error("Error generating Ichimoku traces:", error);
      return [];
    }
  }
}
