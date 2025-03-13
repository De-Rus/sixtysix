import { SymbolContext } from "@/context/SymbolContext";
import { useContext } from "react";

export const useSymbol = () => {
  const context = useContext(SymbolContext);
  if (context === undefined) {
    throw new Error("useSymbol must be used within a SymbolProvider");
  }
  return context;
};
