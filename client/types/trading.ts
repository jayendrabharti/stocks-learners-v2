type Instrument = {
  id?: number;
  exchange: string;
  exchange_token: string;
  trading_symbol: string;
  groww_symbol: string;
  name: string;
  instrument_type: string;
  segment: string;
  series: string;
  isin: string;
  underlying_symbol: string;
  underlying_exchange_token: string;
  expiry_date: string;
  strike_price: number;
  lot_size: number;
  tick_size: number;
  freeze_quantity: number;
  is_reserved: boolean;
  buy_allowed: boolean;
  sell_allowed: boolean;
};

type Exchange = "NSE" | "BSE";

type Segment = "CASH" | "FNO";

type HistoricalDataTimeRange =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "3Y"
  | "5Y"
  | "ALL";

type InstrumentType = "EQ" | "IDX" | "FUT" | "CE" | "PE";

type HistoricalData = {
  changeValue: number | null;
  changePercent: number | null;
  closingPrice: number | null;
  candles: [number, number, number, number, number, number][] | null; // [timestamp, open, high, low, close, volume]
};
