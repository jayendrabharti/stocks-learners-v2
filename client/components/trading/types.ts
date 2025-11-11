export type InstrumentVariant = "stock" | "index" | "option" | "future";

export type InstrumentSegment = "CASH" | "FNO";

export interface InstrumentPageConfig {
  variant: InstrumentVariant;
  searchId: string;
  tradingSymbol?: string;
}

export interface InstrumentContextValue {
  // Metadata
  metadata: any | null;
  metadataError: string | null;

  // Instruments
  instruments: Instrument[] | null;
  currentInstrument: Instrument | null;
  exchange: Exchange;
  setExchange: (exchange: Exchange) => void;

  // Live Data
  liveData: any | null;
  liveDataError: string | null;

  // Historical Data
  historicalData: any | null;
  historicalDataError: string | null;
  timeRange: HistoricalDataTimeRange;
  setTimeRange: (range: HistoricalDataTimeRange) => void;

  // Computed Values
  type: InstrumentType;
  scriptCode: string;
  currentPrice: number;
  positiveChange: boolean;
  changeValue: number;
  changePerc: number;
  title: string | null;

  // Watchlist
  watchlist: boolean;
  toggleWatchlist: () => void;

  // Utils
  formatTimeStamp: (timestamp: number, format?: "date" | "datetime") => string;
  refetchHistoricalData: () => void;

  // Config
  config: InstrumentPageConfig;
  segment: InstrumentSegment;
  availableTimeRanges: HistoricalDataTimeRange[];
}
