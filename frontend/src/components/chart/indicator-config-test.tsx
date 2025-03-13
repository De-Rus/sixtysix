"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IndicatorConfigDialog } from "./indicator-config-dialog";
import { MACDIndicator } from "@/utils/indicators/impl/macd";

export function IndicatorConfigTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedParams, setSavedParams] = useState<Record<string, any>>({});

  // Create a deep copy of the MACD default parameters
  const macdParams = JSON.parse(JSON.stringify(MACDIndicator.defaultParams));

  const handleSave = (params: Record<string, any>) => {
    console.log("Saved parameters:", params);
    setSavedParams(params);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Indicator Configuration Test</h2>

      <Button onClick={() => setIsOpen(true)}>Open MACD Configuration</Button>

      {Object.keys(savedParams).length > 0 && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Saved Parameters:</h3>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(savedParams, null, 2)}
          </pre>
        </div>
      )}

      <IndicatorConfigDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="MACD"
        parameters={macdParams}
        onSave={handleSave}
      />
    </div>
  );
}
