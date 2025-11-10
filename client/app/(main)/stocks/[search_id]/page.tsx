"use client";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ApiClient from "@/utils/ApiClient";
import { CheckIcon, Link2Icon, PlusIcon, SaveIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdError } from "react-icons/md";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export default function StockPage() {
  const { search_id } = useParams();

  const [metadata, setMetadata] = useState<any>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<boolean>(false);
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [exchange, setExchange] = useState<Exchange>("NSE");
  const [liveData, setLiveData] = useState<any | null>(null);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any | null>(null);
  const [historicalDataError, setHistoricalDataError] = useState<string | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<HistoricalDataTimeRange>("1D");

  const currentInstrument: Instrument | null = useMemo(() => {
    if (!instruments) return null;
    return instruments.find((inst) => inst.exchange === exchange) || null;
  }, [instruments, exchange]);

  const scriptCode: string = useMemo(() => {
    if (!metadata) return "";
    return exchange === "NSE" ? metadata.nseScriptCode : metadata.bseScriptCode;
  }, [metadata, exchange]);

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

  // fetch metadata
  useEffect(() => {
    ApiClient.get(`/metadata?search_id=${search_id}`)
      .then((response) => {
        setMetadata(response.data);
        setMetadataError(null);
      })
      .catch(() => {
        setMetadataError("Failed to fetch metadata");
      });
  }, []);

  // fetch instruments
  useEffect(() => {
    if (!metadata || !metadata.isin) return;

    ApiClient.get(`/instruments?isin=${metadata.isin}`)
      .then((response) => {
        setInstruments(response.data.instruments);
      })
      .catch(() => {});
  }, [metadata]);

  // fetch live data
  useEffect(() => {
    if (!currentInstrument) return;

    setLiveDataError(null);
    ApiClient.get(
      `/instruments/live-data?script_code=${scriptCode}&exchange=${currentInstrument.exchange}&type=EQ`,
    )
      .then((response) => {
        setLiveData(response.data.liveData);
        setLiveDataError(null);
      })
      .catch(() => {
        setLiveDataError("Failed to fetch live data");
      });
  }, [currentInstrument, exchange]);

  // fetch historical data
  useEffect(() => {
    if (!currentInstrument) return;

    setHistoricalDataError(null);
    ApiClient.get(
      `/instruments/historical-data?script_code=${scriptCode}&exchange=${currentInstrument.exchange}&type=EQ&time_range=${timeRange}&segment=CASH`,
    )
      .then((response) => {
        setHistoricalData(response.data.historicalData);
        setHistoricalDataError(null);
      })
      .catch(() => {
        setHistoricalDataError("Failed to fetch historical data");
      });
  }, [currentInstrument, exchange, timeRange]);

  const toggleWatchlist = () => {
    setWatchlist(!watchlist);
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
    const hours = String(hours12); // no leading zero for 12-hour format
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

  return (
    <div className="w-full max-w-full px-4">
      {/* header */}
      <div className="flex flex-row flex-wrap justify-between gap-2 px-2 py-6">
        <div className="flex flex-col gap-2">
          {metadataError ? (
            <div className="border-destructive bg-destructive/10 flex items-center gap-2 rounded-lg border p-3">
              <MdError className="text-destructive size-5" />
              <span className="text-destructive text-sm">{metadataError}</span>
            </div>
          ) : metadata?.logoUrl ? (
            <img
              src={metadata.logoUrl}
              alt={metadata.searchId ?? "searchId"}
              className="size-20 rounded-lg"
            />
          ) : (
            <Skeleton className="size-20 rounded-lg" />
          )}
          {metadata?.displayName ? (
            <span className="text-2xl font-semibold">
              {metadata.displayName}
            </span>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          <div className="flex flex-row items-baseline gap-2 text-sm">
            {liveDataError ? (
              <div className="border-destructive bg-destructive/10 flex items-center gap-2 rounded border px-2 py-1">
                <MdError className="text-destructive size-4" />
                <span className="text-destructive text-xs">
                  {liveDataError}
                </span>
              </div>
            ) : liveData ? (
              <>
                <span className="text-3xl font-bold">₹{liveData.ltp}</span>
                <span
                  className={
                    positiveChange ? "text-green-600" : "text-destructive"
                  }
                >
                  {positiveChange && "+"}
                  {changeValue.toFixed(2)} ({changePerc.toFixed(2)}%)
                </span>
                {timeRange}
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-24" />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-wrap items-end gap-2">
          <Button
            variant={watchlist ? "default" : "outline"}
            onClick={toggleWatchlist}
            size={"sm"}
            disabled={!metadata}
          >
            <SaveIcon />
            Watchlist
            {watchlist ? <CheckIcon /> : <PlusIcon />}
          </Button>
          <Button size={"sm"} variant={"link"} disabled={!metadata}>
            <Link2Icon />
            Option Chain
          </Button>
          <div className="flex flex-row gap-2">
            <Button
              size={"sm"}
              variant={exchange === "NSE" ? "default" : "outline"}
              onClick={() => {
                setExchange("NSE");
              }}
              disabled={!instruments}
            >
              NSE
            </Button>
            <Button
              size={"sm"}
              variant={exchange === "BSE" ? "default" : "outline"}
              onClick={() => {
                setExchange("BSE");
              }}
              disabled={!instruments}
            >
              BSE
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* chart */}
      <div className="flex flex-row flex-wrap justify-center gap-4 py-6">
        {historicalDataError ? (
          <div className="border-destructive bg-destructive/10 flex h-[400px] w-full items-center justify-center rounded-lg border">
            <div className="flex flex-col items-center gap-3">
              <MdError className="text-destructive size-12" />
              <span className="text-destructive text-lg font-medium">
                {historicalDataError}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setHistoricalDataError(null);
                  // Trigger refetch by setting historicalData to null
                  setHistoricalData(null);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : historicalData?.candles ? (
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: positiveChange ? "var(--primary)" : "var(--destructive)",
              },
            }}
            className="h-[400px] w-full"
          >
            <LineChart
              data={historicalData.candles.map((candle: any) => ({
                timestamp: candle[0],
                formattedTime: formatTimeStamp(candle[0], "date"),
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
                price: candle[4], // close price for the chart
              }))}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="formattedTime"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `₹${value}`}
                domain={["auto", "auto"]}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl">
                      <div className="mb-2 text-xs font-medium">
                        {formatTimeStamp(data.timestamp)}
                      </div>
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-mono font-medium">
                          ₹{Number(data.close).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <Skeleton className="h-[400px] w-full rounded-lg" />
        )}
        <Separator />
        <div className="mb-4 flex flex-row gap-2">
          {(
            [
              "1D",
              "1W",
              "1M",
              "3M",
              "6M",
              "1Y",
              "3Y",
              "5Y",
              "ALL",
            ] as HistoricalDataTimeRange[]
          ).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              disabled={!historicalData}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
