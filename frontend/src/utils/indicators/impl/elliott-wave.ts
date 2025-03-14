import { Indicator, IndicatorParameter, type Trace } from "../base/indicator";
import type { DataPoint } from "../../../types/chart-types";

interface WavePoint {
  index: number;
  time: string;
  price: number;
  label: string;
  type: "impulse" | "corrective";
  waveNumber: number | string; // number for impulse (1-5), string for corrective (A,B,C)
}

interface ElliottWaveResult {
  waves: WavePoint[];
  currentCycle: "impulse" | "corrective";
}

export class ElliottWaveIndicator extends Indicator {
  static readonly indicatorName = "Elliott Wave";
  static readonly defaultParams: IndicatorParameter[] = [
    {
      name: "lookback",
      type: "number",
      label: "Lookback Period",
      value: 10,
      min: 5,
      max: 50,
      step: 1,
    },
    {
      name: "sensitivity",
      type: "number",
      label: "Wave Sensitivity",
      value: 0.02,
      min: 0.001,
      max: 0.1,
      step: 0.001,
    },
    {
      name: "impulseColor",
      type: "string",
      label: "Impulse Wave Color",
      value: "rgb(34, 197, 94)",
    }, // Green
    {
      name: "correctiveColor",
      type: "string",
      label: "Corrective Wave Color",
      value: "rgb(239, 68, 68)",
    }, // Red
    { name: "showLabels", type: "boolean", label: "Show Labels", value: true },
    {
      name: "labelSize",
      type: "number",
      label: "Label Size",
      value: 12,
      min: 8,
      max: 24,
      step: 1,
    },
  ];

  private result: ElliottWaveResult | null = null;
  private lookback: number;
  private sensitivity: number;
  private impulseColor: string;
  private correctiveColor: string;
  private showLabels: boolean;
  private labelSize: number;

  constructor(
    data: DataPoint[],
    lookback = 10,
    sensitivity = 0.02,
    impulseColor = "rgb(34, 197, 94)",
    correctiveColor = "rgb(239, 68, 68)",
    showLabels = true,
    labelSize = 12
  ) {
    super(data);
    this.lookback = lookback;
    this.sensitivity = sensitivity;
    this.impulseColor = impulseColor;
    this.correctiveColor = correctiveColor;
    this.showLabels = showLabels;
    this.labelSize = labelSize;
  }

  getParameters(): IndicatorParameter[] {
    return ElliottWaveIndicator.defaultParams;
  }

  setParameters(params: Record<string, any>): void {
    if (params.lookback) this.lookback = params.lookback;
    if (params.sensitivity) this.sensitivity = params.sensitivity;
    if (params.impulseColor) this.impulseColor = params.impulseColor;
    if (params.correctiveColor) this.correctiveColor = params.correctiveColor;
    if (params.showLabels !== undefined) this.showLabels = params.showLabels;
    if (params.labelSize) this.labelSize = params.labelSize;
    this.calculate();
  }

  private isPivotHigh(index: number): boolean {
    const prices = this.data.map((d) => d.high);
    const start = Math.max(0, index - this.lookback);
    const end = Math.min(prices.length - 1, index + this.lookback);

    const currentPrice = prices[index];
    for (let i = start; i <= end; i++) {
      if (i !== index && prices[i] > currentPrice) {
        return false;
      }
    }
    return true;
  }

  private isPivotLow(index: number): boolean {
    const prices = this.data.map((d) => d.low);
    const start = Math.max(0, index - this.lookback);
    const end = Math.min(prices.length - 1, index + this.lookback);

    const currentPrice = prices[index];
    for (let i = start; i <= end; i++) {
      if (i !== index && prices[i] < currentPrice) {
        return false;
      }
    }
    return true;
  }

  private findWavePoints(): WavePoint[] {
    const pivots: WavePoint[] = [];
    let isUptrend = true;
    let waveCount = 1;
    let correctiveWave: "A" | "B" | "C" | null = null;

    // Find all pivot points
    for (let i = this.lookback; i < this.data.length - this.lookback; i++) {
      if (this.isPivotHigh(i)) {
        const point: WavePoint = {
          index: i,
          time: this.data[i].time,
          price: this.data[i].high,
          label: isUptrend ? waveCount.toString() : correctiveWave || "",
          type: isUptrend ? "impulse" : "corrective",
          waveNumber: isUptrend ? waveCount : correctiveWave || "",
        };
        pivots.push(point);

        if (isUptrend) {
          waveCount++;
          if (waveCount > 5) {
            isUptrend = false;
            correctiveWave = "A";
          }
        } else {
          if (correctiveWave === "A") correctiveWave = "B";
          else if (correctiveWave === "B") correctiveWave = "C";
          else if (correctiveWave === "C") {
            isUptrend = true;
            waveCount = 1;
            correctiveWave = null;
          }
        }
      }

      if (this.isPivotLow(i)) {
        const point: WavePoint = {
          index: i,
          time: this.data[i].time,
          price: this.data[i].low,
          label: isUptrend ? waveCount.toString() : correctiveWave || "",
          type: isUptrend ? "impulse" : "corrective",
          waveNumber: isUptrend ? waveCount : correctiveWave || "",
        };
        pivots.push(point);

        if (isUptrend) {
          waveCount++;
          if (waveCount > 5) {
            isUptrend = false;
            correctiveWave = "A";
          }
        } else {
          if (correctiveWave === "A") correctiveWave = "B";
          else if (correctiveWave === "B") correctiveWave = "C";
          else if (correctiveWave === "C") {
            isUptrend = true;
            waveCount = 1;
            correctiveWave = null;
          }
        }
      }
    }

    return pivots;
  }

  calculate(): void {
    const waves = this.findWavePoints();
    this.result = {
      waves,
      currentCycle: waves.length > 0 ? waves[waves.length - 1].type : "impulse",
    };
  }

  generateTraces(): Trace[] {
    if (!this.result) {
      this.calculate();
    }

    const traces: Trace[] = [];
    const { waves } = this.result!;

    // Connect wave points with lines
    if (waves.length > 1) {
      const impulseX: string[] = [];
      const impulseY: number[] = [];
      const correctiveX: string[] = [];
      const correctiveY: number[] = [];

      waves.forEach((wave, i) => {
        if (wave.type === "impulse") {
          impulseX.push(wave.time);
          impulseY.push(wave.price);
        } else {
          correctiveX.push(wave.time);
          correctiveY.push(wave.price);
        }
      });

      // Impulse wave lines
      if (impulseX.length > 0) {
        traces.push({
          x: impulseX,
          y: impulseY,
          type: "scatter",
          mode: "lines",
          name: "Impulse Waves",
          line: {
            color: this.impulseColor,
            width: 2,
          },
        });
      }

      // Corrective wave lines
      if (correctiveX.length > 0) {
        traces.push({
          x: correctiveX,
          y: correctiveY,
          type: "scatter",
          mode: "lines",
          name: "Corrective Waves",
          line: {
            color: this.correctiveColor,
            width: 2,
          },
        });
      }
    }

    // Add labels if enabled
    if (this.showLabels) {
      waves.forEach((wave) => {
        traces.push({
          name: "Wave Label",
          x: [wave.time],
          y: [wave.price],
          type: "scatter",
          mode: "text",
          text: [wave.label],
          textposition: "top center",
          textfont: {
            size: this.labelSize,
            color:
              wave.type === "impulse"
                ? this.impulseColor
                : this.correctiveColor,
          },
          hoverinfo: "none",
          showlegend: false,
        });
      });
    }

    return traces;
  }
}
