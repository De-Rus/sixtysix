"use client";

import { StrictMode, useMemo } from "react";
import { ChartProvider } from "@/context/ChartContext";
import { SymbolProvider } from "@/providers/symbol";
import { Home } from "@/pages/Home";
import { generateData } from "@/utils/mock";
import { useSymbol } from "@/hooks/use-symbol";
import { ThemeProvider } from "@/components/theme-provider";

const App = () => {
  const { currentSymbol } = useSymbol();
  const data = useMemo(() => {
    if (currentSymbol) {
      return generateData(200, "1h", currentSymbol);
    }
    return [];
  }, [currentSymbol]);

  return data.length > 0 ? <Home data={data} /> : <div>Loading...</div>;
};

export default function Page() {
  return (
    <StrictMode>
      <ThemeProvider>
        <SymbolProvider>
          <ChartProvider>
            <App />
          </ChartProvider>
        </SymbolProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
