type WatchlistItem = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  instrumentType: InstrumentType;
  searchId: string;
  tradingSymbol: string | null;
};

type PositionInstrument = {
  id: string;
  tradingSymbol: string;
  name: string | null;
  exchange: string;
  type: string;
  segment: string;
  searchId: string | null;
};
