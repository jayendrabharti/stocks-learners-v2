"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getStockInitials, getStockLogoUrl } from "@/utils/stockUtils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Calendar,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
} from "recharts";

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

type LiveData = {
  average_price: number;
  bid_quantity: number;
  bid_price: number;
  day_change: number;
  day_change_perc: number;
  upper_circuit_limit: number;
  lower_circuit_limit: number;
  ohlc:
    | string
    | {
        open: number;
        high: number;
        low: number;
        close: number;
      };
  depth: {
    buy: { price: number; quantity: number }[];
    sell: { price: number; quantity: number }[];
  };
  high_trade_range: number;
  implied_volatility: number;
  last_trade_quantity: number;
  last_trade_time: number;
  low_trade_range: number;
  last_price: number;
  market_cap: number;
  offer_price: number;
  offer_quantity: number;
  oi_day_change: number;
  oi_day_change_percentage: number;
  open_interest: number;
  previous_open_interest: number;
  total_buy_quantity: number;
  total_sell_quantity: number;
  volume: number;
  week_52_high: number;
  week_52_low: number;
};

type ChartDataPoint = {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const chartConfig = {
  close: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
  volume: {
    label: "Volume",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;
type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type UnknownRecord = Record<string, unknown>;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) {
      return true;
    }
    if (["false", "no", "n", "0"].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return fallback;
};

const parseTimestampMs = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    return null;
  }
  return null;
};

const mapDepthOrders = (
  orders: unknown[]
): { price: number; quantity: number }[] => {
  return orders
    .map((order) => {
      if (Array.isArray(order)) {
        const [price, quantity] = order;
        return {
          price: asNumber(price),
          quantity: asNumber(quantity),
        };
      }

      if (typeof order === "object" && order !== null) {
        const record = order as UnknownRecord;
        const embedded =
          typeof record.value === "object" && record.value !== null
            ? (record.value as UnknownRecord)
            : undefined;

        const priceCandidate =
          record.price ??
          record.p ??
          record.rate ??
          record["price"] ??
          record["p"] ??
          record["0"] ??
          embedded?.price ??
          embedded?.p;

        const quantityCandidate =
          record.quantity ??
          record.qty ??
          record.q ??
          record.size ??
          record["quantity"] ??
          record["qty"] ??
          record["q"] ??
          record["1"] ??
          embedded?.quantity ??
          embedded?.qty;

        return {
          price: asNumber(priceCandidate),
          quantity: asNumber(quantityCandidate),
        };
      }

      return { price: 0, quantity: 0 };
    })
    .filter((entry) => entry.price !== 0 || entry.quantity !== 0);
};

const normalizeOHLC = (
  value: unknown
): { open: number; high: number; low: number; close: number } => {
  if (typeof value === "string") {
    try {
      const cleaned = value
        .replace(/[{}]/g, "")
        .split(",")
        .map((segment) => segment.split(":"));

      return cleaned.reduce(
        (acc, [key, raw]) => {
          const normalizedKey = key.trim().toLowerCase();
          if (normalizedKey in acc) {
            acc[normalizedKey as keyof typeof acc] = asNumber(raw);
          }
          return acc;
        },
        { open: 0, high: 0, low: 0, close: 0 }
      );
    } catch (error) {
      console.error("Failed to parse OHLC string", error);
      return { open: 0, high: 0, low: 0, close: 0 };
    }
  }

  if (typeof value === "object" && value !== null) {
    const record = value as UnknownRecord;
    return {
      open: asNumber(record.open),
      high: asNumber(record.high),
      low: asNumber(record.low),
      close: asNumber(record.close),
    };
  }

  return { open: 0, high: 0, low: 0, close: 0 };
};

const buildChartPoints = (
  candles: unknown[],
  range: TimeRange
): ChartDataPoint[] => {
  return candles
    .map((entry) => {
      if (!Array.isArray(entry) || entry.length < 6) {
        return null;
      }

      const timestampMs = parseTimestampMs(entry[0]);
      if (timestampMs === null) {
        return null;
      }

      const date = new Date(timestampMs);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      const label =
        range === "1D"
          ? date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : date.toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            });

      return {
        timestamp: Math.floor(timestampMs / 1000),
        date: label,
        open: asNumber(entry[1]),
        high: asNumber(entry[2]),
        low: asNumber(entry[3]),
        close: asNumber(entry[4]),
        volume: Math.max(0, Math.round(asNumber(entry[5]))),
      } satisfies ChartDataPoint;
    })
    .filter((point): point is ChartDataPoint => point !== null);
};

const extractCandlesArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as UnknownRecord;
    if ("candles" in record) {
      return extractCandlesArray(record.candles);
    }
    if ("payload" in record) {
      return extractCandlesArray(record.payload);
    }
    if ("data" in record) {
      return extractCandlesArray(record.data);
    }
  }

  return [];
};

const intervalForRange: Record<TimeRange, string> = {
  "1D": "1d",
  "1W": "1w",
  "1M": "1m",
  "3M": "3m",
  "6M": "6m",
  "1Y": "1y",
  "2Y": "2y",
  "3Y": "3y",
};

const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;

  const isPositive = close >= open;
  const color = isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

  const bodyHeight =
    Math.abs(close - open) *
    (height / (payload.dataMax - payload.dataMin || 1));
  const bodyY =
    y +
    (isPositive ? payload.dataMax - close : payload.dataMax - open) *
      (height / (payload.dataMax - payload.dataMin || 1));

  const wickTop =
    y +
    (payload.dataMax - high) *
      (height / (payload.dataMax - payload.dataMin || 1));
  const wickBottom =
    y +
    (payload.dataMax - low) *
      (height / (payload.dataMax - payload.dataMin || 1));

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={wickTop}
        x2={x + width / 2}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x + 1}
        y={bodyY}
        width={Math.max(width - 2, 1)}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const selectInstrumentForExchange = (
  options: Instrument[],
  exchange: "NSE" | "BSE"
): Instrument | null => {
  const targetExchange = exchange.toUpperCase();
  const directMatch = options.find(
    (item) => item.exchange.toUpperCase() === targetExchange
  );
  if (directMatch) {
    return directMatch;
  }
  return options[0] ?? null;
};

const normaliseInstrumentRow = (
  row: UnknownRecord,
  fallback: Instrument
): Instrument => {
  const exchangeValue =
    typeof row.exchange === "string"
      ? row.exchange.toUpperCase() === "BSE"
        ? "BSE"
        : "NSE"
      : fallback.exchange;

  return {
    ...fallback,
    groww_symbol: String(
      row.groww_symbol ?? row.trading_symbol ?? fallback.groww_symbol
    ).toUpperCase(),
    name:
      typeof row.name === "string" && row.name.trim().length > 0
        ? row.name
        : fallback.name,
    instrument_type:
      typeof row.instrument_type === "string" && row.instrument_type
        ? row.instrument_type
        : fallback.instrument_type,
    segment:
      typeof row.segment === "string" && row.segment
        ? row.segment
        : fallback.segment,
    series:
      typeof row.series === "string" && row.series
        ? row.series
        : fallback.series,
    underlying_exchange_token: String(
      row.underlying_exchange_token ?? fallback.underlying_exchange_token
    ),
    expiry_date:
      typeof row.expiry_date === "string" && row.expiry_date
        ? row.expiry_date
        : fallback.expiry_date,
    strike_price: asNumber(row.strike_price, fallback.strike_price),
    lot_size: Math.max(
      1,
      Math.round(asNumber(row.lot_size, fallback.lot_size))
    ),
    tick_size: asNumber(row.tick_size, fallback.tick_size),
    freeze_quantity: Math.max(
      0,
      Math.round(asNumber(row.freeze_quantity, fallback.freeze_quantity))
    ),
    is_reserved: asBoolean(row.is_reserved, fallback.is_reserved),
    buy_allowed: asBoolean(row.buy_allowed, fallback.buy_allowed),
    sell_allowed: asBoolean(row.sell_allowed, fallback.sell_allowed),
  };
};

const normaliseLiveData = (
  payload: UnknownRecord,
  fallback: LiveData
): LiveData => {
  const depthCandidateRaw =
    payload.depth ?? payload.marketDepth ?? payload.market_depth;
  const depthCandidate =
    typeof depthCandidateRaw === "object" && depthCandidateRaw !== null
      ? (depthCandidateRaw as UnknownRecord)
      : undefined;

  const buySource =
    (Array.isArray(depthCandidate?.buy) && depthCandidate?.buy) ||
    (Array.isArray(depthCandidate?.bids) && depthCandidate?.bids) ||
    (Array.isArray(payload.bids) && payload.bids) ||
    (Array.isArray(payload.bestBids) && payload.bestBids) ||
    [];

  const sellSource =
    (Array.isArray(depthCandidate?.sell) && depthCandidate?.sell) ||
    (Array.isArray(depthCandidate?.asks) && depthCandidate?.asks) ||
    (Array.isArray(payload.asks) && payload.asks) ||
    (Array.isArray(payload.bestAsks) && payload.bestAsks) ||
    [];

  const buyOrders = mapDepthOrders(buySource as unknown[]);
  const sellOrders = mapDepthOrders(sellSource as unknown[]);

  const ohlc = normalizeOHLC(
    payload.ohlc ?? payload.ohlcData ?? payload.ohlc_value ?? fallback.ohlc
  );

  return {
    ...fallback,
    average_price: asNumber(
      payload.avgPrice ?? payload.average_price ?? payload.averagePrice,
      fallback.average_price
    ),
    bid_quantity: asNumber(
      payload.bidQty ??
        payload.bid_quantity ??
        payload.bestBidQty ??
        buyOrders[0]?.quantity,
      fallback.bid_quantity
    ),
    bid_price: asNumber(
      payload.bidPrice ??
        payload.bestBid ??
        payload.bestBidPrice ??
        buyOrders[0]?.price,
      fallback.bid_price
    ),
    day_change: asNumber(
      payload.dayChange ?? payload.change ?? payload.day_change,
      fallback.day_change
    ),
    day_change_perc: asNumber(
      payload.dayChangePerc ??
        payload.dayChangePercent ??
        payload.changePercent ??
        payload.changePerc ??
        payload.day_change_perc,
      fallback.day_change_perc
    ),
    upper_circuit_limit: asNumber(
      payload.upperCircuitLimit ??
        payload.upperCircuit ??
        payload.circuitUpperLimit,
      fallback.upper_circuit_limit
    ),
    lower_circuit_limit: asNumber(
      payload.lowerCircuitLimit ??
        payload.lowerCircuit ??
        payload.circuitLowerLimit,
      fallback.lower_circuit_limit
    ),
    ohlc,
    depth: {
      buy: buyOrders.length > 0 ? buyOrders : fallback.depth.buy,
      sell: sellOrders.length > 0 ? sellOrders : fallback.depth.sell,
    },
    high_trade_range: asNumber(
      payload.highTradeRange ?? payload.highPrice ?? fallback.high_trade_range,
      fallback.high_trade_range
    ),
    implied_volatility: asNumber(
      payload.iv ?? payload.impliedVolatility ?? payload.implied_volatility,
      fallback.implied_volatility
    ),
    last_trade_quantity: asNumber(
      payload.ltq ??
        payload.lastTradeQuantity ??
        payload.lastTradedQuantity ??
        payload.last_trade_quantity,
      fallback.last_trade_quantity
    ),
    last_trade_time: asNumber(
      payload.lastTradeTime ??
        payload.lastTradeTimestamp ??
        payload.last_trade_time,
      fallback.last_trade_time
    ),
    low_trade_range: asNumber(
      payload.lowTradeRange ?? payload.lowPrice ?? fallback.low_trade_range,
      fallback.low_trade_range
    ),
    last_price: asNumber(
      payload.ltp ?? payload.lastPrice ?? payload.last_traded_price,
      fallback.last_price
    ),
    market_cap: asNumber(
      payload.marketCap ?? payload.market_cap,
      fallback.market_cap
    ),
    offer_price: asNumber(
      payload.askPrice ??
        payload.bestAsk ??
        payload.bestAskPrice ??
        sellOrders[0]?.price,
      fallback.offer_price
    ),
    offer_quantity: asNumber(
      payload.askQty ??
        payload.ask_quantity ??
        payload.bestAskQty ??
        sellOrders[0]?.quantity,
      fallback.offer_quantity
    ),
    oi_day_change: asNumber(
      payload.oiDayChange ?? payload.oi_change ?? payload.openInterestChange,
      fallback.oi_day_change
    ),
    oi_day_change_percentage: asNumber(
      payload.oiDayChangePerc ??
        payload.oiDayChangePercent ??
        payload.openInterestChangePercent,
      fallback.oi_day_change_percentage
    ),
    open_interest: asNumber(
      payload.openInterest ?? payload.oi ?? payload.open_interest,
      fallback.open_interest
    ),
    previous_open_interest: asNumber(
      payload.previousOpenInterest ??
        payload.prevOpenInterest ??
        payload.prev_oi,
      fallback.previous_open_interest
    ),
    total_buy_quantity: asNumber(
      payload.totalBuyQty ?? payload.total_buy_quantity,
      fallback.total_buy_quantity
    ),
    total_sell_quantity: asNumber(
      payload.totalSellQty ?? payload.total_sell_quantity,
      fallback.total_sell_quantity
    ),
    volume: Math.max(
      0,
      Math.round(
        asNumber(
          payload.volume ??
            payload.totalTradedVolume ??
            payload.tradedVolume ??
            fallback.volume,
          fallback.volume
        )
      )
    ),
    week_52_high: asNumber(
      payload.week52High ??
        payload.week_high ??
        payload.fiftyTwoWeekHigh ??
        payload.week_52_high,
      fallback.week_52_high
    ),
    week_52_low: asNumber(
      payload.week52Low ??
        payload.week_low ??
        payload.fiftyTwoWeekLow ??
        payload.week_52_low,
      fallback.week_52_low
    ),
  };
};

export default function StockPage() {
  const params = useParams();
  const tradingSymbolParam = params?.trading_symbol;
  const searchParams = useSearchParams();

  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [instrumentOptions, setInstrumentOptions] = useState<Instrument[]>([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [loading, setLoading] = useState<boolean>(true);
  const [liveDataLoading, setLiveDataLoading] = useState<boolean>(false);
  const [historicalDataLoading, setHistoricalDataLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [historicalDataError, setHistoricalDataError] = useState<string | null>(
    null
  );

  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"DELIVERY" | "INTRADAY" | "MTF">(
    "DELIVERY"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [priceType, setPriceType] = useState<"LIMIT" | "MARKET">("LIMIT");

  const tradingSymbol =
    typeof tradingSymbolParam === "string" ? tradingSymbolParam : undefined;

  const effectiveTradingSymbol =
    instrument?.trading_symbol ?? tradingSymbol ?? "";

  useEffect(() => {
    const exchangeParam = searchParams.get("exchange");
    if (exchangeParam === "NSE" || exchangeParam === "BSE") {
      setExchange(exchangeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!tradingSymbol) {
      setInstrument(null);
      setInstrumentOptions([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = new URL(`${API_BASE_URL}/instruments`);
        url.searchParams.set("tradingSymbol", tradingSymbol);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Instrument request failed with status ${response.status}`
          );
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.instruments)
          ? (payload.instruments as UnknownRecord[])
          : [];

        if (rows.length === 0) {
          setInstrument(null);
          setInstrumentOptions([]);
          setError("Instrument not found.");
          return;
        }

        const normalized = rows.map((row) => {
          const rawExchange =
            typeof row.exchange === "string" &&
            row.exchange.toUpperCase() === "BSE"
              ? "BSE"
              : "NSE";
          return normaliseInstrumentRow(row, {
            id: undefined,
            exchange: rawExchange,
            exchange_token: "",
            trading_symbol: tradingSymbol,
            groww_symbol: tradingSymbol,
            name: "",
            instrument_type: "",
            segment: "",
            series: "",
            isin: "",
            underlying_symbol: "",
            underlying_exchange_token: "",
            expiry_date: "",
            strike_price: 0,
            lot_size: 1,
            tick_size: 0.05,
            freeze_quantity: 0,
            is_reserved: false,
            buy_allowed: true,
            sell_allowed: true,
          });
        });

        setInstrumentOptions(normalized);
        const initialInstrument = selectInstrumentForExchange(
          normalized,
          exchange
        );

        setInstrument(initialInstrument ?? normalized[0] ?? null);
        setError(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch instrument data:", error);
        setError("Failed to load instrument data. Please try again.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [tradingSymbol]);

  useEffect(() => {
    if (!tradingSymbol) {
      return;
    }

    if (instrumentOptions.length === 0) {
      return;
    }

    const nextInstrument =
      selectInstrumentForExchange(instrumentOptions, exchange) ??
      instrumentOptions[0];

    if (!nextInstrument) {
      return;
    }

    setInstrument((current) => {
      if (
        current &&
        current.trading_symbol === nextInstrument.trading_symbol &&
        current.exchange === nextInstrument.exchange
      ) {
        return current;
      }
      return nextInstrument;
    });
  }, [exchange, instrumentOptions, tradingSymbol]);

  const fetchLiveData = useCallback(
    (symbol: string, selectedExchange: "NSE" | "BSE") => {
      const controller = new AbortController();
      setLiveDataLoading(true);
      setLiveDataError(null);

      (async () => {
        try {
          const url = new URL(`${API_BASE_URL}/instruments/live-data`);
          url.searchParams.set("exchange", selectedExchange);
          url.searchParams.set("segment", "CASH");
          url.searchParams.set("tradingSymbol", symbol);

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            cache: "no-store",
          });

          if (!response.ok) {
            const fallbackMessage = "Live data is unavailable right now.";
            let serverMessage: string | null = null;

            try {
              const errorPayload = await response.json();
              if (
                errorPayload &&
                typeof errorPayload === "object" &&
                errorPayload !== null
              ) {
                const candidate =
                  (errorPayload.error as string | undefined) ??
                  (errorPayload.message as string | undefined);
                if (candidate && candidate.trim().length > 0) {
                  serverMessage = candidate.trim();
                }
              }
            } catch (jsonError) {
              try {
                const rawText = await response.text();
                if (rawText && rawText.trim().length > 0) {
                  serverMessage = rawText.trim();
                }
              } catch (textError) {
                // ignore parsing issues and rely on fallback message
              }
            }

            const composedMessage =
              serverMessage ?? `${fallbackMessage} (HTTP ${response.status})`;
            setLiveDataError(composedMessage);
            return;
          }

          const payload = await response.json();
          const quoteCandidate =
            (payload?.data as UnknownRecord | undefined) ??
            (payload?.quoteData as UnknownRecord | undefined) ??
            (payload as UnknownRecord);

          const rawPayload =
            quoteCandidate &&
            typeof quoteCandidate === "object" &&
            quoteCandidate !== null &&
            "payload" in quoteCandidate
              ? (quoteCandidate.payload as UnknownRecord)
              : quoteCandidate;

          if (!rawPayload || Object.keys(rawPayload).length === 0) {
            setLiveDataError("Received an empty live data response.");
            return;
          }

          const normalized = normaliseLiveData(rawPayload, {
            average_price: 0,
            bid_quantity: 0,
            bid_price: 0,
            day_change: 0,
            day_change_perc: 0,
            upper_circuit_limit: 0,
            lower_circuit_limit: 0,
            ohlc: { open: 0, high: 0, low: 0, close: 0 },
            depth: { buy: [], sell: [] },
            high_trade_range: 0,
            implied_volatility: 0,
            last_trade_quantity: 0,
            last_trade_time: 0,
            low_trade_range: 0,
            last_price: 0,
            market_cap: 0,
            offer_price: 0,
            offer_quantity: 0,
            oi_day_change: 0,
            oi_day_change_percentage: 0,
            open_interest: 0,
            previous_open_interest: 0,
            total_buy_quantity: 0,
            total_sell_quantity: 0,
            volume: 0,
            week_52_high: 0,
            week_52_low: 0,
          });

          setLiveData(normalized);
          setLastUpdated(new Date());
          setLiveDataError(null);
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
          console.error("Failed to fetch live data:", error);
          setLiveDataError(
            (previous) =>
              previous ?? "Unable to refresh live data. Please try again."
          );
        } finally {
          setLiveDataLoading(false);
        }
      })();

      return () => controller.abort();
    },
    []
  );

  const fetchHistoricalData = useCallback(
    (symbol: string, selectedExchange: "NSE" | "BSE", range: TimeRange) => {
      const controller = new AbortController();
      setHistoricalDataLoading(true);
      setHistoricalDataError(null);

      (async () => {
        try {
          const interval = intervalForRange[range] ?? "1m";
          const url = new URL(`${API_BASE_URL}/instruments/historical-data`);
          url.searchParams.set("exchange", selectedExchange);
          url.searchParams.set("segment", "CASH");
          url.searchParams.set("tradingSymbol", symbol);
          url.searchParams.set("interval", interval);

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            cache: "no-store",
          });

          if (!response.ok) {
            const fallbackMessage = "Historical data is unavailable right now.";
            let serverMessage: string | null = null;

            try {
              const errorPayload = await response.json();
              if (
                errorPayload &&
                typeof errorPayload === "object" &&
                errorPayload !== null
              ) {
                const candidate =
                  (errorPayload.error as string | undefined) ??
                  (errorPayload.message as string | undefined);
                if (candidate && candidate.trim().length > 0) {
                  serverMessage = candidate.trim();
                }
              }
            } catch (jsonError) {
              try {
                const rawText = await response.text();
                if (rawText && rawText.trim().length > 0) {
                  serverMessage = rawText.trim();
                }
              } catch (textError) {
                // ignore parsing issues and rely on fallback message
              }
            }

            const composedMessage =
              serverMessage ?? `${fallbackMessage} (HTTP ${response.status})`;
            setHistoricalDataError(composedMessage);
            setChartData([]);
            return;
          }

          const payload = await response.json();
          const dataCandidate =
            (payload?.data as UnknownRecord | undefined) ??
            (payload as UnknownRecord);

          const candles = extractCandlesArray(dataCandidate);
          const points = buildChartPoints(candles, range);

          setChartData(points);
          setHistoricalDataError(null);
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
          console.error("Failed to fetch historical data:", error);
          setChartData([]);
          setHistoricalDataError(
            (previous) =>
              previous ?? "Unable to load the price chart. Please try again."
          );
        } finally {
          setHistoricalDataLoading(false);
        }
      })();

      return () => controller.abort();
    },
    []
  );

  useEffect(() => {
    if (!effectiveTradingSymbol) {
      return;
    }

    return fetchLiveData(effectiveTradingSymbol, exchange);
  }, [effectiveTradingSymbol, exchange, fetchLiveData]);

  useEffect(() => {
    if (!effectiveTradingSymbol) {
      return;
    }

    return fetchHistoricalData(effectiveTradingSymbol, exchange, timeRange);
  }, [timeRange, effectiveTradingSymbol, exchange, fetchHistoricalData]);

  useEffect(() => {
    if (liveData?.last_price && priceType === "LIMIT") {
      setPrice(liveData.last_price);
    }
  }, [liveData?.last_price, priceType]);

  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null || Number.isNaN(num)) {
      return "-";
    }
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (num: number | undefined) => {
    if (num === undefined || num === null || Number.isNaN(num)) {
      return "-";
    }
    return `₹${formatNumber(num)}`;
  };

  const parseOHLC = (
    ohlc: string | { open: number; high: number; low: number; close: number }
  ) => {
    if (typeof ohlc === "string") {
      try {
        const cleaned = ohlc
          .replace(/[{}]/g, "")
          .split(",")
          .map((item) => item.split(":"));

        return cleaned.reduce(
          (acc, [key, value]) => {
            acc[key.trim() as keyof typeof acc] = Number.parseFloat(
              value.trim()
            );
            return acc;
          },
          { open: 0, high: 0, low: 0, close: 0 }
        );
      } catch (parsingError) {
        console.error("Failed to parse OHLC placeholder", parsingError);
        return { open: 0, high: 0, low: 0, close: 0 };
      }
    }

    return ohlc;
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2 text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                      <Skeleton className="mx-auto h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-8 w-10" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 w-full px-6 pb-6">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-48 w-full px-6 pb-6">
                    <Skeleton className="h-full w-full" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="w-80 space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-8 text-center">{error}</div>;
  }

  return (
    <div className="relative">
      <div className="w-full space-y-6 p-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {instrument && (
                  <img
                    src={getStockLogoUrl(instrument.trading_symbol)}
                    alt={`${instrument.name} logo`}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback =
                        target.nextElementSibling as HTMLDivElement | null;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                )}
                {instrument && (
                  <div
                    className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                    style={{ display: "none" }}
                  >
                    {getStockInitials(instrument.name)}
                  </div>
                )}
                <div>
                  <h1 className="text-primary text-3xl font-bold">
                    {instrument?.name ?? tradingSymbol ?? "Stock"}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {instrument?.trading_symbol ?? tradingSymbol ?? "-"} •{" "}
                    {exchange} • {instrument?.segment ?? "Segment"}
                  </p>
                </div>
                <div className="mt-1">
                  <Button variant="outline" size="sm" disabled>
                    Watchlist (soon)
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={exchange === "NSE" ? "default" : "outline"}
                  onClick={() => setExchange("NSE")}
                  disabled={liveDataLoading}
                >
                  NSE
                </Button>
                <Button
                  variant={exchange === "BSE" ? "default" : "outline"}
                  onClick={() => setExchange("BSE")}
                  disabled={liveDataLoading}
                >
                  BSE
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (effectiveTradingSymbol) {
                      fetchLiveData(effectiveTradingSymbol, exchange);
                    }
                  }}
                  disabled={liveDataLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      liveDataLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            {liveDataLoading ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="space-y-2 text-center">
                        <Skeleton className="mx-auto h-4 w-20" />
                        <Skeleton className="mx-auto h-8 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              liveData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Live Price ({exchange})</CardTitle>
                      {lastUpdated && (
                        <span className="text-muted-foreground text-sm">
                          Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Last Price
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(liveData.last_price)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Day Change
                        </p>
                        <div
                          className={`flex items-center justify-center gap-1 ${
                            liveData.day_change >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {liveData.day_change >= 0 ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )}
                          <span className="font-semibold">
                            {formatCurrency(Math.abs(liveData.day_change))} (
                            {liveData.day_change >= 0 ? "+" : ""}
                            {liveData.day_change_perc.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">Volume</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(liveData.volume, 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Avg Price
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(liveData.average_price)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm">
                          Market Cap
                        </p>
                        <p className="text-lg font-semibold">
                          {liveData.market_cap
                            ? `₹${(liveData.market_cap / 10000000).toFixed(
                                2
                              )}Cr`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {liveDataError && !liveDataLoading && (
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <p className="text-destructive text-sm font-medium">
                    {liveDataError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => {
                      if (effectiveTradingSymbol) {
                        fetchLiveData(effectiveTradingSymbol, exchange);
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <CardTitle>Price Chart</CardTitle>
                      {historicalDataLoading && (
                        <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
                        <Button
                          variant={chartType === "line" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setChartType("line")}
                          className="h-7 px-3 text-xs"
                        >
                          Line
                        </Button>
                        <Button
                          variant={chartType === "candle" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setChartType("candle")}
                          className="h-7 px-3 text-xs"
                        >
                          Candle
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            "1D",
                            "1W",
                            "1M",
                            "3M",
                            "6M",
                            "1Y",
                            "2Y",
                            "3Y",
                          ] as TimeRange[]
                        ).map((range) => (
                          <Button
                            key={range}
                            variant={timeRange === range ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setTimeRange(range)}
                            disabled={historicalDataLoading}
                            className="h-8 px-3 py-1 text-sm"
                          >
                            {range}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {chartData.length > 0 ? (
                    <div className="h-80 w-full px-6 pb-6">
                      <ChartContainer
                        config={chartConfig}
                        className="h-full w-full"
                      >
                        {chartType === "line" ? (
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 12,
                                fill: "var(--color-muted-foreground)",
                              }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 12,
                                fill: "var(--color-muted-foreground)",
                              }}
                              domain={["dataMin - 10", "dataMax + 10"]}
                              tickFormatter={(value) => `₹${value.toFixed(0)}`}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="close"
                              stroke="hsl(var(--chart-1))"
                              strokeWidth={3}
                              dot={false}
                              activeDot={{
                                r: 4,
                                stroke: "hsl(var(--chart-1))",
                                strokeWidth: 2,
                                fill: "var(--background)",
                              }}
                              connectNulls
                            />
                          </LineChart>
                        ) : (
                          <ComposedChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 12,
                                fill: "var(--color-muted-foreground)",
                              }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 12,
                                fill: "var(--color-muted-foreground)",
                              }}
                              domain={["dataMin - 10", "dataMax + 10"]}
                              tickFormatter={(value) => `₹${value.toFixed(0)}`}
                            />
                            <ChartTooltip
                              content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) {
                                  return null;
                                }
                                const data = payload[0].payload;
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Date
                                        </span>
                                        <span className="font-bold text-muted-foreground">
                                          {data.date}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Open
                                        </span>
                                        <span className="font-bold">
                                          ₹{data.open.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          High
                                        </span>
                                        <span className="font-bold text-green-600">
                                          ₹{data.high.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Low
                                        </span>
                                        <span className="font-bold text-red-600">
                                          ₹{data.low.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Close
                                        </span>
                                        <span className="font-bold">
                                          ₹{data.close.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Volume
                                        </span>
                                        <span className="font-bold">
                                          {data.volume.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar
                              dataKey="close"
                              shape={<CandleShape />}
                              fill="hsl(var(--chart-1))"
                            />
                          </ComposedChart>
                        )}
                      </ChartContainer>
                    </div>
                  ) : historicalDataLoading ? (
                    <div className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <div className="flex justify-between pt-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-80 items-center justify-center">
                      <div className="text-muted-foreground text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p
                          className={`mb-3 text-sm ${
                            historicalDataError ? "text-destructive" : ""
                          }`}
                        >
                          {historicalDataError ?? "No chart data available"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (effectiveTradingSymbol) {
                              fetchHistoricalData(
                                effectiveTradingSymbol,
                                exchange,
                                timeRange
                              );
                            }
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {chartData.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Volume Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-48 w-full px-6 pb-6">
                        <ChartContainer
                          config={{
                            volume: {
                              label: "Volume",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                          className="h-full w-full"
                        >
                          <BarChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--color-border)"
                              opacity={0.3}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: "var(--color-muted-foreground)",
                              }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: "var(--color-muted-foreground)",
                              }}
                              tickFormatter={(value) => {
                                if (value >= 1000000) {
                                  return `${(value / 1000000).toFixed(1)}M`;
                                }
                                if (value >= 1000) {
                                  return `${(value / 1000).toFixed(1)}K`;
                                }
                                return value.toString();
                              }}
                            />
                            <ChartTooltip
                              content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) {
                                  return null;
                                }
                                const data = payload[0].payload;
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {data.date}
                                      </span>
                                      <span className="font-bold text-foreground">
                                        Volume: {data.volume.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar
                              dataKey="volume"
                              fill="hsl(var(--chart-2))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Period Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            High
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ₹
                            {Math.max(
                              ...chartData.map((dataPoint) => dataPoint.high)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Low
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            ₹
                            {Math.min(
                              ...chartData.map((dataPoint) => dataPoint.low)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Avg Volume
                          </span>
                          <span className="font-semibold">
                            {Math.round(
                              chartData.reduce(
                                (sum, dataPoint) => sum + dataPoint.volume,
                                0
                              ) / chartData.length
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Total Volume
                          </span>
                          <span className="font-semibold">
                            {chartData
                              .reduce(
                                (sum, dataPoint) => sum + dataPoint.volume,
                                0
                              )
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-sm">
                            Data Points
                          </span>
                          <span className="font-semibold">
                            {chartData.length}
                          </span>
                        </div>
                        {chartData.length >= 2 && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-sm">
                                Period Start
                              </span>
                              <span className="text-xs font-semibold">
                                {new Date(
                                  chartData[0].timestamp * 1000
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-sm">
                                Period End
                              </span>
                              <span className="text-xs font-semibold">
                                {new Date(
                                  chartData[chartData.length - 1].timestamp *
                                    1000
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="text-muted-foreground text-sm">
                                Period Change
                              </span>
                              <div className="text-right">
                                <div
                                  className={`font-semibold ${
                                    chartData[chartData.length - 1].close >=
                                    chartData[0].open
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {chartData[chartData.length - 1].close >=
                                  chartData[0].open
                                    ? "+"
                                    : ""}
                                  {(
                                    ((chartData[chartData.length - 1].close -
                                      chartData[0].open) /
                                      chartData[0].open) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {chartData[chartData.length - 1].close >=
                                  chartData[0].open
                                    ? "+"
                                    : ""}
                                  ₹
                                  {(
                                    chartData[chartData.length - 1].close -
                                    chartData[0].open
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {liveData && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Today's Range</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const ohlcData = parseOHLC(liveData.ohlc);
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Open
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(ohlcData.open)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              High
                            </span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(ohlcData.high)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Low
                            </span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(ohlcData.low)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Close
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(ohlcData.close)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Circuit Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Upper Circuit
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(liveData.upper_circuit_limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Lower Circuit
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(liveData.lower_circuit_limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        52W High
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(liveData.week_52_high)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        52W Low
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(liveData.week_52_low)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bid/Ask</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Bid Price
                      </span>
                      <span className="text-chart-1 font-semibold">
                        {formatCurrency(liveData.bid_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Ask Price
                      </span>
                      <span className="text-destructive font-semibold">
                        {formatCurrency(liveData.offer_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Buy Qty
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.total_buy_quantity, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Sell Qty
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.total_sell_quantity, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Volume
                      </span>
                      <span className="font-semibold">
                        {formatNumber(liveData.volume, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Avg Price
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(liveData.average_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Market Cap
                      </span>
                      <span className="text-sm font-medium">
                        {liveData.market_cap
                          ? `₹${(liveData.market_cap / 10000000).toFixed(2)}Cr`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Last Trade
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(liveData.last_trade_quantity, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {liveData?.depth && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Depth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                        Buy Orders
                      </h4>
                      <div className="space-y-2">
                        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-b pb-2 text-xs">
                          <span>Price</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        {liveData.depth.buy.slice(0, 5).map((order, index) => (
                          <div
                            key={`bid-${index}`}
                            className="grid grid-cols-3 gap-2 text-sm"
                          >
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(order.price)}
                            </span>
                            <span className="text-center">
                              {formatNumber(order.quantity, 0)}
                            </span>
                            <span className="text-right font-medium">
                              {formatCurrency(order.price * order.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                        Sell Orders
                      </h4>
                      <div className="space-y-2">
                        <div className="text-muted-foreground grid grid-cols-3 gap-2 border-b pb-2 text-xs">
                          <span>Price</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        {liveData.depth.sell.slice(0, 5).map((order, index) => (
                          <div
                            key={`ask-${index}`}
                            className="grid grid-cols-3 gap-2 text-sm"
                          >
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(order.price)}
                            </span>
                            <span className="text-center">
                              {formatNumber(order.quantity, 0)}
                            </span>
                            <span className="text-right font-medium">
                              {formatCurrency(order.price * order.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Instrument Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {instrument &&
                    Object.entries(instrument).map(([key, value]) => {
                      if (key === "id" || key === "name") {
                        return null;
                      }

                      const label = key.replace(/_/g, " ");
                      const displayValue =
                        typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value ?? "-");

                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-muted-foreground text-sm capitalize">
                            {label}
                          </p>
                          <p className="text-sm font-medium">{displayValue}</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-80 space-y-4">
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Market Status
                </div>
                <div className="text-sm font-medium">
                  Session overview coming soon
                </div>
                <p className="text-muted-foreground text-xs">
                  Wire this banner to your market status endpoint to show live
                  session updates.
                </p>
              </CardContent>
            </Card>

            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {instrument?.trading_symbol ?? tradingSymbol ?? "Stock"}
                  </span>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {formatCurrency(liveData?.last_price ?? price)}
                    </div>
                    <div
                      className={`text-xs ${
                        (liveData?.day_change ?? 0) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {(liveData?.day_change ?? 0) >= 0 ? "+" : ""}
                      {(liveData?.day_change_perc ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-accent space-y-2 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-medium">
                      {formatCurrency(
                        parseOHLC(
                          liveData?.ohlc ?? "{open:0,high:0,low:0,close:0}"
                        ).open
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">High</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        parseOHLC(
                          liveData?.ohlc ?? "{open:0,high:0,low:0,close:0}"
                        ).high
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Low</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(
                        parseOHLC(
                          liveData?.ohlc ?? "{open:0,high:0,low:0,close:0}"
                        ).low
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium">
                      {formatNumber(liveData?.volume ?? 0, 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={orderSide === "BUY" ? "default" : "outline"}
                      onClick={() => setOrderSide("BUY")}
                    >
                      Buy
                    </Button>
                    <Button
                      className="flex-1"
                      variant={orderSide === "SELL" ? "default" : "outline"}
                      onClick={() => setOrderSide("SELL")}
                    >
                      Sell
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {(["DELIVERY", "INTRADAY", "MTF"] as const).map((type) => (
                      <Button
                        key={type}
                        className="flex-1"
                        variant={orderType === type ? "default" : "outline"}
                        onClick={() => setOrderType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    min={1}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={
                      priceType === "MARKET"
                        ? liveData?.last_price ?? price
                        : price
                    }
                    disabled={priceType === "MARKET"}
                    onChange={(event) =>
                      setPrice(Number(event.target.value) || 0)
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={priceType === "LIMIT" ? "default" : "outline"}
                      onClick={() => setPriceType("LIMIT")}
                    >
                      Limit
                    </Button>
                    <Button
                      className="flex-1"
                      variant={priceType === "MARKET" ? "default" : "outline"}
                      onClick={() => setPriceType("MARKET")}
                    >
                      Market
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-100">
                  Configure this order ticket to fire real buy and sell flows
                  once trading APIs are ready.
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Min Qty:</span>
                    <span>{instrument?.lot_size ?? 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tick Size:</span>
                    <span>₹{instrument?.tick_size ?? 0.05}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Circuit Limits:</span>
                    <span className="text-right">
                      {formatCurrency(liveData?.lower_circuit_limit ?? 0)} -{" "}
                      {formatCurrency(liveData?.upper_circuit_limit ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg" disabled>
                    Buy (hook up later)
                  </Button>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    disabled
                  >
                    Sell (hook up later)
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                    Derivatives Trading
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/futures/${
                        instrument?.trading_symbol ?? tradingSymbol ?? ""
                      }`}
                      aria-disabled
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        Futures
                      </Button>
                    </Link>
                    <Link
                      href={`/options/${
                        instrument?.trading_symbol ?? tradingSymbol ?? ""
                      }`}
                      aria-disabled
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        Options
                      </Button>
                    </Link>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Link these shortcuts to your derivative contracts once
                    endpoints are available.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
