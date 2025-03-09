// Mock stock data for the trading application
export interface MockStock {
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  volume: number
}

export const mockStocks: MockStock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 175.43,
    change: 1.25,
    volume: 78945612,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    price: 338.11,
    change: 2.34,
    volume: 25631478,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology",
    price: 131.86,
    change: -0.45,
    volume: 19874563,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical",
    price: 127.74,
    change: 0.87,
    volume: 32145698,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automotive",
    price: 243.84,
    change: -3.21,
    volume: 45612378,
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    sector: "Technology",
    price: 312.95,
    change: 4.32,
    volume: 15478963,
  },
  {
    symbol: "NFLX",
    name: "Netflix, Inc.",
    sector: "Entertainment",
    price: 398.75,
    change: 2.15,
    volume: 8745632,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financial Services",
    price: 145.31,
    change: 0.54,
    volume: 12365478,
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    sector: "Financial Services",
    price: 235.45,
    change: 1.12,
    volume: 7896541,
  },
  {
    symbol: "WMT",
    name: "Walmart Inc.",
    sector: "Consumer Defensive",
    price: 156.71,
    change: -0.32,
    volume: 9874563,
  },
]

// Function to get mock stock data by symbol
export function getMockStockBySymbol(symbol: string): MockStock | undefined {
  return mockStocks.find((stock) => stock.symbol === symbol)
}

// Function to search mock stocks by name or symbol
export function searchMockStocks(query: string): MockStock[] {
  const lowerCaseQuery = query.toLowerCase()
  return mockStocks.filter(
    (stock) => stock.symbol.toLowerCase().includes(lowerCaseQuery) || stock.name.toLowerCase().includes(lowerCaseQuery),
  )
}

