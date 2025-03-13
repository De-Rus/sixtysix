import { X } from "lucide-react";

// Define indicator details for the custom legend
const INDICATOR_DETAILS = {
  sma: {
    name: "SMA",
    color: "rgb(249, 115, 22)",
    getLabel: (config: Record<string, any>) => `SMA (${config?.period || 14})`,
  },
  ema: {
    name: "EMA",
    color: "rgb(16, 185, 129)",
    getLabel: (config: Record<string, any>) => `EMA (${config?.period || 9})`,
  },
  ichimoku: {
    name: "Ichimoku",
    color: "rgb(59, 130, 246)",
    getLabel: (config: Record<string, any>) => {
      const conversionPeriod = config?.conversionPeriod || 9;
      const basePeriod = config?.basePeriod || 26;
      const spanPeriod = config?.spanPeriod || 52;
      const displacement = config?.displacement || 26;
      return `Ichimoku (${conversionPeriod},${basePeriod},${spanPeriod},${displacement})`;
    },
  },
  rsi: {
    name: "RSI",
    color: "rgb(139, 92, 246)",
    getLabel: (config: Record<string, any>) => `RSI (${config?.period || 14})`,
  },
  macd: {
    name: "MACD",
    color: "rgb(236, 72, 153)",
    getLabel: (config: Record<string, any>) => {
      const fast = config?.fastPeriod || 12;
      const slow = config?.slowPeriod || 26;
      const signal = config?.signalPeriod || 9;
      return `MACD (${fast},${slow},${signal})`;
    },
  },
  bollinger: {
    name: "Bollinger",
    color: "rgb(251, 146, 60)",
    getLabel: (config: Record<string, any>) => {
      const period = config?.period || 20;
      const stdDev = config?.stdDev || 2;
      return `Bollinger (${period},${stdDev})`;
    },
  },
};

interface LegendProps {
  selectedIndicators: string[];
  indicatorConfigs: Record<string, any>;
  onConfigureIndicator: (indicator: string) => void;
  onRemoveIndicator: (indicator: string) => void;
}

export function Legend({
  selectedIndicators,
  indicatorConfigs,
  onConfigureIndicator,
  onRemoveIndicator,
}: LegendProps) {
  if (selectedIndicators.length === 0) return null;

  return (
    <div className="absolute left-4 top-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md rounded-md p-2 border border-gray-200 dark:border-gray-700">
      <div className="text-sm font-medium mb-1 px-1">Indicators</div>
      <ul className="space-y-1">
        {selectedIndicators.map((indicator) => {
          const details = INDICATOR_DETAILS[
            indicator as keyof typeof INDICATOR_DETAILS
          ] || {
            name: indicator.charAt(0).toUpperCase() + indicator.slice(1),
            color: "rgb(107, 114, 128)",
            getLabel: () =>
              indicator.charAt(0).toUpperCase() + indicator.slice(1),
          };

          // Get the configuration for this indicator
          const config = indicatorConfigs[indicator] || {};

          // Generate the label with configuration details
          const label = details.getLabel(config);

          return (
            <li
              key={indicator}
              className="flex items-center justify-between gap-2 px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
            >
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => onConfigureIndicator(indicator)}
              >
                <span>{label}</span>
              </div>
              <button
                onClick={() => onRemoveIndicator(indicator)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={`Remove ${details.name} indicator`}
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
