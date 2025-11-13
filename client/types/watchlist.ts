type WatchlistItem = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  instrumentType: InstrumentType;
  searchId: string;
  tradingSymbol: string | null;
};
