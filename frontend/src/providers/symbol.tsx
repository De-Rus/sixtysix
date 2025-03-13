import { SymbolContext } from "@/context/SymbolContext";
import { useState } from "react";

export function SymbolProvider({ children }: { children: React.ReactNode }) {
  const [currentSymbol, setCurrentSymbol] = useState("AAPL");

  return (
    <SymbolContext.Provider value={{ currentSymbol, setCurrentSymbol }}>
      {children}
    </SymbolContext.Provider>
  );
}
