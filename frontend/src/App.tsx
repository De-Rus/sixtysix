import { Home } from "./pages/Home";
import { SymbolProvider } from "./providers/symbol";
import { useSymbol } from "./hooks/use-symbol";
import { generateData } from "./utils/mock/mock-data-generator";

export const AppContent = () => {
  const { currentSymbol } = useSymbol();
  const data = generateData(200, "1h", currentSymbol);

  return <Home data={data} />;
};

export default function App() {
  return (
    <SymbolProvider>
      <AppContent />
    </SymbolProvider>
  );
}
