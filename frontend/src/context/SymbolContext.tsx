"use client";

import { createContext } from "react";

interface SymbolContextType {
  currentSymbol: string;
  setCurrentSymbol: (symbol: string) => void;
}

export const SymbolContext = createContext<SymbolContextType | undefined>(
  undefined
);
