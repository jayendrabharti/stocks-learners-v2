"use client";

import { useEffect, useMemo, useState } from "react";
import ApiClient from "@/utils/ApiClient";
import type { InstrumentPageConfig, InstrumentSegment } from "./types";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useSession } from "@/providers/SessionProvider";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export function useInstrumentData(config: InstrumentPageConfig) {
  const { variant, searchId, tradingSymbol } = config;
  const searchParams = useSearchParams();
  const exchangeParam = searchParams.get("exchange");

  const { watchlistItems, addWatchlistItem, removeWatchlistItem } =
    useWatchlist();
  const { isAuthenticated } = useSession();

  const [metadata, setMetadata] = useState<any>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [exchange, setExchange] = useState<Exchange>(
    (exchangeParam as Exchange) || "NSE",
  );
  const [liveData, setLiveData] = useState<any | null>(null);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any | null>(null);
  const [historicalDataError, setHistoricalDataError] = useState<string | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<HistoricalDataTimeRange>("1D");
  const [title, setTitle] = useState<string | null>(null);

  // Determine segment based on variant
  const segment: InstrumentSegment = useMemo(() => {
    return variant === "option" || variant === "future" ? "FNO" : "CASH";
  }, [variant]);

  // Determine available time ranges based on variant
  const availableTimeRanges: HistoricalDataTimeRange[] = useMemo(() => {
    if (variant === "option" || variant === "future") {
      return ["1D", "1W", "1M"];
    }
    return ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "ALL"];
  }, [variant]);

  // Determine instrument type
  const type: InstrumentType = useMemo(() => {
    if (variant === "option" || variant === "future") {
      if (tradingSymbol?.includes("CE")) return "CE";
      if (tradingSymbol?.includes("PE")) return "PE";
      return "FUT";
    }

    if (variant === "index") {
      return metadata?.type === "INDEX" ? "IDX" : "EQ";
    }

    // stock variant
    return metadata?.type === "INDEX" ? "IDX" : "EQ";
  }, [variant, metadata, tradingSymbol]);

  // Get current instrument
  const currentInstrument: Instrument | null = useMemo(() => {
    if (!instruments) return null;
    return instruments.find((inst) => inst.exchange === exchange) || null;
  }, [instruments, exchange]);

  // Get script code
  const scriptCode: string = useMemo(() => {
    if (variant === "option" || variant === "future") {
      return tradingSymbol as string;
    }

    if (!metadata) return "";
    return exchange === "NSE" ? metadata.nseScriptCode : metadata.bseScriptCode;
  }, [variant, tradingSymbol, metadata, exchange]);

  // Calculate price changes
  const { positiveChange, changePerc, changeValue } = useMemo(() => {
    let positiveChange = false;
    let changeValue = 0;
    let changePerc = 0;

    if (!liveData || !historicalData)
      return { positiveChange, changeValue, changePerc };

    if (timeRange === "1D") {
      positiveChange = liveData.dayChange >= 0;
      changeValue = liveData.dayChange ?? 0;
      changePerc = liveData.dayChangePerc ?? 0;
    } else {
      positiveChange = historicalData.changeValue >= 0;
      changeValue = historicalData.changeValue ?? 0;
      changePerc = historicalData.changePerc ?? 0;
    }

    return { positiveChange, changeValue, changePerc };
  }, [historicalData, liveData, timeRange]);

  // Get current price
  const currentPrice: number = useMemo(() => {
    if (!liveData) return 0;
    if (type === "IDX") return liveData.value ?? 0;
    return liveData.ltp ?? 0;
  }, [liveData, type]);

  const watchlistItem = useMemo(() => {
    if (!watchlistItems || !isAuthenticated) return;

    if (segment === "CASH") {
      return watchlistItems.find(
        (item) =>
          item.instrumentType === type &&
          item.searchId === searchId &&
          !item.tradingSymbol,
      );
    } else {
      return watchlistItems.find(
        (item) =>
          item.instrumentType === type &&
          item.searchId === searchId &&
          item.tradingSymbol === tradingSymbol,
      );
    }
  }, [watchlistItems, segment, type, searchId, tradingSymbol]);

  const watchlist = !!watchlistItem;

  // Fetch metadata
  useEffect(() => {
    ApiClient.get(`/metadata?search_id=${searchId}`)
      .then((response) => {
        setMetadata(response.data);
        setMetadataError(null);
      })
      .catch(() => {
        setMetadataError("Failed to fetch metadata");
      });
  }, [searchId]);

  // Fetch instruments
  useEffect(() => {
    if (!metadata) return;

    if (variant === "option" || variant === "future") {
      if (!tradingSymbol) return;

      const params = new URLSearchParams({
        trading_symbol: tradingSymbol,
        search_id: searchId,
      });

      ApiClient.get(`/instruments?${params.toString()}`)
        .then((response) => {
          const fetchedInstruments = response.data.instruments;
          setInstruments(fetchedInstruments);

          // Set exchange from URL param if valid, otherwise use first instrument
          if (
            exchangeParam &&
            fetchedInstruments.some(
              (i: Instrument) => i.exchange === exchangeParam,
            )
          ) {
            setExchange(exchangeParam as Exchange);
          } else if (fetchedInstruments.length === 1) {
            setExchange(fetchedInstruments[0].exchange);
          }
        })
        .catch(() => {});
    } else {
      // stock or index
      if (!metadata.isin) return;

      const params = new URLSearchParams({
        isin: metadata.isin,
        search_id: searchId,
      });

      ApiClient.get(`/instruments?${params.toString()}`)
        .then((response) => {
          const fetchedInstruments = response.data.instruments;
          setInstruments(fetchedInstruments);

          // Set exchange from URL param if valid, otherwise use first instrument
          if (
            exchangeParam &&
            fetchedInstruments.some(
              (i: Instrument) => i.exchange === exchangeParam,
            )
          ) {
            setExchange(exchangeParam as Exchange);
          } else if (fetchedInstruments.length === 1) {
            setExchange(fetchedInstruments[0].exchange);
          }
        })
        .catch(() => {});
    }
  }, [metadata, variant, tradingSymbol, searchId]);

  // Fetch live data
  useEffect(() => {
    if (!currentInstrument) return;

    setLiveDataError(null);

    const params = new URLSearchParams({
      script_code: scriptCode,
      exchange: currentInstrument.exchange,
      type: type,
    });

    if (segment === "FNO") {
      params.append("segment", "FNO");
    }

    ApiClient.get(`/instruments/live-data?${params.toString()}`)
      .then((response) => {
        setLiveData(response.data.liveData);
        setLiveDataError(null);
      })
      .catch(() => {
        setLiveDataError("Failed to fetch live data");
      });
  }, [currentInstrument, exchange, scriptCode, type, segment]);

  // Fetch historical data
  useEffect(() => {
    if (!currentInstrument) return;

    setHistoricalDataError(null);

    const params = new URLSearchParams({
      script_code: scriptCode,
      exchange: currentInstrument.exchange,
      type: type,
      time_range: timeRange,
      segment: segment,
    });

    ApiClient.get(`/instruments/historical-data?${params.toString()}`)
      .then((response) => {
        setHistoricalData(response.data.historicalData);
        setHistoricalDataError(null);
      })
      .catch(() => {
        setHistoricalDataError("Failed to fetch historical data");
      });
  }, [currentInstrument, exchange, timeRange, scriptCode, type, segment]);

  // Set title based on variant
  useEffect(() => {
    if (!metadata) return;

    if (variant === "future" || variant === "option") {
      // Fetch title from search API
      ApiClient.get("/search", {
        params: { query: tradingSymbol, size: 1 },
      })
        .then((response) => {
          const { success, instruments } = response.data;
          if (!success || instruments.length === 0) {
            setTitle(metadata.displayName);
            return;
          }
          setTitle(instruments[0].title);
        })
        .catch(() => {
          setTitle(metadata.displayName);
        });
    } else {
      // stock or index - use displayName
      setTitle(metadata.displayName);
    }
  }, [metadata, variant, tradingSymbol]);

  const toggleWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your watchlist");
      return;
    }

    watchlist
      ? await removeWatchlistItem(watchlistItem.id)
      : await addWatchlistItem({
          instrumentType: type,
          searchId: searchId,
          tradingSymbol:
            segment === "FNO" ? (tradingSymbol as string) : undefined,
        });
  };

  const formatTimeStamp = (
    timestamp: number,
    format: "date" | "datetime" = "datetime",
  ) => {
    const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);

    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // convert to 12-hour format
    const isPM = hours24 >= 12;
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const hours = String(hours12);
    const ampm = isPM ? "pm" : "am";

    if (timeRange === "1D") {
      return `${hours}:${minutes} ${ampm}`;
    }

    if (
      format === "date" ||
      ["3M", "6M", "1Y", "3Y", "5Y", "ALL"].includes(timeRange)
    ) {
      return `${day} ${month} ${year}`;
    }

    return `${hours}:${minutes} ${ampm} | ${day} ${month} ${year}`;
  };

  const refetchHistoricalData = () => {
    setHistoricalDataError(null);
    setHistoricalData(null);
  };

  return {
    metadata,
    metadataError,
    instruments,
    currentInstrument,
    exchange,
    setExchange,
    liveData,
    liveDataError,
    historicalData,
    historicalDataError,
    timeRange,
    setTimeRange,
    type,
    scriptCode,
    currentPrice,
    positiveChange,
    changeValue,
    changePerc,
    title,
    watchlist,
    toggleWatchlist,
    formatTimeStamp,
    refetchHistoricalData,
    config,
    segment,
    availableTimeRanges,
  };
}
